// const mongoose = require('mongoose');

// const walletHistorySchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to User
//         required: true,
//         ref: 'User'
//     },
//     totalPrice: {
//         type: Number,
//         default: 0
//     },
//     walletBalance: {  // Track wallet balance
//         type: Number,
//         default: 0
//     },
//     transactions: [
//         {
//             type: {
//                 type: String,
//                 enum: ['credit', 'debit'],  // Specify if it's a credit or debit
//                 required: true
//             },
//             amount: {
//                 type: Number,
//                 required: true
//             },
//             description: {
//                 type: String
//             },
//             date: {
//                 type: Date,
//                 default: Date.now
//             }
//         }
//     ]
// }, { timestamps: true });

// module.exports = mongoose.model('Wallet', walletHistorySchema);




const mongoose = require('mongoose');

const walletHistorySchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    totalPrice:{
        type:Number,
        default:0


    },
    
 
});

module.exports = mongoose.model('WalletHistory', walletHistorySchema);