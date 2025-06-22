import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pickup: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  trip: {
    type: String,
    enum: ["one-way", "two-way"],
    default: "one-way",
  },
  carType: {
    type: String,
    required: true,
  },
  distance: {
    type: Number,
    required: true,
  },
  passenger: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  otp: {
    type: Number,
    select: true,
  },
  otpExpires: {
    type: Date,
  },
  uniqueCode: {
    type: String,
    unique: true,
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
});

export default mongoose.model("Ride", rideSchema);
