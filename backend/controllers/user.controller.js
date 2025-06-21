import rideInfoModel from "../models/rideInfo.model.js";
import nodemailer from "nodemailer";

// Unique 6-character alphanumeric code generator
const generateUniqueCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const optVerify = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required." });
  }

  try {
    // Find latest ride with matching OTP
    const ride = await rideInfoModel
      .findOne({ otp })
      .sort({ createdAt: -1 })
      .select("+otp");

    if (!ride) {
      return res.status(404).json({ message: "Invalid OTP or ride not found." });
    }

    // Generate and assign new unique code
    const uniqueCode = generateUniqueCode();
    ride.uniqueCode = uniqueCode;
    await ride.save();

    // Format date
    const formattedDate = new Date(ride.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: ride.email,
      subject: "🚖 Ride Verified - Share this Code with Driver",
      text: `
Hello ${ride.username},

✅ Your ride OTP has been verified successfully.

Here's your unique ride code (share this with your driver):  
🔐 Code: ${uniqueCode}

🛣️ Route: ${ride.pickup} → ${ride.destination}  
📅 Date: ${formattedDate}  
🚘 Car Type: ${ride.carType}  
👥 Passengers: ${ride.passenger}  
📏 Distance: ${ride.distance} km  
💰 Total Fare: ₹${ride.totalFare}

Thanks for riding with us!  
— Team Taxi App
      `
    };

    await transporter.sendMail(mailOptions);

    // Respond to frontend
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
        totalFare: ride.totalFare,
        date: ride.date,
        email: ride.email,
        username: ride.username,
      }
    });

  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

