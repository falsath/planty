const Razorpay = require('razorpay');
const User = require('../model/userModel');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const Cart = require('../model/cartModel');
const util = require('util');
const { name } = require('ejs');

// Instantiate Razorpay
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});



const loadPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const address = req.session.address;
        const user = await User.findById(userId).exec();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.render('payment', { userId, address, user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;

        console.log('Request Body:', req.body);
        if (!userId) {
            res.redirect('/home');
            return;
        }

        const payment = req.body.payment;
        console.log(payment);

        let totalPrice = 0;

        const cartData = await Cart.find({ userId }).populate('products.product');
        if (cartData.length > 0) {
            // totalPrice = cartData[0].totalPrice; 

              totalPrice = req.session.grandtotal 
        } else {
            res.redirect('/allProduct');
            return;
        }

        console.log('cartData:', cartData);
        console.log('totalPrice:', totalPrice);

        if (payment === 'COD') {
            const orderDetails  = await Order.findOne({ userId}).populate('products.product').populate('address').sort({ _id: -1 }).limit(1).lean();

            // const orderDetails = await OrderModel.findOne({ userId }).sort({ createdAt: -1 }).populate('products.product');

            res.render('order-confirmation', { orderDetails, userId });
            // Clear cart after placing the order
            await Cart.deleteOne({ userId });
            res.status(200).json({ success: true, message: 'Order placed successfully' });
        } else {
            const amount = totalPrice * 100;
            const options = {
                amount: amount,
                currency: "INR",
                receipt: generateOrderId(),
            };

            const orderPromise = new Promise((resolve, reject) => {
                razorpayInstance.orders.create(options, (err, order) => {
                    if (err) {
                        console.error('Error creating Razorpay order:', err);
                        reject(err);
                    } else {
                        resolve(order);
                    }
                });
            });

            const order = await orderPromise;

            if (!order) {
                console.error('Razorpay order is undefined.');
                res.status(500).json({ error: 'Failed to create Razorpay order' });
                return;
            }

            // Clear cart after placing the order
            await Cart.deleteOne({ userId });

            const response = {
                method: "UPI",
                success: true,
                amount: amount,
                key_id: RAZORPAY_KEY_ID,
                contact: req.body.phone,
                name: req.session.user_id,
                order: order,
            };

            console.log('Server Response:', response);
            console.log(order);
            res.status(200).json({ response });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

function generateOrderId() {
    const timestamp = Date.now().toString(); // Get current timestamp
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string

    // Concatenate timestamp and random string to create the order ID
    const orderId = `${timestamp}-${randomString}`;

    return orderId;
}


const razorpayVerify = async (req, res) => {
    try {
        console.log(req.body.proName);
        console.log(req.body.productId);
        const log = req.session.user_id;
        const id = req.session.user_id;

        const cartData = await Cart.findOne({ userId: id }).populate('product.productId').lean();
        if (!cartData) {
            throw new Error('Cart not found');
        }

        const { quantity1, price, proName } = req.body;
        const quantityArray = Array.isArray(quantity1) ? quantity1 : [quantity1];
        const priceArray = Array.isArray(price) ? price.map(parseFloat) : [parseFloat(price)];
        const nameArray = Array.isArray(proName) ? proName : [proName];

        const productsArray = quantityArray.map((quantity, index) => ({
            productId: cartData.product[index].productId,
            quantity,
            price: priceArray[index],
            name: nameArray[index],
        }));

        const orderData = new Order({
            userId: id,
            product: productsArray,
            fullname: req.body.fname,
            phone: req.body.phone,
            address: [{
                address: req.body.address,
                district: req.body.district,
                city: req.body.city,
                pincode: req.body.pincode,
                state: req.body.state,
                country: req.body.country,
            }],
            paymentMethod: req.body.payment,
            quantity: cartData.product.reduce((sum, product) => sum + product.quantity, 0),
            totalPrice: cartData.totalPrice,
        });

        const savedOrder = await orderData.save();

        if (!savedOrder) {
            throw new Error('Failed to save order');
        }

        const response = {
            success: true,
            message: 'Order Placed',
            error: 'Order failed',
            payment: req.body.payment,
        };

        res.status(200).json(response);

        const updatedCart = await Cart.updateOne({
            userId: id,
        }, {
            $pull: {
                product: { productId: { $in: cartData.product.map(p => p.productId) } }
            },
        });

        const user = await User.findById(id);
        const walletCount = await Wallet.countDocuments({ userId: id });

        if (user.refferedCode && user.is_reffered === false) {
            if (walletCount === 0) {
                const wallet = new Wallet({
                    userId: id,
                    totalPrice: 50,
                });
                await wallet.save();
                await User.findByIdAndUpdate(id, { is_reffered: true });
            }
        }

        const referdUser = await User.findOne({ referalCode: user.refferedCode });

        if (referdUser && user.is_reffered === false) {
            const user1 = await User.findOne({ referalCode: user.refferedCode });
            const walletCount1 = await Wallet.countDocuments({ userId: user1._id });

            if (walletCount1 === 0) {
                const wallet = new Wallet({
                    userId: referdUser._id,
                    totalPrice: 100,
                });
                await wallet.save();
            } else {
                await Wallet.findOneAndUpdate({ userId: referdUser._id }, { $inc: { totalPrice: 100 } }, { new: true });
            }
        }
    } catch (err) {
        console.error(err.message);
        const response = {
            error: err.message,
        };
        res.status(400).json(response);
    }
};

const orderPlaceLoad = async (req, res) => {
    try {
        const log = req.session.user_id;
        const orderDetails  = await Order.findOne({ userId : log}).populate('products.product').populate('address').sort({ _id: -1 }).limit(1).lean();

            res.render('order-confirmation', { orderDetails, userId:log });
        await Cart.deleteOne({ userId: log });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    loadPayment,
    placeOrder,
    orderPlaceLoad,
    razorpayVerify
};