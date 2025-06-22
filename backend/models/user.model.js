import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    minlength: 5,
  },
  mobile: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("User", userSchema);
