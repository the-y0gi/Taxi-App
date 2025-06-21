import userModel from "../models/user.model.js";
import rideInfoModel from "../models/rideInfo.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export const userLogin = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    let user = await userModel.findOne({ email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await userModel.create({
        username,
        email,
        password: hashedPassword,
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const latestRide = await rideInfoModel
      .findOne({ user: { $exists: false } }) 
      .sort({ createdAt: -1 })
      .select("+otp");

    if (latestRide) {
      await rideInfoModel.findByIdAndUpdate(latestRide._id, {
        user: user._id,
        otp,
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Login Successful - Your OTP",
      text: `Hello ${user.username},\n\nYou have logged in successfully.\nYour ride OTP is: ${otp}\n\nThanks,\nTaxi App`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "User logged in & email sent successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const optVerify = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const ride = await rideInfoModel
      .findOne({ user: user._id, otp })
      .sort({ createdAt: -1 }) 
      .select("+otp");

    if (!ride) {
      return res.status(404).json({ message: "Invalid OTP or Ride not found." });
    }

    const rideData = {
      pickup: ride.pickup,
      destination: ride.destination,
      trip: ride.trip,
      carType: ride.carType,
      rate: ride.rate,
      gst: ride.gst,
      discount: ride.discount,
      platFormFess: ride.platFormFess,
      otherFess: ride.otherFess,
      totalFare: ride.totalFare,
      distance: ride.distance,
      tripDate: ride.date,
    };

    res.status(200).json({
      message: "OTP verified successfully.",
      user: {
        username: user.username,
        email: user.email,
        _id: user._id,
      },
      ride: rideData,
    });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};
