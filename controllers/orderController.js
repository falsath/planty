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
        // const updatedOrder = await Order.findByIdAndUpdate(
        //     orderId,
        //     {
        //         $set: { status: 'Cancelled', is_cancelled: true, cancellationReason: reason },
        //     },
        //     { new: true }
        // );

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: { status: 'Cancelled', is_cancelled: true },
                $inc: { walletAmount: canceledAmount },
            },
            { new: true }
        );

        // if (updatedOrder) {
        //     // Increment product quantity in the product inventory
        //     await Promise.all(
        //         updatedOrder.products.map(async (product) => {
        //             await Product.findByIdAndUpdate(
        //                 product.product,
        //                 { $inc: { quantity: product.quantity } } // Increment product quantity
        //             );
        //         })
        //     );

        const orderData = await Order.findById(orderId);

        // Log to check orderData and user
        console.log('Order Data:', orderData);
        console.log('User:', user);

        // Update WalletHistory
        const walletData = {
            userId: user,
            totalPrice: canceledAmount,
        };

        const wallet1 = await Wallet.findOne({ userId: user });
         

        console.log("Wallet 1:",wallet1)
            // Find the user's wallet
            // const wallet = await Wallet.findOne({ user: userId });

            // if (wallet) {
            //     // Update the wallet balance by adding the canceled order amount
            //     wallet.walletBalance += updatedOrder.totalPrice;
            //     await wallet.save();
            // } else {
            //     // Create a new wallet for the user if none exists
            //     const newWallet = new Wallet({
            //         user: userId,
            //         walletBalance: updatedOrder.totalPrice
            //     });
            //     await newWallet.save();
            // }

            if (wallet1) {
                await Wallet.findByIdAndUpdate(wallet1._id, {
                    $inc: { totalPrice: canceledAmount },
                });
            } else {
                const wallet = new Wallet(walletData);
                await wallet.save();
            }

             // Log to check the final state of wallet history
        const finalWalletState = await Wallet.findOne({ userId: user });
        console.log('Final Wallet State:', finalWalletState);
        if (updatedOrder) {
            const response = {
                message: 'Order cancelled successfully',
            };
    

            res.status(200).json({ message: 'Order cancelled, product quantities updated, and refund added to wallet' });
        } else {
            res.status(500).json({ error: 'Error updating order' });
        }
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

