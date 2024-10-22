import unittest
from churn import app 
import json
import os

class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
  
        # Verify customer is deleted
        response = self.app.get('/api/data?page=1')
        data = json.loads(response.data)
        self.assertNotIn({'customer_id': '1'}, data) 

        # Try deleting the same customer again
        response = self.app.delete('/api/data/1')
        self.assertEqual(response.status_code, 404)
        self.assertIn('Customer not found', str(response.data))


if __name__ == '__main__':
    unittest.main()
