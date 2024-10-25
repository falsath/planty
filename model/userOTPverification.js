const mongoose = require('mongoose')

const userotpVerificationSchema = new mongoose.Schema({

    userId:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true
    },
})

module.exports = mongoose.model('UserotpVerification',userotpVerificationSchema)
 