from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Allow all origins

# Load the dataset
dataset = pd.read_csv('archivetempsupermarket_churnData.csv').drop_duplicates().to_dict(orient='records')

def save_dataset():
    pd.DataFrame(dataset).drop_duplicates().to_csv('archivetempsupermarket_churnData.csv', index=False)


    # Load the dataset
try:
    df = pd.read_csv('archivetempsupermarket_churnData.csv').drop_duplicates()
except FileNotFoundError:
    df = pd.DataFrame()  # Initialize as empty DataFrame if file not found
except pd.errors.EmptyDataError:
    df = pd.DataFrame()  # Initialize as empty DataFrame if file is empty
except Exception as e:
    print(f"An error occurred: {e}")
    df = pd.DataFrame()  # Initialize as empty DataFrame for other exceptions


@app.route('/api/data', methods=['GET'])
def get_data():
    page = int(request.args.get('page', 1))
    per_page = 10
    start = (page - 1) * per_page
    end = start + per_page
    if start >= len(dataset):
        return jsonify([])  # Return empty if the page is out of range
    return jsonify(dataset[start:end])

@app.route('/api/data/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    global dataset
    initial_length = len(dataset)
    dataset = [customer for customer in dataset if customer['customer_id'] != customer_id]
    if len(dataset) == initial_length:
        return jsonify({"error": "Customer not found"}), 404
    save_dataset()  # Save changes to CSV
    return jsonify({'message': 'Customer deleted successfully'}), 200

@app.route('/api/churn', methods=['GET'])
def get_churn_data():
    churned = sum(1 for customer in dataset if customer['customer_churn'] == 1)
    not_churned = len(dataset) - churned
    return jsonify({'churned': churned, 'notChurned': not_churned})

@app.route('/api/age-distribution', methods=['GET'])
def get_age_distribution():
    age_distribution = {}
    for customer in dataset:
        if customer['age'] < 30:
            group = 'Under 30'
        elif customer['age'] < 50:
            group = '30-49'
        else:
            group = '50 and above'
        
        age_distribution[group] = age_distribution.get(group, 0) + 1

    return jsonify(age_distribution)
    

@app.route('/api/churn-by-branch', methods=['GET'])
def get_churn_by_branch():
    churn_by_branch = {}
    
    for customer in dataset:
        branch = str(customer['branch'])  # Ensure branch is a string
        if branch not in churn_by_branch:
            churn_by_branch[branch] = {'churned': 0, 'notChurned': 0}
        
        if customer['customer_churn'] == 1:
            churn_by_branch[branch]['churned'] += 1
        else:
            churn_by_branch[branch]['notChurned'] += 1
    
    return jsonify(churn_by_branch)

@app.route('/api/churn-by-product', methods=['GET'])
def get_churn_by_product():
    counts = {}
    
    for customer in dataset:
        product_category = str(customer['product_category'])  # Ensure the key is a string
        churned = customer['customer_churn']
        
        if product_category not in counts:
            counts[product_category] = {'churned': 0, 'notChurned': 0}
        
        if churned == 1:
            counts[product_category]['churned'] += 1
        else:
            counts[product_category]['notChurned'] += 1
    
    return jsonify(counts)

@app.route('/api/monthly-charges', methods=['GET'])
def get_monthly_charges():
    return jsonify(dataset) 

@app.route('/api/tenure-distribution', methods=['GET'])
def get_tenure_distribution():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    tenure_distribution = df['tenure'].value_counts().sort_index().to_dict()
    return jsonify(tenure_distribution)

@app.route('/api/credit-score-distribution', methods=['GET'])
def get_credit_score_distribution():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    credit_score_distribution = df['credit_score'].value_counts().sort_index().to_dict()
    return jsonify(credit_score_distribution)

if __name__ == '__main__':
    app.run(port=3730, debug=True)
