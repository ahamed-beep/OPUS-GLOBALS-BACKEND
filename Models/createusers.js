import mongoose from "mongoose";

// This file defines the Mongoose schema and of user creating user model for storing user information in the database
const userCreatesNewuser = new mongoose.Schema({
  Firstname:{
    type:String,
    required:true
  },
   Lastname:{
    type:String,
    required:true
  },
  Country:{
    type:String,
    required:true
  },
   City:{
    type:String,
    required:true
  },
   Nationalid:{
    type:String,
    required:true,
    unique:true
  },
  Countrycode:{
    type:String,
    required:true
  },
  Phonenumber:{
    type:String,
    required:true,
    unique:true
  },
   Emailid:{
    type:String,
    required:true,
    unique:true
  },
   Currency:{
    type:String,
    required:true
    },
    Package:{
      type:String,
      required:true
    },
    Password:{
    type:String,
    default:"null",
    }
   
},
 { timestamps: true }
);

const userModel = mongoose.model("userModel",userCreatesNewuser);
export default userModel;