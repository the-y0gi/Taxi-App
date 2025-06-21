import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
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
  passenger:{
    type:Number,
    required:true
  },
  otp: {
    type: String,
    select: false,
    required: false,
  },
  date: {
    type: Date,
    required: true,
  },
  username: {
    type: String,
    required: true,
    minlength: [3, "First name must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    minlength: [5, "Email must be at least 5 characters long"],
  },
  mobile:{
    type:Number,
    required: true
  }
});

export default mongoose.model("ride", rideSchema);
