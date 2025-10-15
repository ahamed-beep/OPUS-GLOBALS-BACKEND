// This file initializes the Express server and connects to the MongoDB database
// The environment variables are stored in the .env file (PORT)
// The type of the project is module in package.json file

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoDbconnection from './MongoDbConnection/mongoDbConnection.js';
import router from './Routes/allProjectRoutes.js';

dotenv.config();
mongoDbconnection();

const app = express(); 

// CORS Configuration - Frontend se requests allow karne ke liye
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); 
app.use('/api', router); 

app.get('/', (req, res) => {
  res.send('Hello World!')
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});