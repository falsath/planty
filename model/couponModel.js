const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
  },


  maxDiscountAmount: {
    type: Number,
    default: 0, // 
  },


  expiry:{
    type:Date,
    required:true
},
  minimumPurchase: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    default: 'percentage', // Adjust the default value based on your needs
  },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming there is a User model, update accordingly
    },
  ],

  isListed: { type: Boolean, default: true },    // For listing/unlisting


  isDeleted: {
    type: Boolean,
    default: false, // Default is false (active coupon)
  },

});

module.exports = mongoose.model('Coupon', couponSchema);