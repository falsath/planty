const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'User', // Reference the 'User' model
        // required: true,

        type: String,
        required: true,


    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Reference the 'Product' model
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    address: {
        address: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
    },
    totalPrice: {
        type: Number,
        default: 0,
    },
    paymentMethod: {

        // type: String,
        // required: true,
        type: String,
        enum:['COD','WALLET','CARD','UPI'],
         
        required: true,
    },


    // status: {
    //     type: String,
    //     default: 'Pending',
    // },

    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], // Updated enum values
        default: 'Pending',
    },
    returnStatus: {
        type: String,
        enum: ['None', 'Requested', 'In Process', 'Completed'], // New return status field
        default: 'None',
    },

    orderPlacedAt: {
        type: Date,
        default: Date.now,
    },

    walletAmount: {
        type: Number,
        default: 0,
    },

    isCancelled: {
        type: Boolean,
        default: false,
    },

    walletHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction',
        },
    ],



    //  images: [String], // Array of image URLs
    //  productImages: [String],
}, 



{ timestamps: true }); // Add timestamps

module.exports = mongoose.model('Order', orderSchema);
