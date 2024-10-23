async function fetchChurnData() {
    const response = await fetch('http://127.0.0.1:3730/api/churn');
    const data = await response.json();
    renderChurnChart(data);
}

async function fetchAgeDistribution() {
    const response = await fetch('http://127.0.0.1:3730/api/age-distribution');
    const data = await response.json();
    renderAgeChart(data);
}

async function fetchChurnByBranch() {
    const response = await fetch('http://127.0.0.1:3730/api/churn-by-branch');
    const data = await response.json();
    renderBranchChart(data);
}

async function fetchChurnByProduct() {
    try {
        const response = await fetch('http://127.0.0.1:3730/api/churn-by-product');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderChurnByProduct(data); // Updated to use new function
    } catch (error) {
        console.error('Error fetching churn by product:', error);
    }
}

function renderChurnChart(data) {
    const churned = data.churned;
    const notChurned = data.notChurned;

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
}

function renderAgeChart(data) {
    new Chart(document.getElementById('ageChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Age Distribution',
                data: Object.values(data),
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 1
            }]
        }
    });
}

function renderBranchChart(data) {
    const labels = Object.keys(data);
    const churned = labels.map(label => data[label].churned);
    const notChurned = labels.map(label => data[label].notChurned);

    new Chart(document.getElementById('branchChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Churned',
                    data: churned,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                },
                {
                    label: 'Not Churned',
                    data: notChurned,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render Churn by Product
function renderChurnByProduct(data) {
    const labels = Object.keys(data);
    const churned = labels.map(label => data[label].churned);
    const notChurned = labels.map(label => data[label].notChurned);

    new Chart(document.getElementById('productChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Churned',
                    data: churned,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                },
                {
                    label: 'Not Churned',
                    data: notChurned,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function fetchMonthlyCharges() {
    const response = await fetch('http://127.0.0.1:3730/api/monthly-charges');
    const data = await response.json();
    renderMonthlyChargesHistogram(data);
}

// Render Monthly Charges histogram
function renderMonthlyChargesHistogram(data) {
    const churned = data.filter(item => item.customer_churn === 1).map(item => item.price);
    const notChurned = data.filter(item => item.customer_churn === 0).map(item => item.price);

    const churnedData = getHistogramData(churned, 10);
    const notChurnedData = getHistogramData(notChurned, 10);
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
}

// Helper function to get histogram data
function getHistogramData(data, bins) {
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
}

// Fetch all data
async function fetchData() {
    await fetchChurnData();
    await fetchAgeDistribution();
    await fetchChurnByBranch();
    await fetchChurnByProduct();
    await fetchMonthlyCharges();
}

// Call the fetchData function when the script loads
fetchData();
