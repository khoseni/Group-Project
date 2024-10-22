import pytest
from flask import Flask
from churn import app  # Adjust the import based on your file structure

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_get_data(client):
    response = client.get('/api/data?page=1')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)

def test_delete_customer(client):
    # First, ensure there's a customer to delete (you may want to seed this data)
    response = client.delete('/api/data/1')  # Replace '1' with an actual customer ID
    assert response.status_code == 404  # Should return 404 if not found

    # You might want to add a customer for a valid test, depending on your app logic

def test_get_churn_data(client):
    response = client.get('/api/churn')
    assert response.status_code == 200
    data = response.get_json()
    assert 'churned' in data
    assert 'notChurned' in data

def test_get_age_distribution(client):
    response = client.get('/api/age-distribution')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, dict)

def test_get_tenure_distribution(client):
    response = client.get('/api/tenure-distribution')
    assert response.status_code == 200 or response.status_code == 404
    if response.status_code == 200:
        data = response.get_json()
        assert isinstance(data, dict)

def test_get_credit_score_distribution(client):
    response = client.get('/api/credit-score-distribution')
    assert response.status_code == 200 or response.status_code == 404
    if response.status_code == 200:
        data = response.get_json()
        assert isinstance(data, dict)
