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




// const mongoose = require('mongoose');

// const walletHistorySchema = new mongoose.Schema({
//     userId:{
//         type:String,
//         required:true
//     },
//     totalPrice:{
//         type:Number,
//         default:0


//     },

//     transactionType: {
//         type: String,
//         enum: ['credit', 'debit'], // 'credit' for additions, 'debit' for subtractions
//         required: true
//     },

//     paymentMethod: String,
//     quantity: Number,
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
    
 
// });

// module.exports = mongoose.model('WalletHistory', walletHistorySchema);


const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true // Ensures only one wallet per user
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    transactions: [
        {
            transactionType: {
                type: String,
                enum: ['credit', 'debit'], // 'credit' for additions, 'debit' for subtractions
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            paymentMethod: String,
            quantity: Number,
            description: {
                type: String,
                default: 'Transaction'
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
