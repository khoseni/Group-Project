from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Allow all origins

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

@app.route('/api/churn', methods=['GET'])
def get_churn_data():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    churned = df['customer_churn'].sum()  # Assuming customer_churn is binary (0/1)
    not_churned = len(df) - churned
    return jsonify({'churned': churned, 'notChurned': not_churned})

@app.route('/api/credit-score-distribution', methods=['GET'])
def get_credit_score_distribution():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    credit_score_distribution = df['credit_score'].value_counts().sort_index().to_dict()
    return jsonify(credit_score_distribution)

@app.route('/api/data', methods=['GET'])
def get_data():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    page = int(request.args.get('page', 1))
    per_page = 10
    start = (page - 1) * per_page
    end = start + per_page
    dataset = df.to_dict(orient='records')
    
    total_records = len(dataset)
    total_pages = (total_records // per_page) + (1 if total_records % per_page > 0 else 0)

    if start >= total_records:
        return jsonify({'data': [], 'totalRecords': total_records, 'totalPages': total_pages})

    return jsonify({'data': dataset[start:end], 'totalRecords': total_records, 'totalPages': total_pages})

@app.route('/api/data/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    global df
    initial_length = len(df)
    
    # Ensure customer_id is valid
    if customer_id not in df['customer_id'].values:
        return jsonify({"error": "Customer not found"}), 404

    df = df[df['customer_id'] != customer_id]
    
    if len(df) == initial_length:
        return jsonify({"error": "Customer not found"}), 404
    
    df.to_csv('archivetempsupermarket_churnData.csv', index=False)  # Save changes to CSV
    return jsonify({'message': 'Customer deleted successfully'}), 200

@app.route('/api/age-distribution', methods=['GET'])
def get_age_distribution():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    age_distribution = {}
    for customer in df.to_dict(orient='records'):
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
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    churn_by_branch = {}
    
    for customer in df.to_dict(orient='records'):
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
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    counts = {}
    
    for customer in df.to_dict(orient='records'):
        product_category = str(customer['product_category'])  # Ensure the key is a string
        churned = customer['customer_churn']
        
        if product_category not in counts:
            counts[product_category] = {'churned': 0, 'notChurned': 0}
        
        if churned == 1:
            counts[product_category]['churned'] += 1
        else:
            counts[product_category]['notChurned'] += 1
    
    return jsonify(counts)

@app.route('/api/tenure-distribution', methods=['GET'])
def get_tenure_distribution():
    if df.empty:
        return jsonify({'error': 'No data available'}), 404

    tenure_distribution = df['tenure'].value_counts().sort_index().to_dict()
    return jsonify(tenure_distribution)

if __name__ == '__main__':
    app.run(port=3735, debug=True)
