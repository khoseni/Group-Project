async function fetchChurnData() {
    const response = await fetch('http://localhost:3730/api/churn');
    return await response.json();
}

async function fetchCreditScoreDistribution() {
    const response = await fetch('http://localhost:3730/api/credit-score-distribution');
    return await response.json();
}

async function fetchTenureDistribution() {
    const response = await fetch('http://localhost:3730/api/tenure-distribution');
    return await response.json();
}

async function fetchChurnByBranch() {
    const response = await fetch('http://localhost:3730/api/churn-by-branch');
    return await response.json();
}

async function renderCharts() {
    const churnData = await fetchChurnData();
    const creditScoreData = await fetchCreditScoreDistribution();
    const tenureData = await fetchTenureDistribution();
    const branchChurnData = await fetchChurnByBranch();

    // Churn Chart
    const ctxChurn = document.getElementById('churnChart').getContext('2d');
    new Chart(ctxChurn, {
        type: 'pie',
        data: {
            labels: ['Churned', 'Not Churned'],
            datasets: [{
                label: 'Customer Churn',
                data: [churnData.churned, churnData.notChurned],
                backgroundColor: ['#ff6384', '#36a2eb'],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    // Credit Score Distribution Chart as a Line Graph
    const ctxCreditScore = document.getElementById('creditScoreChart').getContext('2d');
    new Chart(ctxCreditScore, {
        type: 'line',
        data: {
            labels: Object.keys(creditScoreData),
            datasets: [{
                label: 'Credit Score Distribution',
                data: Object.values(creditScoreData),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: '#36a2eb',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 80 // Set maximum value of y-axis to 100
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    // Tenure Distribution Chart as a Bar Graph
    const ctxTenure = document.getElementById('tenureChart').getContext('2d');
    new Chart(ctxTenure, {
        type: 'bar',
        data: {
            labels: Object.keys(tenureData),
            datasets: [{
                label: 'Tenure Distribution',
                data: Object.values(tenureData),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: '#4bc0c0',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 900 // Set maximum value of y-axis to 900
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    // Branch Churn Chart as a Bar Graph
    const ctxBranchChurn = document.getElementById('branchChurnChart').getContext('2d');
    new Chart(ctxBranchChurn, {
        type: 'bar',
        data: {
            labels: Object.keys(branchChurnData),
            datasets: [
                {
                    label: 'Churned',
                    data: Object.values(branchChurnData).map(item => item.churned),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: '#ff6384',
                    borderWidth: 2
                },
                {
                    label: 'Not Churned',
                    data: Object.values(branchChurnData).map(item => item.notChurned),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: '#36a2eb',
                    borderWidth: 2
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCharts();
});

