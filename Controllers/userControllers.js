import userModel from "../Models/createusers.js";
import adminCreateUserModel from "../Models/admincreateuser.js";
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';

const CONFIG = {
  EMAIL_USER: process.env.EMAIL_USER || "muhamedahad251@gmail.com",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "kfbn syiy tbqm kvvv",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "OPUSGLOBALSSECRETKEY//16587462971"
};

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

// ✅ Calculate 10% direct referral commission
const calculateDirectReferralCommission = (packageDailyProfit) => {
  const dailyProfit = parseFloat(packageDailyProfit);
  const commission = (dailyProfit * 0.10).toFixed(2); // 10% for direct referrer
  const reducedProfit = (dailyProfit * 0.90).toFixed(2); // 90% for referred user
  
  return {
    commission: commission,
    reducedProfit: reducedProfit
  };
};

// ✅ Calculate 3% indirect referral commission
const calculateIndirectReferralCommission = (packageDailyProfit) => {
  const dailyProfit = parseFloat(packageDailyProfit);
  const commission = (dailyProfit * 0.03).toFixed(2); // 3% for indirect referrer
  
  return commission;
};

// ✅ Add daily commission to direct referrer
const addDirectReferralCommission = async (referrerUserId, dailyCommission) => {
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
    console.log(`   → Current Daily Profit: $${referrer.Dailyprofit || "0"}/day`);

    const currentDailyProfit = parseFloat(referrer.Dailyprofit || "0");
    const newDailyProfit = (currentDailyProfit + parseFloat(dailyCommission)).toFixed(2);

    const currentReferralProfit = parseFloat(referrer.Directrefferalprofit || "0");
    const newReferralProfit = (currentReferralProfit + parseFloat(dailyCommission)).toFixed(2);

    if (isAdminUser) {
      await adminCreateUserModel.findByIdAndUpdate(referrerUserId, {
        Dailyprofit: newDailyProfit.toString(),
        Directrefferalprofit: newReferralProfit.toString()
      });
    } else {
      await userModel.findByIdAndUpdate(referrerUserId, {
        Dailyprofit: newDailyProfit.toString(),
        Directrefferalprofit: newReferralProfit.toString()
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

// ✅ NEW: Add 3% commission to INDIRECT referrer (grandparent)
const addIndirectReferralCommission = async (indirectReferrerUserId, dailyCommission, newUserPackage) => {
  try {
    console.log(`\n🎁 [INDIRECT REFERRAL] Processing 3% commission...`);
    console.log(`   → Indirect Referrer ID: ${indirectReferrerUserId}`);
    console.log(`   → Daily Commission (3%): $${dailyCommission}`);
    console.log(`   → From Package: ${newUserPackage}`);

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
    console.log(`   → Current Daily Profit: $${indirectReferrer.Dailyprofit || "0"}/day`);

    const currentDailyProfit = parseFloat(indirectReferrer.Dailyprofit || "0");
    const newDailyProfit = (currentDailyProfit + parseFloat(dailyCommission)).toFixed(2);

    // Track indirect referral profit separately
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
    console.log(`   → Total Indirect Profit Tracked: $${newIndirectProfit}`);
    console.log(`✅ [INDIRECT REFERRAL SUCCESS]`);

    return true;
  } catch (error) {
    console.error('❌ [INDIRECT REFERRAL ERROR]', error);
    return false;
  }
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

const checkDuplicateAcrossModels = async (Emailid, Phonenumber, Nationalid) => {
  if (await userModel.findOne({ Emailid })) {
    return { exists: true, message: "Email already registered" };
  }
  if (await userModel.findOne({ Phonenumber })) {
    return { exists: true, message: "Phone number already registered" };
  }
  if (await userModel.findOne({ Nationalid })) {
    return { exists: true, message: "National ID already registered" };
  }
  if (await adminCreateUserModel.findOne({ Emailid })) {
    return { exists: true, message: "Email already registered" };
  }
  if (await adminCreateUserModel.findOne({ Phonenumber })) {
    return { exists: true, message: "Phone number already registered" };
  }
  if (await adminCreateUserModel.findOne({ Nationalid })) {
    return { exists: true, message: "National ID already registered" };
  }
  return { exists: false };
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: CONFIG.EMAIL_USER,
      pass: CONFIG.EMAIL_PASSWORD
    },
    tls: { rejectUnauthorized: false }
  });
};

const sendPasswordCreationEmail = async (email, firstName, lastName, userId, referrerInfo = null) => {
  const signupLink = `${CONFIG.FRONTEND_URL}/create-password/${userId}`;
  
  const mailOptions = {
    from: `"Opus Globals" <${CONFIG.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to Opus Globals - Create Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Welcome to Opus Globals!</h1>
          <p>Hi ${firstName} ${lastName},</p>
          <p>Your account has been created. Click below to set your password:</p>
          <a href="${signupLink}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Create Password</a>
          ${referrerInfo ? `<p>Referred by: <strong>${referrerInfo.name}</strong> (${referrerInfo.email})</p>` : ''}
          <p>Link: ${signupLink}</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL SENT] ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [EMAIL FAILED]`, error.message);
    return { success: false, error: error.message };
  }
};

// ✅ UPDATED: 2-Level Referral System
export const userControllers = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📝 NEW USER REGISTRATION - 2-LEVEL REFERRAL SYSTEM");
    console.log("=".repeat(60));
    
    const { 
      Firstname, Lastname, Country, City, Nationalid, 
      Countrycode, Phonenumber, Emailid, Currency, 
      Package, Password, referredByUserId
    } = req.body;
    
    console.log(`👤 Name: ${Firstname} ${Lastname}`);
    console.log(`📧 Email: ${Emailid}`);
    console.log(`📦 Package: ${Package}`);
    console.log(`🔗 Referrer ID: ${referredByUserId || "None"}`);
    
    if (!Firstname || !Lastname || !Country || !City || !Nationalid || 
        !Countrycode || !Phonenumber || !Emailid || !Currency || !Package) {
      return res.status(400).json({ 
        success: false,
        message: "All fields required"
      });
    }

    const duplicateCheck = await checkDuplicateAcrossModels(Emailid, Phonenumber, Nationalid);
    if (duplicateCheck.exists) {
      return res.status(400).json({ 
        success: false,
        message: duplicateCheck.message 
      });
    }

    let directReferrer = null;
    let referrerInfo = null;
    let indirectReferrer = null; // ✅ NEW: Grandparent referrer
    
    if (referredByUserId) {
      console.log(`\n🔍 [DIRECT REFERRER CHECK]`);
      directReferrer = await userModel.findById(referredByUserId);
      
      if (!directReferrer) {
        directReferrer = await adminCreateUserModel.findById(referredByUserId);
      }
      
      if (directReferrer) {
        referrerInfo = {
          name: `${directReferrer.Firstname} ${directReferrer.Lastname}`,
          email: directReferrer.Emailid
        };
        console.log(`✅ [DIRECT REFERRER FOUND] ${referrerInfo.name}`);

        // ✅ NEW: Check if direct referrer was also referred (find grandparent)
        if (directReferrer.referredBy) {
          console.log(`\n🔍 [INDIRECT REFERRER CHECK] Looking for grandparent...`);
          
          indirectReferrer = await userModel.findById(directReferrer.referredBy);
          if (!indirectReferrer) {
            indirectReferrer = await adminCreateUserModel.findById(directReferrer.referredBy);
          }

          if (indirectReferrer) {
            console.log(`✅ [INDIRECT REFERRER FOUND] ${indirectReferrer.Firstname} ${indirectReferrer.Lastname}`);
            console.log(`   → This is the grandparent referrer (Level 2)`);
          }
        }
      } else {
        console.log(`❌ [REFERRER ERROR] Invalid referrer ID`);
        return res.status(400).json({ 
          success: false,
          message: "Invalid referrer ID" 
        });
      }
    }

    const originalDailyProfit = PACKAGE_PROFITS[Package] || "0";
    let actualDailyProfit = originalDailyProfit;
    let directCommission = "0";
    let indirectCommission = "0";
    const FIXED_SIGNUP_BONUS = "30";

    console.log(`\n💰 [PROFIT CALCULATION]`);
    console.log(`   → Original Package Profit: ${originalDailyProfit}/day`);
    console.log(`   → Fixed Signup Bonus: ${FIXED_SIGNUP_BONUS}`);

    // ✅ Calculate commissions if referred
    if (referredByUserId && directReferrer) {
      // Step 1: Deduct 10% for direct referrer (User B)
      const directProfitOnly = parseFloat(originalDailyProfit) * 0.90; // User gets 90%
      directCommission = (parseFloat(originalDailyProfit) * 0.10).toFixed(2); // 10% to User B

      console.log(`   → Direct Referrer (User B) Commission (10%): ${directCommission}/day`);

      // ✅ Step 2: If grandparent exists, deduct 3% from User C's remaining 90%
      if (indirectReferrer) {
        // 3% of ORIGINAL profit goes to grandparent
        indirectCommission = (parseFloat(originalDailyProfit) * 0.03).toFixed(2);
        
        // User C gets: 100% - 10% (direct) - 3% (indirect) = 87%
        actualDailyProfit = (parseFloat(originalDailyProfit) * 0.87).toFixed(2);
        
        console.log(`   → Indirect Referrer (User A/Grandparent) Commission (3%): ${indirectCommission}/day`);
        console.log(`   → New User (User C) Daily Profit (87%): ${actualDailyProfit}/day`);
        console.log(`   → Breakdown: 100% - 10% (User B) - 3% (User A) = 87% (User C)`);
      } else {
        // No grandparent, so User C gets 90%
        actualDailyProfit = directProfitOnly.toFixed(2);
        console.log(`   → New User Daily Profit (90%): ${actualDailyProfit}/day`);
      }
    } else {
      console.log(`   → No referral, full profit: ${actualDailyProfit}/day`);
    }

    const createdata = await userModel.create({
      Firstname, Lastname, Country, City, Nationalid, 
      Countrycode, Phonenumber, Emailid, Currency, Package, 
      Password: Password || "null",
      Dailyprofit: actualDailyProfit,
      Currentbalance: FIXED_SIGNUP_BONUS,
      Directrefferalprofit: "0",
      Indirectrefferalprofit: "0", // ✅ NEW FIELD
      referredBy: referredByUserId || null,
      referredUsers: []
    });
    
    console.log(`✅ User created: ${createdata._id}`);

    // ✅ Process DIRECT referral commission (10%)
    if (referredByUserId && directReferrer) {
      console.log(`\n💰 [PROCESSING DIRECT COMMISSION]`);
      
      const directCommissionAdded = await addDirectReferralCommission(referredByUserId, directCommission);
      
      if (directCommissionAdded) {
        console.log(`✅ Direct referrer now earns +$${directCommission}/day`);
        
        const isAdminReferrer = !!(await adminCreateUserModel.findById(referredByUserId));
        if (isAdminReferrer) {
          await adminCreateUserModel.findByIdAndUpdate(referredByUserId, {
            $push: { referredUsers: { userId: createdata._id, userModel: 'userModel' } }
          });
        } else {
          await userModel.findByIdAndUpdate(referredByUserId, {
            $push: { referredUsers: createdata._id }
          });
        }
      }

      // ✅ Process INDIRECT referral commission (3%)
      if (indirectReferrer) {
        console.log(`\n🎁 [PROCESSING INDIRECT COMMISSION]`);
        
        const indirectCommissionAdded = await addIndirectReferralCommission(
          directReferrer.referredBy, 
          indirectCommission,
          Package
        );
        
        if (indirectCommissionAdded) {
          console.log(`✅ Indirect referrer (grandparent) now earns +$${indirectCommission}/day`);
        }
      }
    }

    console.log("\n📧 Sending email...");
    const emailResult = await sendPasswordCreationEmail(
      Emailid, Firstname, Lastname, createdata._id, referrerInfo
    );

    console.log("=".repeat(60) + "\n");

    if (emailResult.success) {
      res.status(201).json({ 
        success: true,
        message: "✅ User created! Password email sent.", 
        emailSent: true,
        referralApplied: !!referredByUserId,
        data: {
          id: createdata._id,
          email: createdata.Emailid,
          name: `${createdata.Firstname} ${createdata.Lastname}`,
          package: createdata.Package,
          originalPackageProfit: originalDailyProfit,
          actualDailyProfit: actualDailyProfit,
          signupBonus: FIXED_SIGNUP_BONUS,
          directReferrerEarns: directCommission + "/day",
          indirectReferrerEarns: indirectCommission ? indirectCommission + "/day" : "0/day"
        }
      });
    } else {
      const signupLink = `${CONFIG.FRONTEND_URL}/create-password/${createdata._id}`;
      
      res.status(201).json({ 
        success: true,
        message: "⚠️ User created but email failed", 
        emailSent: false,
        emailError: emailResult.error,
        referralApplied: !!referredByUserId,
        data: {
          id: createdata._id,
          email: createdata.Emailid,
          passwordLink: signupLink,
          originalPackageProfit: originalDailyProfit,
          actualDailyProfit: actualDailyProfit,
          signupBonus: FIXED_SIGNUP_BONUS,
          directReferrerEarns: directCommission + "/day",
          indirectReferrerEarns: indirectCommission ? indirectCommission + "/day" : "0/day"
        }
      });
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message
    });
  }
};

// ✅ Updated getUserData with indirect referral profit
export const getUserData = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    let user = null;
    const FIXED_SIGNUP_BONUS = 30;

    if (userType === "admin-created") {
      user = await adminCreateUserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const dailyProfitAccumulated = calculateBalance(user.createdAt, user.Dailyprofit);
      const totalBalance = (FIXED_SIGNUP_BONUS + parseFloat(dailyProfitAccumulated)).toFixed(2);
      
      // ✅ Calculate Total Referral Profit (Direct + Indirect)
      const directProfit = parseFloat(user.Directrefferalprofit || "0");
      const indirectProfit = parseFloat(user.Indirectrefferalprofit || "0");
      const totalReferralProfit = (directProfit + indirectProfit).toFixed(2);
      
      await adminCreateUserModel.findByIdAndUpdate(userId, { Currentbalance: totalBalance });

      const directReferralCount = user.referredUsers ? user.referredUsers.length : 0;

      res.status(200).json({
        success: true,
        userType: userType,
        data: {
          firstName: user.Firstname,
          lastName: user.Lastname,
          package: user.Package,
          dailyProfit: user.Dailyprofit,
          currentBalance: totalBalance,
          directReferralProfit: user.Directrefferalprofit || "0",
          indirectReferralProfit: user.Indirectrefferalprofit || "0",
          referralProfit: totalReferralProfit, // ✅ NEW: Total referral profit
          directReferralCount: directReferralCount,
          indirectReferralCount: 0
        }
      });

    } else if (userType === "normal-user") {
      user = await userModel.findById(userId)
        .populate('referredBy', 'Firstname Lastname Emailid');

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const dailyProfitAccumulated = calculateBalance(user.createdAt, user.Dailyprofit);
      const totalBalance = (FIXED_SIGNUP_BONUS + parseFloat(dailyProfitAccumulated)).toFixed(2);

      // ✅ Calculate Total Referral Profit (Direct + Indirect)
      const directProfit = parseFloat(user.Directrefferalprofit || "0");
      const indirectProfit = parseFloat(user.Indirectrefferalprofit || "0");
      const totalReferralProfit = (directProfit + indirectProfit).toFixed(2);

      await userModel.findByIdAndUpdate(userId, { Currentbalance: totalBalance });

      const directReferralCount = user.referredUsers ? user.referredUsers.length : 0;
      
      let indirectReferralCount = 0;
      if (user.referredUsers && user.referredUsers.length > 0) {
        for (const refId of user.referredUsers) {
          const refUser = await userModel.findById(refId).select('referredUsers');
          if (refUser?.referredUsers) {
            indirectReferralCount += refUser.referredUsers.length;
          }
        }
      }

      res.status(200).json({
        success: true,
        userType: userType,
        data: {
          firstName: user.Firstname,
          lastName: user.Lastname,
          package: user.Package,
          dailyProfit: user.Dailyprofit,
          currentBalance: totalBalance,
          directReferralProfit: user.Directrefferalprofit || "0",
          indirectReferralProfit: user.Indirectrefferalprofit || "0",
          referralProfit: totalReferralProfit, // ✅ NEW: Total referral profit
          directReferralCount: directReferralCount,
          indirectReferralCount: indirectReferralCount,
          referredBy: user.referredBy ? {
            name: `${user.referredBy.Firstname} ${user.referredBy.Lastname}`,
            email: user.referredBy.Emailid
          } : null
        }
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token" });
    }
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params; 
    const { Password } = req.body; 
    
    if (!Password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }
    
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const hashedPassword = await bcrypt.hash(Password, 10);
    await userModel.findByIdAndUpdate(id, { Password: hashedPassword });
    
    res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

export const unifiedLogin = async (req, res) => {
  try {
    const { Emailid, Password } = req.body;
    const FIXED_SIGNUP_BONUS = 30;
    
    if (!Emailid || !Password) {
      return res.status(400).json({ success: false, message: "Email and Password required" });
    }

    let user = null;
    let userType = null;

    user = await adminCreateUserModel.findOne({ Emailid });
    if (user) {
      userType = "admin-created";
    } else {
      user = await userModel.findOne({ Emailid });
      if (user) {
        userType = "normal-user";
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(Password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const dailyProfitAccumulated = calculateBalance(user.createdAt, user.Dailyprofit);
    const totalBalance = (FIXED_SIGNUP_BONUS + parseFloat(dailyProfitAccumulated)).toFixed(2);
    
    // ✅ Calculate Total Referral Profit
    const directProfit = parseFloat(user.Directrefferalprofit || "0");
    const indirectProfit = parseFloat(user.Indirectrefferalprofit || "0");
    const totalReferralProfit = (directProfit + indirectProfit).toFixed(2);
    
    if (userType === "admin-created") {
      await adminCreateUserModel.findByIdAndUpdate(user._id, { Currentbalance: totalBalance });
    } else {
      await userModel.findByIdAndUpdate(user._id, { Currentbalance: totalBalance });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.Emailid, userType: userType, role: user.role },
      CONFIG.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      userType: userType,
      data: {
        id: user._id,
        Firstname: user.Firstname,
        Lastname: user.Lastname,
        Emailid: user.Emailid,
        Package: user.Package,
        Dailyprofit: user.Dailyprofit,
        Currentbalance: totalBalance,
        Directrefferalprofit: user.Directrefferalprofit || "0",
        Indirectrefferalprofit: user.Indirectrefferalprofit || "0",
        referralProfit: totalReferralProfit, // ✅ NEW: Total referral profit
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Login error", error: error.message });
  }
};

export const userLogin = unifiedLogin;

const TEN_MINUTES = 10 * 60 * 1000;

setInterval(async () => {
  try {
    console.log("\n🔄 [BACKGROUND TASK] Updating user balances...");
    const users = await userModel.find({});
    const FIXED_SIGNUP_BONUS = 30;
    
    for (const user of users) {
      const dailyProfitAccumulated = calculateBalance(user.createdAt, user.Dailyprofit);
      const totalBalance = (FIXED_SIGNUP_BONUS + parseFloat(dailyProfitAccumulated)).toFixed(2);
      
      if (parseFloat(totalBalance) > parseFloat(user.Currentbalance || "0")) {
        await userModel.findByIdAndUpdate(user._id, { Currentbalance: totalBalance });
        console.log(`✅ Updated ${user.Emailid}: ${totalBalance}`);
      }
    }
    console.log("✅ [BACKGROUND TASK] Completed\n");
  } catch (error) {
    console.error("❌ Background task error:", error);
  }
}, TEN_MINUTES);