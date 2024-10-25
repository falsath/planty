const mongoose = require('mongoose'); 

const productOfferSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Assuming you have a Product model  
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

module.exports = mongoose.model('ProductOffer', productOfferSchema);
