import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
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
  platformFees: {
    type: Number,
    required: true,
  },
  otherFees: {
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
  status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
});

export default mongoose.model("Payment", paymentSchema);
