import mongoose from "mongoose";

const userCreatesNewuser = new mongoose.Schema({
  Firstname: { type: String, required: true },
  Lastname: { type: String, required: true },
  Country: { type: String, required: true },
  City: { type: String, required: true },
  Nationalid: { type: String, required: true, unique: true },
  Countrycode: { type: String, required: true },
  Phonenumber: { type: String, required: true, unique: true },
  Emailid: { type: String, required: true, unique: true },
  Currency: { type: String, required: true },
  Package: {
    type: String,
    required: true,
    enum: ["Silver", "Silver Plus", "Gold", "Gold Plus", "Diamond", "Diamond Plus", "Platinum", "Platinum Plus"]
  },
  Password: { type: String, default: "null" },
  Dailyprofit: { type: String, default: "0" },
  Currentbalance: { type: String, default: "0" },
  role: { type: String, default: "user" },
  
  // ✅ Direct Referral Profit (10%)
  Directrefferalprofit: { type: String, default: "0" },
  
  // ✅ NEW: Indirect Referral Profit (3%)
  Indirectrefferalprofit: { type: String, default: "0" },
  
  // ✅ Referral tracking fields
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userModel',
    default: null
  },
  referredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userModel'
  }],
  referralProfit: { type: String, default: "0" }
}, { timestamps: true });

const userModel = mongoose.model("userModel", userCreatesNewuser);
export default userModel;