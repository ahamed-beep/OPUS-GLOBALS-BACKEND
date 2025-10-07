import userModel from "../Models/createusers.js";
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';


const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error("Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.");
  }
};
const createTransporter = () => {
  try {
    validateEmailConfig();
   
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } catch (error) {
    throw error;
  }
};

export const userControllers = async (req, res) => {
  try {
    const { Firstname, Lastname, Country, City, Nationalid, Countrycode, Phonenumber, Emailid, Currency, Package, Password } = req.body;
    if (!Firstname || !Lastname || !Country || !City || !Nationalid || !Countrycode || !Phonenumber || !Emailid || !Currency || !Package) {
      return res.status(400).json({ 
        message: "All fields are required",
        missingFields: {
          Firstname: !Firstname,
          Lastname: !Lastname,
          Country: !Country,
          City: !City,
          Nationalid: !Nationalid,
          Countrycode: !Countrycode,
          Phonenumber: !Phonenumber,
          Emailid: !Emailid,
          Currency: !Currency,
          Package: !Package
        }
      });
    }
    if (await userModel.findOne({ Emailid })) {
      return res.status(400).json({ message: "Email is already registered" });
    }
    if (await userModel.findOne({ Nationalid })) {
      return res.status(400).json({ message: "National ID is already registered" });
    }
    if (await userModel.findOne({ Phonenumber })) {
      return res.status(400).json({ message: "Phone number is already registered" });
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
      Password: Password || "null"
    });
    const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${createdata._id}`;
    try {
      const transporter = createTransporter();
      await transporter.verify();
      await transporter.sendMail({
        from: `"Opus Globals" <${process.env.EMAIL_USER}>`,
        to: Emailid,
        subject: 'Welcome to Opus Globals - Verify Your Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>OPUS GLOBALS</h1>
              </div>
              <div class="content">
                <h2>Welcome to Our Platform!</h2>
                <p>Dear ${Firstname} ${Lastname},</p>
                <p>You have been welcomed to <strong>Opus Globals</strong>. We are excited to have you on board!</p>
                <p>To complete your registration, please click the button below to create your password and register on the platform with your existing email:</p>
                <div style="text-align: center;">
                  <a href="${signupLink}" class="button">Verify & Create Password</a>
                </div>
                <div class="warning">
                  <strong>⚠️ Important Security Notice:</strong>
                  <ul>
                    <li>Please DO NOT share this link with others</li>
                    <li>This link is unique to your account</li>
                    <li>Keep this email confidential</li>
                  </ul>
                </div>
                <p>If you did not request this registration, please ignore this email.</p>
                <p>Best regards,<br><strong>Opus Globals Team</strong></p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Opus Globals. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      res.status(201).json({ 
        message: "User created successfully. Verification email sent.", 
        data: {
          id: createdata._id,
          email: createdata.Emailid,
          name: `${createdata.Firstname} ${createdata.Lastname}`
        }
      });
    } catch (emailError) {
      res.status(201).json({ 
        message: "User created successfully, but verification email could not be sent. Please contact support.", 
        warning: "Email notification failed",
        data: {
          id: createdata._id,
          email: createdata.Emailid,
          name: `${createdata.Firstname} ${createdata.Lastname}`,
          verificationLink: signupLink
        }
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      details:  'development' 
    });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params; 
    const { Password } = req.body; 
    if (!Password) {return res.status(400).json({ success: false, message: "Password is required" });}
    const user = await userModel.findById(id);
    if (!user) {return res.status(404).json({success: false,message: "User not found"});}
    const hashedPassword = await bcrypt.hash(Password, 10);
    const updatedUser = await userModel.findByIdAndUpdate(id,{ Password: hashedPassword },{ new: true });
    res.status(200).json({success: true,message: "Password updated successfully",data: {id: updatedUser._id,Emailid: updatedUser.Emailid}});
  } catch (error) {
    res.status(500).json({success: false, message: "Error updating password",error: error.message});
  }
};

export const userLogin = async (req, res) => {
  try {
    const { Emailid, Password } = req.body;
    if (!Emailid || !Password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required"
      });
    }
    const user = await userModel.findOne({ Emailid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const isPasswordValid = await bcrypt.compare(Password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.Emailid
      },
      process.env.JWT_SECRET || "your_secret_key"
      // No expiresIn option = unlimited token
    );

    // Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      data: {
        id: user._id,
        Firstname: user.Firstname,
        Lastname: user.Lastname,
        Emailid: user.Emailid
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message
    });
  }
};