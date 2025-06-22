import rideModel from "../models/rideInfo.model.js";
import userModel from "../models/user.model.js";
import paymentModel from "../models/payment.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
    passenger,
  } = req.body;

  if (
    !username ||
    !email ||
    !number ||
    !to ||
    !from ||
    !trip ||
    !carName ||
    !distance ||
    !rate ||
    !totalFare ||
    !tripDate ||
    !passenger
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {

    // user create or find...
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({
        username,
        email,
        mobile: number,
      });
    }

    // fare breakdown...
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


    // OTP Generate & expiry...
    const otp = crypto.randomInt(100000, 999999);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    //save to ride information into database...
    const ride = await rideModel.create({
      user: user._id,
      pickup: to,
      destination: from,
      trip,
      carType: carName,
      distance: distanceValue,
      passenger,
      date: tripDate,
      otp,
      otpExpires,
    });

     //save to payment information into database...
    const payment = await paymentModel.create({
      ride: ride._id, 
      rate,
      gst,
      discount,
      platformFees: platFormFess,
      otherFees: otherFess,
      totalFare: finalFare,
    });

    ride.payment = payment._id;
    await ride.save();

    // Send OTP in the user email...
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
      text: `Hello ${username},\n\nYour OTP for the ride confirmation is: ${otp}. It will expire in 5 minutes.\n\nThanks,\nTaxi App`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Ride created and OTP sent successfully.",
      rideId: ride._id,
    });
  } catch (err) {
    console.error("Ride creation error:", err);
    res.status(500).json({ message: "Server error during ride creation." });
  }
};
