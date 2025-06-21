
import rideInfoModel from "../models/rideInfo.model.js";
import nodemailer from "nodemailer";

// Unique 6-char alphanumeric generator
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

    // Generate new unique code
    const uniqueCode = generateUniqueCode();

    // Save it in the ride document (optional)
    ride.otp = uniqueCode;
    await ride.save();

    const formattedDate = new Date(ride.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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

    res.status(200).json({
      message: "OTP verified. Unique ride code sent to email.",
      code: uniqueCode
    });

  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};



// export const optVerify = async (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return res.status(400).json({ message: "Email and OTP are required." });
//   }

//   try {
//     const user = await userModel.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const ride = await rideInfoModel
//       .findOne({ user: user._id, otp })
//       .sort({ createdAt: -1 })
//       .select("+otp");

//     if (!ride) {
//       return res.status(404).json({ message: "Invalid OTP or Ride not found." });
//     }

//     const rideData = {
//       pickup: ride.pickup,
//       destination: ride.destination,
//       trip: ride.trip,
//       carType: ride.carType,
//       rate: ride.rate,
//       gst: ride.gst,
//       discount: ride.discount,
//       platFormFess: ride.platFormFess,
//       otherFess: ride.otherFess,
//       totalFare: ride.totalFare,
//       distance: ride.distance,
//       tripDate: ride.date,
//     };

//     // Format date
//     const formattedDate = new Date(ride.date).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });

//     // Send confirmation email
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.MAIL_USER,
//       to: user.email,
//       subject: "🎉 Ride Confirmed - Details Inside",
//       text: `
// Hello ${user.username},

// ✅ Your OTP has been verified successfully. Here's your ride summary:

// 🛣️ Route: ${ride.pickup} → ${ride.destination}
// 🚘 Car Type: ${ride.carType}
// 📅 Date: ${formattedDate}
// 🛫 Trip Type: ${ride.trip}
// 📏 Distance: ${ride.distance} km

// 💸 Fare Breakdown:
// - Base Rate: ₹${ride.rate}
// - GST (18%): ₹${ride.gst}
// - Platform Fee (2%): ₹${ride.platFormFess}
// - Other Charges (20%): ₹${ride.otherFess}
// - Discount (5%): -₹${ride.discount}
// - ----------------------------
// 💰 Total Fare: ₹${ride.totalFare}

// Thank you for booking with Taxi App!
// —
// Team Taxi App
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({
//       message: "OTP verified and ride details emailed successfully.",
//       user: {
//         username: user.username,
//         email: user.email,
//         _id: user._id,
//       },
//       ride: rideData,
//     });
//   } catch (err) {
//     console.error("❌ OTP Verification Error:", err);
//     res.status(500).json({ message: "Server error during OTP verification." });
//   }
// };


// export const optVerify = async (req, res) => {
//   const { otp } = req.body;

//   if (!otp) {
//     return res.status(400).json({ message: "OTP is required." });
//   }

//   try {
//     // Find latest ride with matching OTP
//     const ride = await rideInfoModel
//       .findOne({ otp })
//       .sort({ createdAt: -1 })
//       .populate("user")
//       .select("+otp");

//     if (!ride || !ride.user) {
//       return res.status(404).json({ message: "Invalid OTP or ride/user not found." });
//     }

//     const user = ride.user;

//     const rideData = {
//       pickup: ride.pickup,
//       destination: ride.destination,
//       trip: ride.trip,
//       carType: ride.carType,
//       rate: ride.rate,
//       gst: ride.gst,
//       discount: ride.discount,
//       platFormFess: ride.platFormFess,
//       otherFess: ride.otherFess,
//       totalFare: ride.totalFare,
//       distance: ride.distance,
//       tripDate: ride.date,
//     };

//     const formattedDate = new Date(ride.date).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.MAIL_USER,
//       to: user.email,
//       subject: "🎉 Ride Confirmed - Details Inside",
//       text: `
// Hello ${user.username},

// ✅ Your OTP has been verified successfully. Here's your ride summary:

// 🛣️ Route: ${ride.pickup} → ${ride.destination}
// 🚘 Car Type: ${ride.carType}
// 📅 Date: ${formattedDate}
// 🛫 Trip Type: ${ride.trip}
// 📏 Distance: ${ride.distance} km

// 💸 Fare Breakdown:
// - Base Rate: ₹${ride.rate}
// - GST (18%): ₹${ride.gst}
// - Platform Fee (2%): ₹${ride.platFormFess}
// - Other Charges (20%): ₹${ride.otherFess}
// - Discount (5%): -₹${ride.discount}
// - ----------------------------
// 💰 Total Fare: ₹${ride.totalFare}

// Thank you for booking with Taxi App!
// —
// Team Taxi App
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({
//       message: "OTP verified and ride details emailed successfully.",
//       user: {
//         username: user.username,
//         email: user.email,
//         _id: user._id,
//       },
//       ride: rideData,
//     });

//   } catch (err) {
//     console.error("❌ OTP Verification Error:", err);
//     res.status(500).json({ message: "Server error during OTP verification." });
//   }
// };
