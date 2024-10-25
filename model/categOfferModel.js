const mongoose = require('mongoose');

const categOfferSchema = new mongoose.Schema({
    category: {
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

module.exports = mongoose.model('CategoryOffer', categOfferSchema);

