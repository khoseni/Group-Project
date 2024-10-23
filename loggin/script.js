// Login form functionality
function loginForm() {
  return {
      email: '',
      password: '',
      handleSubmit() {
          console.log(`Email: ${this.email}, Password: ${this.password}`);
      },
      forgotPassword() {
          alert('Forgot Password clicked!');
      }
  };
}

// Toggle submenu visibility
function toggleSubMenu() {
  const submenu = document.getElementById('submenu');
  submenu.classList.toggle('hidden');
}

// Customer data management
function customerData() {
  return {
      customers: [],
      async fetchData() {
          try {
              const response = await axios.get('http://localhost:3730/api/customers');
              this.customers = response.data;
          } catch (error) {
              console.error('Error fetching data:', error);
          }
      },
      async deleteCustomer(customerId) {
          try {
              await axios.post('http://localhost:3730/api/delete', { customerId });
              console.log('Customer deleted');
              // Optionally refresh the data or update the UI
          } catch (error) {
              console.error('Error deleting customer:', error);
          }
      }
  };
}

// Dashboard functionality (for html machine learning)
function dashboard() {
    return {
        charts: {}, // Store chart instances

        async init() {
            const response = await fetch('/api/data');
            const data = await response.json();
            this.renderChurnChart(data);
            this.renderAgeChart(data);
            this.renderBranchChart(data);
            this.renderDistributionCharts(data);
            this.renderCountPlot(data, 'product_category', 'customer_churn', 'Product Category vs Customer Churn');
            this.renderMonthlyChargesHistogram(data);
        },

        // Render churn chart
        renderChurnChart(data) {
            const churned = data.filter(item => item.customer_churn === 1).length;
            const notChurned = data.length - churned;

            new Chart(document.getElementById('churnChart'), {
                type: 'bar',
                data: {
                    labels: ['Churned', 'Not Churned'],
                    datasets: [{
                        label: 'Customer Churn',
                        data: [churned, notChurned],
                        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        // Render age distribution chart
        renderAgeChart(data) {
            const ageDistribution = data.reduce((acc, item) => {
                const ageGroup = item.age < 30 ? 'Under 30' : item.age < 50 ? '30-49' : '50 and above';
                acc[ageGroup] = (acc[ageGroup] || 0) + 1;
                return acc;
            }, {});

            new Chart(document.getElementById('ageChart'), {
                type: 'pie',
                data: {
                    labels: Object.keys(ageDistribution),
                    datasets: [{
                        label: 'Age Distribution',
                        data: Object.values(ageDistribution),
                        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                        borderWidth: 1
                    }]
                }
            });
        },

        // Render churned customers by branch chart
        renderBranchChart(data) {
            const churnByBranch = data.reduce((acc, item) => {
                if (!acc[item.branch]) {
                    acc[item.branch] = { churned: 0, notChurned: 0 };
                }
                if (item.customer_churn === 1) {
                    acc[item.branch].churned += 1;
                } else {
                    acc[item.branch].notChurned += 1;
                }
                return acc;
            }, {});

            new Chart(document.getElementById('branchChart'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(churnByBranch),
                    datasets: [{
                        label: 'Churned Customers by Branch',
                        data: Object.values(churnByBranch).map(branch => branch.churned),
                        backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 205, 86, 0.2)'],
                        borderColor: ['rgba(255, 159, 64, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 205, 86, 1)'],
                        borderWidth: 1
                    }]
                }
            });
        },

        // Render distribution charts for numerical features
        renderDistributionCharts(data) {
            const numericColumns = ['age', 'ratings', 'tenure', 'tax_amount', 'credit_score', 'price', 'number_of_products'];
            const container = document.getElementById('charts-container');
            container.innerHTML = '';

            numericColumns.forEach(column => {
                const canvas = document.createElement('canvas');
                canvas.id = column + 'Chart';
                container.appendChild(canvas);

                const distributionData = data.map(item => item[column]);
                const skewness = this.calculateSkewness(distributionData);

                new Chart(canvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: distributionData.map((_, i) => i + 1),
                        datasets: [{
                            label: `${column} (Skewness: ${skewness.toFixed(2)})`,
                            data: distributionData,
                            backgroundColor: 'rgba(0, 128, 128, 0.2)',
                            borderColor: 'rgba(0, 128, 128, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Index'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: column.charAt(0).toUpperCase() + column.slice(1)
                                }
                            }
                        }
                    }
                });
            });
        },

        // Render count plot for product category vs customer churn as a bar graph
        renderCountPlot(data, column, hue, suptitle) {
            const counts = {};
            
            data.forEach(item => {
                const key = item[column];
                const hueValue = item[hue];
                
                if (!counts[key]) {
                    counts[key] = { churned: 0, notChurned: 0 };
                }
                if (hueValue === 1) {
                    counts[key].churned++;
                } else {
                    counts[key].notChurned++;
                }
            });

            const labels = Object.keys(counts);
            const churnedData = labels.map(label => counts[label].churned);
            const notChurnedData = labels.map(label => counts[label].notChurned);

            new Chart(document.getElementById('countPlot'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned Customers',
                            data: churnedData,
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churned Customers',
                            data: notChurnedData,
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        x: {
                            title: {
                                display: true,
                                text: column
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: suptitle
                        }
                    }
                }
            });
        },

        // Render Monthly Charges histogram
        renderMonthlyChargesHistogram(data) {
            const churned = data.filter(item => item.customer_churn === 1).map(item => item.price);
            const notChurned = data.filter(item => item.customer_churn === 0).map(item => item.price);

            const churnedData = this.getHistogramData(churned, 10);
            const notChurnedData = this.getHistogramData(notChurned, 10);
            const labels = Array.from({ length: 10 }, (_, i) => ((i + 1) * (Math.max(...data.map(item => item.price)) / 10)).toFixed(2));

            new Chart(document.getElementById('monthlyChargesHistogram'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Churned Customers',
                            data: churnedData,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churned Customers',
                            data: notChurnedData,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Monthly Charges'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Frequency'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Monthly Charges by Churn'
                        }
                    }
                }
            });
        },

        // Helper function to get histogram data
        getHistogramData(data, bins) {
            const histogram = new Array(bins).fill(0);
            const max = Math.max(...data);
            const min = Math.min(...data);
            const binWidth = (max - min) / bins;

            data.forEach(value => {
                const index = Math.floor((value - min) / binWidth);
                if (index >= 0 && index < bins) {
                    histogram[index]++;
                }
            });

            return histogram;
        },

        // Calculate skewness of data
        calculateSkewness(data) {
            const n = data.length;
            const mean = data.reduce((sum, value) => sum + value, 0) / n;
            const skewness = data.reduce((sum, value) => sum + Math.pow(value - mean, 3), 0) / n;
            const stdDev = Math.sqrt(data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / n);
            return skewness / Math.pow(stdDev, 3);
        }
    };
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = dashboard();
    app.init();
});


/*
***********************************
Prediction.html (Machine learning)
***********************************
*/

function app() {
    return {
        data: [],
        loading: true,
        charts: {},

        fetchData() {
            fetch('http://localhost:3730/api/predict-all', {
                method: 'POST'
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

            const labels = this.data.map(customer => customer.customer_id);
            const totalAmountData = this.data.map(customer => customer.total_amount);
            const priceData = this.data.map(customer => customer.price);

            this.destroyChart('amountVsPrice');

            this.charts.amountVsPrice = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Amount',
                            data: totalAmountData,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false
                        },
                        {
                            label: 'Price',
                            data: priceData,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { beginAtZero: true }
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

        updateBranchChurnBar() {
            const ctx = document.getElementById('branchChurnBar').getContext('2d');

            const branchChurnCount = this.data.reduce((acc, customer) => {
                acc[customer.branch] = acc[customer.branch] || { churn: 0, notChurn: 0 };
                if (customer.churn === 1) {
                    acc[customer.branch].churn += 1;
                } else {
                    acc[customer.branch].notChurn += 1;
                }
                return acc;
            }, {});

            const branches = Object.keys(branchChurnCount);
            const churnCounts = branches.map(branch => branchChurnCount[branch].churn);
            const notChurnCounts = branches.map(branch => branchChurnCount[branch].notChurn);

            this.destroyChart('branchChurnBar');

            this.charts.branchChurnBar = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: branches,
                    datasets: [
                        {
                            label: 'Churn',
                            data: churnCounts,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Not Churn',
                            data: notChurnCounts,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { beginAtZero: true }
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

            const categoryCounts = this.data.reduce((acc, customer) => {
                acc[customer.product_category] = (acc[customer.product_category] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(categoryCounts);
            const data = Object.values(categoryCounts);

            this.destroyChart('productCategoryPie');

            this.charts.productCategoryPie = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Product Category Distribution',
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)',
                            'rgba(255, 159, 64, 0.5)'
                        ],
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
                                        label += ': ' + context.raw + ' (' + Math.round(context.raw / data.reduce((a, b) => a + b, 0) * 100) + '%)';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        },

        calculateDensity(data, range, bandwidth) {
            const density = new Array(range.length).fill(0);
            data.forEach(point => {
                range.forEach((value, index) => {
                    density[index] += Math.exp(-0.5 * Math.pow((point - value) / bandwidth, 2));
                });
            });
            const total = density.reduce((sum, value) => sum + value, 0);
            return density.map(value => value / (total * bandwidth * Math.sqrt(2 * Math.PI)));
        },

        createKDEChart(ctx, data0, data1, label0, label1, title, xlabel) {
            const range = Array.from({ length: 100 }, (_, i) => i / 10);
            const bandwidth = 1;

            const density0 = this.calculateDensity(data0, range, bandwidth);
            const density1 = this.calculateDensity(data1, range, bandwidth);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: range,
                    datasets: [
                        {
                            label: label0,
                            data: density0,
                            borderColor: '#008080',
                            fill: true,
                            backgroundColor: 'rgba(0, 128, 128, 0.3)',
                        },
                        {
                            label: label1,
                            data: density1,
                            borderColor: '#FF6347',
                            fill: true,
                            backgroundColor: 'rgba(255, 99, 71, 0.3)',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { title: { display: true, text: xlabel } },
                        y: { title: { display: true, text: 'Density' } }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: title }
                    }
                }
            });
        },

        updateKDECharts() {
            const tenureNotChurn = this.data.filter(customer => customer.churn === 0).map(customer => customer.tenure);
            const tenureChurn = this.data.filter(customer => customer.churn === 1).map(customer => customer.tenure);

            const ctx = document.getElementById('tenureKDEChart').getContext('2d');

            this.destroyChart('tenureKDE');

            this.charts.tenureKDE = this.createKDEChart(ctx, tenureNotChurn, tenureChurn, 'Not Churn', 'Churn', 'Distribution of Tenure by Churn', 'Tenure');
        }
    };
}

// Initialize app on window load
window.onload = () => {
    const myApp = app();
    myApp.fetchData();
};







