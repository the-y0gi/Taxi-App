import rideInfoModel from "../models/rideInfo.model.js";

export const riderInformation = async (req, res) => {
  const { to, from, trip, carName, rate, totalFare, distance, tripDate } =
    req.body;

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

  const otpGenerate = () => Math.floor(1000 + Math.random() * 9000);

  try {
    if (
      !to ||
      !from ||
      !trip ||
      !carName ||
      !distance ||
      !rate ||
      !totalFare ||
      !tripDate
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const gst = generateTax(totalFare);
    const discount = generateDiscount(totalFare);
    const platFormFess = generatePlatFormFess(totalFare);
    const otherFess = generateOtherFess(totalFare);
    const finalFare = generateTotalFare(totalFare);

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
      distance,
      date: tripDate,
      otp: otpGenerate(),
    });

    
    res.status(201).json({
      gst,
      discount,
      platFormFess,
      otherFess,
      totalFare: finalFare,
    });
  } catch (err) {
    console.error("❌ Error in ride creation:", err);
    res.status(500).json({ message: err.message });
  }
};
