const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    // dob: {
    //     type: String,
        
    //     required: true
    // },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        required: true
    },
    is_verified: {
        type: Number,
        default: 0
    },
    token: {
        type: String,
        default: ''
    },
    is_blocked: {
        type: Boolean,
        default: false
    },


    addresses: [
        {
            address: String,
            city: String,
            state: String,
            pincode: String,
            country: String,
            phoneNumber: String
        }
    ],

    wishlist: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }],

    appliedCoupons: [
        {
          couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
          },
          appliedDate: {
            type: Date,
            default: Date.now,
          },
          expiryDate: Date,
        },
      ],
    
    referalCode:{
        type:String,
        required:true
    },
    refferedCode:{
        type:String
    },
    is_reffered:{
        type:Boolean,
        default:false
    },

    
});


module.exports = mongoose.model('User', userSchema);
