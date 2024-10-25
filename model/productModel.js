const mongoose = require('mongoose');
const Category = require('./category');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    earlierPrice: {
        type: Number,
        default: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: Array,
        required: true,
        validate: [arrayLimit, "you can pass only 3 product image"],
    },
    category_id: {
        type: mongoose.Types.ObjectId,
        ref: Category,
        required: true,
    },
    is_disabled: {
        type: Boolean,
        default: false,
    },
    is_cancelled: {
        type: Boolean,
        default: false,
    },
    is_offer: {
        type: Boolean,
        default: false,
    },
    orders: [{
        type: mongoose.Types.ObjectId,
        ref: 'Order',
    }],
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

function arrayLimit(val) {
    return val.length <= 3;
    
}

module.exports = mongoose.model('Product', productSchema);
