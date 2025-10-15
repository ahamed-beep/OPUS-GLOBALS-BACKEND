// ============================================
// adminController.js - WITH 2-LEVEL REFERRAL
// ============================================

import adminCreateUserModel from "../Models/admincreateuser.js";
import userModel from "../Models/createusers.js";
import bcrypt from "bcrypt";

const PACKAGE_PROFITS = {
  Silver: "1",
  "Silver Plus": "2",
  Gold: "4",
  "Gold Plus": "8",
  Diamond: "16",
  "Diamond Plus": "32",
  Platinum: "64",
  "Platinum Plus": "128"
};

const checkDuplicateAcrossModels = async (Emailid, Phonenumber, Nationalid) => {
  if (await userModel.findOne({ Emailid })) {
    return { exists: true, message: "Email is already registered" };
  }
  if (await userModel.findOne({ Phonenumber })) {
    return { exists: true, message: "Phone number is already registered" };
  }
  if (await userModel.findOne({ Nationalid })) {
    return { exists: true, message: "National ID is already registered" };
  }

  if (await adminCreateUserModel.findOne({ Emailid })) {
    return { exists: true, message: "Email is already registered" };
  }
  if (await adminCreateUserModel.findOne({ Phonenumber })) {
    return { exists: true, message: "Phone number is already registered" };
  }
  if (await adminCreateUserModel.findOne({ Nationalid })) {
    return { exists: true, message: "National ID is already registered" };
  }

  return { exists: false };
};

const calculateBalance = (createdAt, dailyProfit) => {
  const now = new Date();
  const created = new Date(createdAt);
  const millisecondsPassed = now - created;
  const minutesPassed = millisecondsPassed / (1000 * 60);
  
  const intervalsPassed = Math.floor(minutesPassed / 10);
  const totalProfit = intervalsPassed * parseFloat(dailyProfit);
  
  return totalProfit.toString();
};

// ✅ Calculate 10% direct referral commission
const calculateDirectReferralCommission = (packageDailyProfit) => {
  const dailyProfit = parseFloat(packageDailyProfit);
  const commission = (dailyProfit * 0.10).toFixed(2);
  
  return commission;
};

// ✅ Calculate 3% indirect referral commission
const calculateIndirectReferralCommission = (packageDailyProfit) => {
  const dailyProfit = parseFloat(packageDailyProfit);
  const commission = (dailyProfit * 0.03).toFixed(2);
  
  return commission;
};

// ✅ Add 10% commission to direct referrer
const addDirectReferralProfit = async (referrerUserId, dailyCommission, newUserId) => {
  try {
    console.log(`\n💰 [DIRECT REFERRAL] Processing...`);
    console.log(`   → Referrer ID: ${referrerUserId}`);
    console.log(`   → Daily Commission (10%): $${dailyCommission}`);

    let referrer = await adminCreateUserModel.findById(referrerUserId);
    let isAdminUser = !!referrer;

    if (!referrer) {
      referrer = await userModel.findById(referrerUserId);
    }

    if (!referrer) {
      console.error(`❌ [ERROR] Referrer not found: ${referrerUserId}`);
      return false;
    }

    console.log(`✅ [REFERRER FOUND] ${referrer.Emailid}`);

    const currentDailyProfit = parseFloat(referrer.Dailyprofit || "0");
    const newDailyProfit = (currentDailyProfit + parseFloat(dailyCommission)).toFixed(2);

    const currentReferralProfit = parseFloat(referrer.Directrefferalprofit || "0");
    const newReferralProfit = (currentReferralProfit + parseFloat(dailyCommission)).toFixed(2);

    if (isAdminUser) {
      await adminCreateUserModel.findByIdAndUpdate(referrerUserId, {
        Dailyprofit: newDailyProfit.toString(),
        Directrefferalprofit: newReferralProfit.toString(),
        $push: { referredUsers: { userId: newUserId, userModel: 'userModel' } }
      });
    } else {
      await userModel.findByIdAndUpdate(referrerUserId, {
        Dailyprofit: newDailyProfit.toString(),
        Directrefferalprofit: newReferralProfit.toString(),
        $push: { referredUsers: newUserId }
      });
    }

    console.log(`   → New Daily Profit: $${newDailyProfit}/day`);
    console.log(`✅ [DIRECT REFERRAL SUCCESS]`);

    return true;
  } catch (error) {
    console.error('❌ [DIRECT REFERRAL ERROR]', error);
    return false;
  }
};

// ✅ Add 3% commission to indirect referrer (grandparent)
const addIndirectReferralProfit = async (indirectReferrerUserId, dailyCommission, newUserPackage) => {
  try {
    console.log(`\n🎁 [INDIRECT REFERRAL] Processing 3% commission...`);
    console.log(`   → Indirect Referrer ID: ${indirectReferrerUserId}`);
    console.log(`   → Daily Commission (3%): $${dailyCommission}`);

    let indirectReferrer = await adminCreateUserModel.findById(indirectReferrerUserId);
    let isAdminUser = !!indirectReferrer;

    if (!indirectReferrer) {
      indirectReferrer = await userModel.findById(indirectReferrerUserId);
    }

    if (!indirectReferrer) {
      console.error(`❌ [ERROR] Indirect referrer not found: ${indirectReferrerUserId}`);
      return false;
    }

    console.log(`✅ [INDIRECT REFERRER FOUND] ${indirectReferrer.Emailid}`);

    const currentDailyProfit = parseFloat(indirectReferrer.Dailyprofit || "0");
    const newDailyProfit = (currentDailyProfit + parseFloat(dailyCommission)).toFixed(2);

    const currentIndirectProfit = parseFloat(indirectReferrer.Indirectrefferalprofit || "0");
    const newIndirectProfit = (currentIndirectProfit + parseFloat(dailyCommission)).toFixed(2);

    if (isAdminUser) {
      await adminCreateUserModel.findByIdAndUpdate(indirectReferrerUserId, {
        Dailyprofit: newDailyProfit.toString(),
        Indirectrefferalprofit: newIndirectProfit.toString()
      });
    } else {
      await userModel.findByIdAndUpdate(indirectReferrerUserId, {
        Dailyprofit: newDailyProfit.toString(),
        Indirectrefferalprofit: newIndirectProfit.toString()
      });
    }

    console.log(`   → New Daily Profit: $${newDailyProfit}/day`);
    console.log(`✅ [INDIRECT REFERRAL SUCCESS]`);

    return true;
  } catch (error) {
    console.error('❌ [INDIRECT REFERRAL ERROR]', error);
    return false;
  }
};

// Background task - Updates balances every 10 minutes
const TEN_MINUTES = 10 * 60 * 1000;

setInterval(async () => {
  try {
    console.log("\n🔄 [ADMIN BACKGROUND TASK] Updating admin user balances...");
    const users = await adminCreateUserModel.find({});
    const FIXED_SIGNUP_BONUS = 30;
    
    for (const user of users) {
      const dailyProfitAccumulated = calculateBalance(user.createdAt, user.Dailyprofit);
      const updatedBalance = (FIXED_SIGNUP_BONUS + parseFloat(dailyProfitAccumulated)).toFixed(2);
      const currentBalance = parseFloat(user.Currentbalance || "0");
      const newBalance = parseFloat(updatedBalance);
      
      if (newBalance > currentBalance) {
        await adminCreateUserModel.findByIdAndUpdate(user._id, { 
          Currentbalance: updatedBalance 
        });
        console.log(`✅ Updated ${user.Emailid}: $${updatedBalance}`);
      }
    }
    console.log("✅ [ADMIN BACKGROUND TASK] Completed\n");
  } catch (error) {
    console.error("❌ Error updating admin user balances:", error);
  }
}, TEN_MINUTES);

// ✅ UPDATED: Admin creates user with 2-level referral system
export const AdminUserControllers = async (req, res) => {
  try {
    const { 
      Firstname, Lastname, Country, City, Nationalid, 
      Countrycode, Phonenumber, Emailid, Currency, 
      Package, Password, referredByUserId 
    } = req.body;

    if (!Firstname || !Lastname || !Country || !City || !Nationalid || 
        !Countrycode || !Phonenumber || !Emailid || !Currency || !Package) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const duplicateCheck = await checkDuplicateAcrossModels(Emailid, Phonenumber, Nationalid);
    if (duplicateCheck.exists) {
      return res.status(400).json({ message: duplicateCheck.message });
    }

    const dailyProfit = PACKAGE_PROFITS[Package] || "0";
    const FIXED_SIGNUP_BONUS = "30";

    console.log("\n" + "=".repeat(60));
    console.log("👤 [ADMIN CREATE USER] - 2-LEVEL REFERRAL SYSTEM");
    console.log("=".repeat(60));
    console.log(`   → Name: ${Firstname} ${Lastname}`);
    console.log(`   → Package: ${Package}`);
    console.log(`   → Daily Profit: $${dailyProfit}`);
    console.log(`   → Signup Bonus: $${FIXED_SIGNUP_BONUS}`);
    console.log(`   → Referrer ID: ${referredByUserId || "None"}`);

    let directReferrer = null;
    let indirectReferrer = null;
    let directCommission = "0";
    let indirectCommission = "0";
    let actualDailyProfit = dailyProfit;

    if (referredByUserId) {
      console.log(`\n🔍 [DIRECT REFERRER CHECK]`);
      
      directReferrer = await adminCreateUserModel.findById(referredByUserId);
      if (!directReferrer) {
        directReferrer = await userModel.findById(referredByUserId);
      }

      if (!directReferrer) {
        console.log(`❌ [REFERRER ERROR] Invalid referrer ID`);
        return res.status(400).json({ 
          success: false,
          message: "Invalid referrer ID - User does not exist" 
        });
      }

      console.log(`✅ [DIRECT REFERRER FOUND] ${directReferrer.Emailid}`);
      
      // Step 1: Calculate 10% direct commission
      directCommission = calculateDirectReferralCommission(dailyProfit);
      console.log(`   → Direct Commission (10%): ${directCommission}/day`);

      // ✅ Check for indirect referrer (grandparent)
      if (directReferrer.referredBy) {
        console.log(`\n🔍 [INDIRECT REFERRER CHECK] Looking for grandparent...`);
        
        indirectReferrer = await userModel.findById(directReferrer.referredBy);
        if (!indirectReferrer) {
          indirectReferrer = await adminCreateUserModel.findById(directReferrer.referredBy);
        }

        if (indirectReferrer) {
          // Calculate 3% indirect commission
          indirectCommission = calculateIndirectReferralCommission(dailyProfit);
          console.log(`✅ [INDIRECT REFERRER FOUND] ${indirectReferrer.Firstname} ${indirectReferrer.Lastname}`);
          console.log(`   → Indirect Commission (3%): ${indirectCommission}/day`);
          
          // ✅ NEW USER GETS: 100% - 10% - 3% = 87%
          actualDailyProfit = (parseFloat(dailyProfit) * 0.87).toFixed(2);
          console.log(`   → New User Daily Profit (87%): ${actualDailyProfit}/day`);
          console.log(`   → Breakdown: 100% - 10% (direct) - 3% (indirect) = 87%`);
        } else {
          // Only direct referrer, new user gets 90%
          actualDailyProfit = (parseFloat(dailyProfit) * 0.90).toFixed(2);
          console.log(`   → New User Daily Profit (90%): ${actualDailyProfit}/day`);
        }
      } else {
        // Only direct referrer, no grandparent
        actualDailyProfit = (parseFloat(dailyProfit) * 0.90).toFixed(2);
        console.log(`   → New User Daily Profit (90%): ${actualDailyProfit}/day`);
      }
    }

    let finalPassword = "null";
    if (Password) {
      finalPassword = await bcrypt.hash(Password, 10);
    }

    const createdata = await userModel.create({
      Firstname, 
      Lastname, 
      Country, 
      City, 
      Nationalid, 
      Countrycode, 
      Phonenumber, 
      Emailid, 
      Currency, 
      Package, 
      Password: finalPassword,
      Dailyprofit: actualDailyProfit, // ✅ CHANGED: Now uses reduced profit (87% or 90%)
      Currentbalance: FIXED_SIGNUP_BONUS,
      Directrefferalprofit: "0",
      Indirectrefferalprofit: "0",
      referredBy: referredByUserId || null,
      referredUsers: []
    });

    console.log(`✅ [DATABASE] User created with ID: ${createdata._id}`);
    console.log(`💰 User's actual daily profit: ${actualDailyProfit}/day`);

    // ✅ Process DIRECT referral (10%)
    if (referredByUserId && directReferrer) {
      console.log(`\n💰 [PROCESSING DIRECT COMMISSION]`);
      const profitAdded = await addDirectReferralProfit(referredByUserId, directCommission, createdata._id);
      
      if (profitAdded) {
        console.log(`✅ Direct referrer now earns +$${directCommission}/day`);
      }

      // ✅ Process INDIRECT referral (3%)
      if (indirectReferrer) {
        console.log(`\n🎁 [PROCESSING INDIRECT COMMISSION]`);
        const indirectProfitAdded = await addIndirectReferralProfit(
          directReferrer.referredBy, 
          indirectCommission,
          Package
        );
        
        if (indirectProfitAdded) {
          console.log(`✅ Indirect referrer (grandparent) now earns +$${indirectCommission}/day`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ [SUCCESS] User created successfully");
    console.log("=".repeat(60) + "\n");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      referralApplied: !!referredByUserId,
      data: {
        id: createdata._id,
        email: createdata.Emailid,
        name: `${createdata.Firstname} ${createdata.Lastname}`,
        package: createdata.Package,
        originalPackageProfit: dailyProfit, // Original 100%
        actualDailyProfit: actualDailyProfit, // Reduced 87% or 90%
        currentBalance: createdata.Currentbalance,
        signupBonus: FIXED_SIGNUP_BONUS,
        referredBy: referredByUserId || null,
        directReferrerEarns: directCommission + "/day",
        indirectReferrerEarns: indirectCommission ? indirectCommission + "/day" : "0/day"
      }
    });
  } catch (error) {
    console.error('\n❌ [SERVER ERROR]', error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
};