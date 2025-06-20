import mongoose from "mongoose";


const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: false
    },
    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    trip:{
        type: String,
        enum:['one-way' , 'two-way'],
        default: 'oneWay'
    },
    carType:{
        type: String,
        required: true
    },
    rate:{
          type: Number,
        required: true,
    },
    gst: {
        type: String,
        required: true,
    },
    platFormFess: {
        type: String,
        required: true,
    },
    otherFess:{
        type: String,
        required: true,
    },
     discount: {
        type: String,
        required: true,
    },
      totalFare: {
        type: String,
        required: true,
    },

    distance: {
        type: String,
        required: true
    }, 
    otp: {
        type: String,
        select: false,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    }
})

export default mongoose.model('ride', rideSchema);