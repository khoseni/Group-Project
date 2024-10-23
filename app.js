function app() {
    return {
        data: [],
        loading: true,
        charts: {},

        fetchData() {
            fetch('http://localhost:3730/api/predict-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})  // Adjust if you need to send specific data
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                this.data = data;  // Make sure this matches the structure from churn.py
                this.loading = false;
                this.updateCharts();
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                this.loading = false;
            });
        },

        updateCharts() {
            this.updateChurnChart();
            this.updateCreditScoreHistogram();
            this.updateTenureHistogram();
            this.updateAmountVsPriceLine();
            this.updateBranchChurnBar();
            this.updateProductCategoryPie();
            this.updateKDECharts();
        },

        destroyChart(chartName) {
            if (this.charts[chartName]) {
                this.charts[chartName].destroy();
                delete this.charts[chartName];
            }
        },

        updateChurnChart() {
            const churnCount = this.data.filter(customer => customer.churn === 1).length;
            const notChurnCount = this.data.length - churnCount;

            const ctx = document.getElementById('churnChart').getContext('2d');
            this.destroyChart('churn');

            this.charts.churn = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Churn', 'Not Churn'],
                    datasets: [{
                        label: 'Churn Prediction',
                        data: [churnCount, notChurnCount],
                        backgroundColor: ['#ff6384', '#36a2eb'],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ' + context.raw;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateCreditScoreHistogram() {
            const ctx = document.getElementById('creditScoreHistogram').getContext('2d');

            const churnedScores = this.data
                .filter(customer => customer.churn === 1)
                .map(customer => customer.credit_score);
            const notChurnedScores = this.data
                .filter(customer => customer.churn === 0)
                .map(customer => customer.credit_score);

            const bins = 10;
            const histogramData = [new Array(bins).fill(0), new Array(bins).fill(0)];
            const minScore = Math.min(...this.data.map(customer => customer.credit_score));
            const maxScore = Math.max(...this.data.map(customer => customer.credit_score));
            const binSize = (maxScore - minScore) / bins;

            churnedScores.forEach(score => {
                const binIndex = Math.floor((score - minScore) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[0][binIndex]++;
                }
            });

            notChurnedScores.forEach(score => {
                const binIndex = Math.floor((score - minScore) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[1][binIndex]++;
                }
            });

            const labels = [];
            for (let i = 0; i < bins; i++) {
                labels.push(Math.round(minScore + i * binSize) + ' - ' + Math.round(minScore + (i + 1) * binSize));
            }

            this.destroyChart('creditScoreHistogram');

            this.charts.creditScoreHistogram = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned (Yes)',
                            data: histogramData[0],
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churned (No)',
                            data: histogramData[1],
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });

            // Adding value labels on top of bars
            this.charts.creditScoreHistogram.data.datasets.forEach((dataset, datasetIndex) => {
                const chart = this.charts.creditScoreHistogram;
                chart.update(); // Update the chart first to get correct heights
                chart.ctx.textAlign = 'center';
                dataset.data.forEach((value, index) => {
                    const height = chart.getDatasetMeta(datasetIndex).data[index].y; // Get the y position of the bar
                    const x = chart.getDatasetMeta(datasetIndex).data[index].x; // Get the x position of the bar
                    chart.ctx.fillText(value, x, height - 5); // Draw the label above the bar
                });
            });
        },

        updateTenureHistogram() {
            const ctx = document.getElementById('tenureHistogram').getContext('2d');
            const churnedTenure = this.data.filter(customer => customer.churn === 1).map(customer => customer.tenure);
            const notChurnedTenure = this.data.filter(customer => customer.churn === 0).map(customer => customer.tenure);

            const bins = 10;
            const histogramData = [new Array(bins).fill(0), new Array(bins).fill(0)];
            const minTenure = Math.min(...this.data.map(customer => customer.tenure));
            const maxTenure = Math.max(...this.data.map(customer => customer.tenure));
            const binSize = (maxTenure - minTenure) / bins;

            churnedTenure.forEach(tenure => {
                const binIndex = Math.floor((tenure - minTenure) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[0][binIndex]++;
                }
            });

            notChurnedTenure.forEach(tenure => {
                const binIndex = Math.floor((tenure - minTenure) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[1][binIndex]++;
                }
            });

            const labels = [];
            for (let i = 0; i < bins; i++) {
                labels.push(Math.round(minTenure + i * binSize) + ' - ' + Math.round(minTenure + (i + 1) * binSize));
            }

            this.destroyChart('tenureHistogram');

            this.charts.tenureHistogram = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned (Yes)',
                            data: histogramData[0],
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churned (No)',
                            data: histogramData[1],
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateAmountVsPriceLine() {
            const ctx = document.getElementById('amountVsPrice').getContext('2d');

            const churnedData = this.data.filter(customer => customer.churn === 1);
            const notChurnedData = this.data.filter(customer => customer.churn === 0);

            const churnedX = churnedData.map(customer => customer.amount);
            const churnedY = churnedData.map(customer => customer.price);
            const notChurnedX = notChurnedData.map(customer => customer.amount);
            const notChurnedY = notChurnedData.map(customer => customer.price);

            this.destroyChart('amountVsPrice');

            this.charts.amountVsPrice = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: churnedX.concat(notChurnedX),
                    datasets: [
                        {
                            label: 'Churned Customers',
                            data: churnedY,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            fill: false
                        },
                        {
                            label: 'Not Churned Customers',
                            data: notChurnedY,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateBranchChurnBar() {
            const ctx = document.getElementById('branchChurnBar').getContext('2d');

            const branchChurn = this.data.reduce((acc, customer) => {
                acc[customer.branch] = acc[customer.branch] || { churned: 0, total: 0 };
                acc[customer.branch].total++;
                if (customer.churn === 1) {
                    acc[customer.branch].churned++;
                }
                return acc;
            }, {});

            const labels = Object.keys(branchChurn);
            const churnCounts = labels.map(branch => branchChurn[branch].churned);
            const totalCounts = labels.map(branch => branchChurn[branch].total);

            this.destroyChart('branchChurnBar');

            this.charts.branchChurnBar = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned Customers',
                            data: churnCounts,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Total Customers',
                            data: totalCounts,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateProductCategoryPie() {
            const ctx = document.getElementById('productCategoryPie').getContext('2d');

            const categoryChurn = this.data.reduce((acc, customer) => {
                acc[customer.product_category] = acc[customer.product_category] || { churned: 0, total: 0 };
                acc[customer.product_category].total++;
                if (customer.churn === 1) {
                    acc[customer.product_category].churned++;
                }
                return acc;
            }, {});

            const labels = Object.keys(categoryChurn);
            const churnedCounts = labels.map(category => categoryChurn[category].churned);
            const notChurnedCounts = labels.map(category => categoryChurn[category].total - categoryChurn[category].churned);

            this.destroyChart('productCategoryPie');

            this.charts.productCategoryPie = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churn Count',
                            data: churnedCounts,
                            backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'],
                            hoverOffset: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateKDECharts() {
            // Implement KDE chart updates here if needed.
            // This function can be implemented similarly to the histogram updates above
        },

        init() {
            this.fetchData();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const appInstance = app();
    appInstance.init();
});
function app() {
    return {
        data: [],
        loading: true,
        charts: {},

        fetchData() {
            fetch('http://localhost:3730/api/predict-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                this.data = data;
                this.loading = false;
                this.updateCharts();
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                this.loading = false;
            });
        },

        updateCharts() {
            this.updateChurnChart();
            this.updateCreditScoreHistogram();
            this.updateTenureHistogram();
            this.updateAmountVsPriceLine();
            this.updateBranchChurnBar();
            this.updateProductCategoryPie();
        },

        destroyChart(chartName) {
            if (this.charts[chartName]) {
                this.charts[chartName].destroy();
                delete this.charts[chartName];
            }
        },

        updateChurnChart() {
            const churnCount = this.data.filter(customer => customer.churn === 1).length;
            const notChurnCount = this.data.length - churnCount;

            const ctx = document.getElementById('churnChart').getContext('2d');
            this.destroyChart('churn');

            this.charts.churn = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Churn', 'Not Churn'],
                    datasets: [{
                        label: 'Churn Prediction',
                        data: [churnCount, notChurnCount],
                        backgroundColor: ['#ff6384', '#36a2eb'],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ' + context.raw;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateCreditScoreHistogram() {
            const ctx = document.getElementById('creditScoreHistogram').getContext('2d');

            const churnedScores = this.data
                .filter(customer => customer.churn === 1)
                .map(customer => customer.credit_score);
            const notChurnedScores = this.data
                .filter(customer => customer.churn === 0)
                .map(customer => customer.credit_score);

            const bins = 10;
            const histogramData = [new Array(bins).fill(0), new Array(bins).fill(0)];
            const minScore = Math.min(...this.data.map(customer => customer.credit_score));
            const maxScore = Math.max(...this.data.map(customer => customer.credit_score));
            const binSize = (maxScore - minScore) / bins;

            churnedScores.forEach(score => {
                const binIndex = Math.floor((score - minScore) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[0][binIndex]++;
                }
            });

            notChurnedScores.forEach(score => {
                const binIndex = Math.floor((score - minScore) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[1][binIndex]++;
                }
            });

            const labels = [];
            for (let i = 0; i < bins; i++) {
                labels.push(Math.round(minScore + i * binSize) + ' - ' + Math.round(minScore + (i + 1) * binSize));
            }

            this.destroyChart('creditScoreHistogram');

            this.charts.creditScoreHistogram = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned (Yes)',
                            data: histogramData[0],
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churned (No)',
                            data: histogramData[1],
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateTenureHistogram() {
            const ctx = document.getElementById('tenureHistogram').getContext('2d');
            const churnedTenure = this.data.filter(customer => customer.churn === 1).map(customer => customer.tenure);
            const notChurnedTenure = this.data.filter(customer => customer.churn === 0).map(customer => customer.tenure);

            const bins = 10;
            const histogramData = [new Array(bins).fill(0), new Array(bins).fill(0)];
            const minTenure = Math.min(...this.data.map(customer => customer.tenure));
            const maxTenure = Math.max(...this.data.map(customer => customer.tenure));
            const binSize = (maxTenure - minTenure) / bins;

            churnedTenure.forEach(tenure => {
                const binIndex = Math.floor((tenure - minTenure) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[0][binIndex]++;
                }
            });

            notChurnedTenure.forEach(tenure => {
                const binIndex = Math.floor((tenure - minTenure) / binSize);
                if (binIndex >= 0 && binIndex < bins) {
                    histogramData[1][binIndex]++;
                }
            });

            const labels = [];
            for (let i = 0; i < bins; i++) {
                labels.push(Math.round(minTenure + i * binSize) + ' - ' + Math.round(minTenure + (i + 1) * binSize));
            }

            this.destroyChart('tenureHistogram');

            this.charts.tenureHistogram = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned (Yes)',
                            data: histogramData[0],
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churned (No)',
                            data: histogramData[1],
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateAmountVsPriceLine() {
            const ctx = document.getElementById('amountVsPrice').getContext('2d');

            const churnedData = this.data.filter(customer => customer.churn === 1);
            const notChurnedData = this.data.filter(customer => customer.churn === 0);

            const churnedX = churnedData.map(customer => customer.amount);
            const churnedY = churnedData.map(customer => customer.price);
            const notChurnedX = notChurnedData.map(customer => customer.amount);
            const notChurnedY = notChurnedData.map(customer => customer.price);

            this.destroyChart('amountVsPrice');

            this.charts.amountVsPrice = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: churnedX.concat(notChurnedX),
                    datasets: [
                        {
                            label: 'Churned Customers',
                            data: churnedY,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            fill: false
                        },
                        {
                            label: 'Not Churned Customers',
                            data: notChurnedY,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateBranchChurnBar() {
            const ctx = document.getElementById('branchChurnBar').getContext('2d');

            const branchChurn = this.data.reduce((acc, customer) => {
                acc[customer.branch] = acc[customer.branch] || { churned: 0, total: 0 };
                acc[customer.branch].total++;
                if (customer.churn === 1) {
                    acc[customer.branch].churned++;
                }
                return acc;
            }, {});

            const labels = Object.keys(branchChurn);
            const churnCounts = labels.map(branch => branchChurn[branch].churned);
            const totalCounts = labels.map(branch => branchChurn[branch].total);

            this.destroyChart('branchChurnBar');

            this.charts.branchChurnBar = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned Customers',
                            data: churnCounts,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Total Customers',
                            data: totalCounts,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        updateProductCategoryPie() {
            const ctx = document.getElementById('productCategoryPie').getContext('2d');

            const categoryChurn = this.data.reduce((acc, customer) => {
                acc[customer.product_category] = acc[customer.product_category] || { churned: 0, total: 0 };
                acc[customer.product_category].total++;
                if (customer.churn === 1) {
                    acc[customer.product_category].churned++;
                }
                return acc;
            }, {});

            const labels = Object.keys(categoryChurn);
            const churnedCounts = labels.map(category => categoryChurn[category].churned);
            const notChurnedCounts = labels.map(category => categoryChurn[category].total - categoryChurn[category].churned);

            this.destroyChart('productCategoryPie');

            this.charts.productCategoryPie = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churn Count',
                            data: churnedCounts,
                            backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'],
                            hoverOffset: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        },

        init() {
            this.fetchData();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const appInstance = app();
    appInstance.init();
});
