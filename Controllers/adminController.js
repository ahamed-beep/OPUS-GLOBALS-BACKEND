import adminCreateUserModel from "../Models/admincreateuser.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const AdminUserControllers = async (req, res) => {
  try {
    const { Firstname, Lastname, Country, City, Nationalid, Countrycode, Phonenumber, Emailid, Currency, Package ,Password} = req.body;

    if (!Firstname || !Lastname || !Country || !City || !Nationalid || !Countrycode || !Phonenumber || !Emailid || !Currency || !Package || !Password)
      return res.status(400).json({ message: "All fields are required" });

    if (await adminCreateUserModel.findOne({ Emailid })) return res.status(400).json({ message: "Email is already registered" });
    if (await adminCreateUserModel.findOne({ Nationalid })) return res.status(400).json({ message: "National ID is already registered" });
    if (await adminCreateUserModel.findOne({ Phonenumber })) return res.status(400).json({ message: "Phone number is already registered" });
const hashpassword = await bcrypt.hash(Password,10);
    const createdata = await adminCreateUserModel.create({Firstname, Lastname, Country, City, Nationalid, Countrycode, Phonenumber, Emailid, Currency, Package ,Password:hashpassword});
    res.status(201).json({ message: "User created successfully", data: createdata });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const AdminCreatedUserLogin = async (req, res) => {
  try {
    const { Emailid, Password } = req.body;
    const user = await adminCreateUserModel.findOne({ Emailid });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!await bcrypt.compare(Password, user.Password))
      return res.status(400).json({ message: "Invalid Password" });
    const token = jwt.sign({ id: user._id, Emailid: user.Emailid }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Login Successful", data: { user, token } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
