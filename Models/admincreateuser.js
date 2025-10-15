import mongoose from "mongoose";

const adminCreateUser = new mongoose.Schema({
  Firstname: {
    type: String,
    required: true
  },
  Lastname: {
    type: String,
    required: true
  },
  Country: {
    type: String,
    required: true
  },
  City: {
    type: String,
    required: true
  },
  Nationalid: {
    type: String,
    required: true,
    unique: true
  },
  Countrycode: {
    type: String,
    required: true
  },
  Phonenumber: {
    type: String,
    required: true,
    unique: true
  },
  Emailid: {
    type: String,
    required: true,
    unique: true
  },
  Password: {
    type: String,
    required: true
  },
  Currency: {
    type: String,
    required: true
  },
  Package: {
    type: String,
    required: true,
    enum: ["Silver", "Silver Plus", "Gold", "Gold Plus", "Diamond", "Diamond Plus", "Platinum", "Platinum Plus"]
  },
  Dailyprofit: {
    type: String,
    default: "0"
  },
  Currentbalance: {
    type: String,
    default: "0"
  },
  role: {
    type: String,
    default: "user"
  },
  
  // ✅ Direct Referral Profit (10%)
  Directrefferalprofit: {
    type: String,
    default: "0"
  },
  
  // ✅ NEW: Indirect Referral Profit (3%)
  Indirectrefferalprofit: {
    type: String,
    default: "0"
  },
  
  // ✅ Referral tracking fields (supports both admin and normal users)
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referredByModel',
    default: null
  },
  referredByModel: {
    type: String,
    enum: ['adminCreateUserModel', 'userModel'],
    default: null
  },
  referredUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referredUsers.userModel'
    },
    userModel: {
      type: String,
      enum: ['adminCreateUserModel', 'userModel']
    },
      referralProfit: { type: String, default: "0" }
  }]
}, { timestamps: true });

const adminCreateUserModel = mongoose.model("adminCreateUserModel", adminCreateUser);
export default adminCreateUserModel;