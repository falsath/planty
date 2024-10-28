const mongoose = require('mongoose');

const Order = require('../model/orderModel');

const Wallet = require('../model/walletHistoryModel')
const Product = require('../model/productModel');

//console.log("placeOrder route is triggered");



const loadOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = 5; // Number of orders per page

        const totalCount = await Order.countDocuments();
        const totalPages = Math.ceil(totalCount / limit);

        const orders = await Order.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('order-list', { orders, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { newStatus } = req.body;

        if (!newStatus) {
            return res.status(400).json({ error: 'New status is required' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }


        updatedOrder.status = newStatus;
        await updatedOrder.save();




        res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder, newStatus });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



//..........user.......................

//cancelorder by updating wallet
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.session.user_id;

        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check the cancellation period
        const currentTime = new Date();
        const orderPlacedTime = order.orderPlacedAt; // Use the correct field for order placement time
        const timeDifferenceInHours = (currentTime - orderPlacedTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 4) {
            return res.status(400).json({ message: 'Cannot cancel order after 4 hours' });
        }

        const canceledAmount = order.totalPrice;

        // Update the order status to "Cancelled"
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: { status: 'Cancelled', is_cancelled: true, cancellationReason: reason },
            },
            { new: true }
        );

        // Find or create the user's wallet
        let wallet = await Wallet.findOne({ userId: userId });

        if (wallet) {
            // Update wallet balance and add transaction history
            wallet.walletBalance += canceledAmount;
            wallet.transactions.push({
                transactionType: 'credit',
                amount: canceledAmount,
                paymentMethod: order.paymentMethod, // assuming paymentMethod is available in `order`
                quantity: order.quantity, // assuming quantity is available in `order`
                description: 'Order cancellation refund'
            });
            await wallet.save();
        } else {
            // Create a new wallet with the transaction
            wallet = new Wallet({
                userId: userId,
                walletBalance: canceledAmount,
                transactions: [{
                    transactionType: 'credit',
                    amount: canceledAmount,
                    paymentMethod: order.paymentMethod,
                    quantity: order.quantity,
                    description: 'Order cancellation refund'
                }]
            });
            await wallet.save();
        }

        console.log('Order canceled, product quantities updated, and refund added to wallet');

        res.status(200).json({
            message: 'Order cancelled successfully, refund added to wallet',
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



// const Order = require('../model/orderModel');
// const Wallet = require('../model/walletHistoryModel');

// const approveReturn = async (req, res) => {
//     try {
//         const orderId = req.params.id;

//         // Find the order by ID
//         const order = await Order.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         // Check if the order is already returned
//         if (order.status === 'Returned') {
//             return res.status(400).json({ message: 'Order is already returned' });
//         }

//         // Update order status to 'Returned'
//         order.status = 'Returned';
//         await order.save();

//         // Refund the user (update wallet)
//         const refundAmount = order.totalPrice;
//         let wallet = await Wallet.findOne({ userId: order.user });

//         if (wallet) {
//             // Update existing wallet balance
//             wallet.walletBalance += refundAmount;
//             await wallet.save();
//         } else {
//             // Create new wallet entry if not exists
//             wallet = new Wallet({
//                 userId: order.user,
//                 walletBalance: refundAmount,
//             });
//             await wallet.save();
//         }

//         res.status(200).json({ message: 'Return approved, refund added to wallet' });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };











// // Approve return request
// const approveReturn = async (req, res) => {
//     const orderId = req.params.user_id;
//     console.log("orderiddd....",orderId)

//     try {
//         const order = await Order.findById(orderId);

//         if (order.returnStatus !== 'Requested') {
//             return res.status(400).send('No return request to approve');
//         }

//         // Approve return and update status
//         order.returnStatus = 'Returned';
//         await order.save();

//         res.status(200).send('Return approved');
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Error approving return'); 
//     }
// };

const requestReturn = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Find the order by its ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the order is already delivered
        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Cannot return an order that is not delivered.' });
        }

        // Update the order with the return request
        order.returnStatus = 'Requested';
        await order.save();

        // Send a success response
        return res.json({ success: true, message: 'Return request submitted successfully.' });
    } catch (error) {
        console.error('Error requesting return:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while requesting the return.' });
    }
};




module.exports = {
    loadOrder,
    updateOrderStatus,
    cancelOrder,
    //approveReturn,
    requestReturn
};

