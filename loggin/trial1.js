document.addEventListener('DOMContentLoaded', function() {
    const loadMoreButton = document.getElementById('load-more');
    const dataBody = document.getElementById('data-body');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    let currentPage = 1;
    let allCustomers = []; // Store all customer data

    // Function to fetch and display data
    function loadData() {
        fetch(`/api/data?page=${currentPage}`)
            .then(response => response.json())
            .then(data => {
                allCustomers = [...allCustomers, ...data]; // Store all customers
                renderData(allCustomers); // Render all data
                currentPage++; // Increment page number for next load
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Function to render customer data
    function renderData(customers) {
        dataBody.innerHTML = ''; // Clear the table body
        customers.forEach(customer => {
            const template = document.getElementById('row-template').content.cloneNode(true);
            template.querySelector('.row-number').textContent = customer.row_number;
            template.querySelector('.branch').textContent = customer.branch;
            template.querySelector('.customer-id').textContent = customer.customer_id;
            template.querySelector('.gender').textContent = customer.gender;
            template.querySelector('.age').textContent = customer.age;
            template.querySelector('.customer-type').textContent = customer.customer_type;
            template.querySelector('.credit-score').textContent = customer.credit_score;
            template.querySelector('.has-creditcard').textContent = customer.has_creditcard ? 'Yes' : 'No';
            template.querySelector('.is-active-member').textContent = customer.is_active_member ? 'Yes' : 'No';
            template.querySelector('.product-category').textContent = customer.product_category;
            template.querySelector('.ratings').textContent = customer.ratings;
            template.querySelector('.customer-churn').textContent = customer.customer_churn ? 'Yes' : 'No';
            template.querySelector('.tenure').textContent = customer.tenure;

            // Append the populated template to the table body
            dataBody.appendChild(template);
        });
    }

    // Search functionality
    searchButton.addEventListener('click', () => {
        const searchValue = searchInput.value.trim();
        const rows = dataBody.querySelectorAll('tr'); // Select all rows

        rows.forEach(row => {
            row.classList.remove('highlight'); // Remove highlight from all rows
        });

        if (searchValue) {
            rows.forEach(row => {
                const customerId = row.querySelector('.customer-id').textContent;
                if (customerId.includes(searchValue)) {
                    row.classList.add('highlight'); // Add highlight to matching row
                }
            });
        }
    });

    // Load initial data
    loadData();

    // Load more data on button click
    loadMoreButton.addEventListener('click', loadData);
});
