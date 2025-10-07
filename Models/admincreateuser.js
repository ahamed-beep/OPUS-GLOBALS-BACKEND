import mongoose from "mongoose";

const adminCreateUser = new mongoose.Schema({
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
  Password:{
    type:String,
    required:true
    },
   Currency:{
    type:String,
    required:true
    },
    Package:{
      type:String,
      required:true
    },
    
   
},
 { timestamps: true }
);

const adminCreateUserModel = mongoose.model("adminCreateUserModel",adminCreateUser);
export default adminCreateUserModel;