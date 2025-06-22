import rideModel from "../models/rideInfo.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

//unique code generated...
const generateUniqueCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const length = 6;

  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % chars.length;
    result += chars.charAt(index);
  }

  return result;
};

//otp verify logic...
export const optVerify = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required." });
  }

  try {
    // Find latest ride with matching OTP and populate user and payment data...
    const ride = await rideModel
      .findOne({ otp, otpExpires: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .select("+otp")
      .populate("user")
      .populate("payment");

    if (!ride) {
      return res
        .status(404)
        .json({ message: "Invalid OTP or ride not found." });
    }

    //  unique code generate and save into database...
    const uniqueCode = generateUniqueCode();
    ride.uniqueCode = uniqueCode;
    await ride.save();

    const formattedDate = new Date(ride.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Send confirmation email to user...
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: ride.user.email,
      subject: "🚖 Ride Verified - Share this Code with Driver",
      text: `
Hello ${ride.user.username},

✅ Your ride OTP has been verified successfully.

Here's your unique ride code (share this with your driver):  
🔐 Code: ${uniqueCode}

🛣️ Route: ${ride.pickup} → ${ride.destination}  
📅 Date: ${formattedDate}  
🚘 Car Type: ${ride.carType}  
👥 Passengers: ${ride.passenger}  
📏 Distance: ${ride.distance} km  
💰 Total Fare: ₹${ride.payment.totalFare}

Thanks for riding with us!  
— Team Taxi App
      `,
    };

    await transporter.sendMail(mailOptions);


    //remove otp after once used
    ride.otp = undefined;
    ride.otpExpires = undefined;
    await ride.save();

    //  Respond to frontend...
    res.status(200).json({
      message: "OTP verified. Unique ride code sent to email.",
      code: uniqueCode,
      ride: {
        pickup: ride.pickup,
        destination: ride.destination,
        trip: ride.trip,
        carType: ride.carType,
        passenger: ride.passenger,
        distance: ride.distance,
        totalFare: ride.payment.totalFare,
        date: ride.date,
        email: ride.user.email,
        username: ride.user.username,
      },
    });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};
