import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: false,
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
    default: "oneWay",
  },
  carType: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  gst: {
    type: Number,
    required: true,
  },
  platFormFess: {
    type: Number,
    required: true,
  },
  otherFess: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  totalFare: {
    type: Number,
    required: true,
  },
  distance: {
    type: Number,
    required: true,
  },
  otp: {
    type: Number,
    select: false,
    required: false,
  },
  date: {
    type: Date,
    required: true,
  },
});

export default mongoose.model("ride", rideSchema);
