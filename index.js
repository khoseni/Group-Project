import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { dataset } from './dataset.js';  // Import dataset
import path from 'path';
import { fileURLToPath } from 'url';



const app = express();


// Manually define __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'loggin')));

// GET endpoint to fetch customer data
app.get('/api/customers', (req, res) => {
  res.json(dataset);
});

// POST endpoint to add new customer data
app.post('/api/customers', (req, res) => {
  const newCustomer = req.body;
  dataset.push(newCustomer);
  res.status(201).json(newCustomer);
});


// API endpoint to get the data
app.get('/api/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json'); 
  res.json(dataset);
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'loggin', 'dashboard.html'));
});

// In-memory model (example with basic decision tree logic)
const predictChurn = (customer) => {
  return customer.credit_score < 600 || customer.tenure < 10 ? 1 : 0;
};

// API endpoint to predict churn
app.post('/api/predict-all', (req, res) => {
  const predictions = dataset.map(customer => ({
    ...customer,
    churn: predictChurn(customer)
  }));
  res.json(predictions);
});


const port = 3730;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
