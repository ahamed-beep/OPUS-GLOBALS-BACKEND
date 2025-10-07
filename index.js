// This file initializes the Express server and connects to the MongoDB database
// The environment variables are stored in the .env file (PORT)
// The type of the project is module in package.json file

import express from 'express';
import dotenv from 'dotenv';
import mongoDbconnection from './MongoDbConnection/mongoDbConnection.js';
import router from './Routes/allProjectRoutes.js';

dotenv.config();
mongoDbconnection();

const app = express(); 
app.use(express.json()); 
app.use('/api', router); 
app.get('/', (req, res) => {
  res.send('Hello World!')
})


const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
