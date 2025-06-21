

import rideInfoModel from "../models/rideInfo.model.js";
import nodemailer from "nodemailer";

export const riderInformation = async (req, res) => {
  const {
    username,
    email,
    number,
    to,
    from,
    trip,
    carName,
    rate,
    totalFare,
    distance,
    tripDate,
    passenger
  } = req.body;

  if (
    !username || !email || !number || !to || !from || !trip || !carName ||
    !distance || !rate || !totalFare || !tripDate || !passenger
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const generateTax = (value) => Math.round(value * 0.18);
    const generatePlatFormFess = (value) => Math.round(value * 0.02);
    const generateDiscount = (value) => Math.round(value * 0.05);
    const generateOtherFess = (value) => Math.round(value * 0.2);
    const generateTotalFare = (value) => {
      const tax = generateTax(value);
      const platform = generatePlatFormFess(value);
      const other = generateOtherFess(value);
      const discount = generateDiscount(value);
      return Math.round(value + tax + platform + other - discount);
    };

    const gst = generateTax(Number(totalFare));
    const discount = generateDiscount(Number(totalFare));
    const platFormFess = generatePlatFormFess(Number(totalFare));
    const otherFess = generateOtherFess(Number(totalFare));
    const finalFare = generateTotalFare(Number(totalFare));
    const distanceValue = Math.round(distance);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const rideInfo = await rideInfoModel.create({
      pickup: to,
      destination: from,
      trip,
      carType: carName,
      rate,
      gst,
      discount,
      platFormFess,
      otherFess,
      totalFare: finalFare,
      distance: distanceValue,
      passenger,
      date: tripDate,
      username,
      email,
      mobile: number,
      otp
    });

    // 📧 Send OTP to user's email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Taxi App Ride OTP",
      text: `Hello ${username},\n\nYour OTP for the ride confirmation is: ${otp}\n\nThanks,\nTaxi App`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Ride created and OTP sent to email successfully.",
      rideId: rideInfo._id
    });

  } catch (err) {
    console.error("❌ Ride creation error:", err);
    res.status(500).json({ message: "Server error during ride creation." });
  }
};
