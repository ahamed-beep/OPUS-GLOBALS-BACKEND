//Make dbconnection file for the connection of the mongoDb database cluster online 
//the environment variable is stored in the .env file
import mongoose from "mongoose";
const mongoDbconnection = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("MongoDb connected successfully")
    } catch (error) {
        console.log(error , "MongoDb connection failed at dbconnection.js line no 6")
    }
};

export default mongoDbconnection;