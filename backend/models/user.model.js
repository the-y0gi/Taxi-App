import mongoose from "mongoose";


const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: false,
    minlength: [3, "First name must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    minlength: [5, "Email must be at least 5 characters long"],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

const userModel = mongoose.model("user", userSchema);

export default userModel;
