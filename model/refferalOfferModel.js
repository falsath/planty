const mongoose = require('mongoose');

const referralOfferSchema = new mongoose.Schema({
    referralCode: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true
    },
    expireAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    is_offer: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ReferralOffer', referralOfferSchema);
