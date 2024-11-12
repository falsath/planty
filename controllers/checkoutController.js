const Razorpay = require('razorpay');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const Cart = require('../model/cartModel');
const User = require('../model/userModel');
const Wallet = require('../model/walletHistoryModel')


//Instantiate Razorpay
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
})


const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const cart = await Cart.findOne({ userId }).populate('products.product');

        const user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let totalPrice = 0;
  if(req.session.grandtotal){
   totalPrice=req.session.grandtotal
  }else{

    for (const item of cart.products) {
        totalPrice += item.product.price * item.quantity;
    }

  }
        
      

        const cartData = {
            products: cart.products,
            totalPrice: totalPrice
        };

        res.render('checkOut', { userId, cartData, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const placeOrder = async (req, res) => {
  try {
      const userId = req.session.user_id;
      if (!userId) {
          return res.redirect('/home'); // Return immediately after redirect to avoid further execution
      }

      const { payment, name, city, email, address, pincode, state } = req.body;

      const cartData = await Cart.findOne({ userId }).populate('products.product');
      if (!cartData || cartData.products.length === 0) {
          console.error('Error loading cart: CartData array is empty or not found.');
          return res.redirect('/allProduct');
      }


     
       const productsArray = cartData.products.map(product => ({
          product: product.product._id,
          price: product.product.price,
          quantity: product.quantity,
      }));
      const totalPrice = productsArray.reduce((sum, product) => sum + product.price * product.quantity, 0);


// Restrict COD if the total price exceeds Rs 1000
// if (payment === 'COD' && totalPrice > 1000) {
//     return res.status(400).json({ error: 'COD is not available for orders above Rs 1000.' });
//   }


if (payment === 'COD' && totalPrice > 1000) {
    req.session.codError = 'COD is not available for orders above Rs 1000.'; // Store error in session
    return res.redirect('/checkout'); // Redirect back to checkout
  }


      // Handle COD payment
      if (payment === 'COD') {
          const orderData = new Order({
              userId: userId,
              products: productsArray,
              name: name,
              email: email,
              address: { address, city, pincode, state },
              paymentMethod: 'COD',
              quantity: productsArray.reduce((sum, product) => sum + product.quantity, 0),
              totalPrice: totalPrice,
          });

          const validationResult = orderData.validateSync();
          if (validationResult) {
              const errors = Object.values(validationResult.errors).map(err => err.message);
              return res.status(400).json({ error: errors });
          }

          const savedOrder = await orderData.save();
          if (!savedOrder) throw new Error('Failed to save COD order');

          // Update Cart after placing the order
          await Cart.updateOne(
              { userId },
              { $pull: { products: { product: { $in: productsArray.map(p => p.product) } } } }
          );

          // Handle referral and wallet logic
          await handleReferralAndWallet(userId);

          return res.status(200).json({ message: 'Order Placed (COD)', payment: 'COD' });
      }
    //   // Handle Wallet payment
    //   else if (payment === 'WALLET') {
    //       const wallet = await Wallet.findOne({ userId });
    //       if (!wallet || totalPrice > wallet.totalPrice) {
    //           return res.status(400).json({ errorMessages: 'Insufficient balance. Choose another option.' });
    //       }

    //       const updatedWalletTotal = wallet.totalPrice - totalPrice;
    //       const orderData = new Order({
    //           userId: userId,
    //           products: productsArray,
    //           name: name,
    //           email: email,
    //           address: { address, city, pincode, state },
    //           paymentMethod: 'WALLET',
    //           quantity: productsArray.reduce((sum, product) => sum + product.quantity, 0),
    //           totalPrice: totalPrice,
    //       });

    //       await orderData.save();
    //       await Wallet.findOneAndUpdate({ userId }, { totalPrice: updatedWalletTotal });
    //       await Cart.updateOne(
    //           { userId },
    //           { $pull: { products: { product: { $in: productsArray.map(p => p.product) } } } }
    //       );

    //       return res.status(200).json({ message: 'Order Placed', payment: 'WALLET' });
    //   }



     // Wallet payment handling
    //  if (payment === 'WALLET') {
    //     const wallet = await Wallet.findOne({ userId });
    //     if (!wallet || totalPrice > wallet.totalPrice) {
    //         return res.status(400).json({ error: 'Insufficient balance. Choose another payment method.' });
    //     }

    //     // Calculate the new wallet balance after deducting the total price
    //     const updatedWalletTotal = wallet.totalPrice - totalPrice;

    //     // Create order with WALLET payment method
    //     const orderData = new Order({
    //         userId,
    //         products: productsArray,
    //         name,
    //         email,
    //         address: { address, city, pincode, state },
    //         paymentMethod: 'WALLET',
    //         quantity: productsArray.reduce((sum, product) => sum + product.quantity, 0),
    //         totalPrice,
    //     });

    //     const savedOrder = await orderData.save();
    //     if (!savedOrder) throw new Error('Failed to save WALLET order');

    //     // Update Wallet balance
    //     await Wallet.findOneAndUpdate({ userId }, { totalPrice: updatedWalletTotal });

    //     // Clear the Cart after placing the order
    //     await Cart.updateOne(
    //         { userId },
    //         { $set: { products: [] } }
    //     );

    //     // Handle referral and wallet logic
    //     await handleReferralAndWallet(userId);

    //     return res.status(200).json({ message: 'Order Placed using Wallet', payment: 'WALLET' });
    // }



    if (payment === 'WALLET') {
        
        const wallet = await Wallet.findOne({ userId });
        if (!wallet || totalPrice > wallet.walletBalance) {
            return res.status(400).json({ error: 'Insufficient balance. Choose another payment method.' });
        }
    
        // Calculate the new wallet balance after deducting the total price
        const updatedWalletBalance = wallet.walletBalance - totalPrice;
    
        // Create order with WALLET payment method
        const orderData = new Order({
            userId,
            products: productsArray,
            name,
            email,
            address: { address, city, pincode, state },
            paymentMethod: 'WALLET',
            quantity: productsArray.reduce((sum, product) => sum + product.quantity, 0),
            totalPrice,
        });
    
        const savedOrder = await orderData.save();
        if (!savedOrder) throw new Error('Failed to save WALLET order');
    
        // Update Wallet balance and add a transaction entry
        await Wallet.findOneAndUpdate(
            { userId },
            {
                walletBalance: updatedWalletBalance,
                $push: {
                    transactions: {
                        transactionType: 'debit',
                        amount: totalPrice,
                        description: 'Order payment using wallet',
                        date: new Date()
                    }
                }
            }
        );
    
        // Clear the Cart after placing the order 
        await Cart.updateOne(
            { userId },
            { $set: { products: [] } }
        );
    
        // Handle referral and wallet logic
        await handleReferralAndWallet(userId);
    
        return res.status(200).json({ message: 'Order Placed using Wallet', payment: 'WALLET' });
    }
    

      // Handle UPI payment using Razorpay
      else if (payment === 'UPI') {
          const amount = totalPrice * 100; // Amount in paise
          const options = {
              amount,
              currency: "INR",
              receipt: generateOrderId(),
          };

          const order = await razorpayInstance.orders.create(options);
          if (!order) return res.status(500).json({ error: 'Failed to create Razorpay order' });

          // Save Razorpay order info in session (temporary)
          req.session.razorpayOrder = {
              userId: userId,
              products: productsArray,
              name: name,
              email: email,
              address: { address, city, pincode, state },
              paymentMethod: 'UPI',
              quantity: productsArray.reduce((sum, product) => sum + product.quantity, 0),
              totalPrice: totalPrice,
              razorpayOrderId: order.id
          };

          const response = {
              method: "UPI",
              success: true,
              amount,
              key_id: RAZORPAY_KEY_ID,
              order,
          };

          return res.status(200).json({ response });
      } else {
          return res.status(400).json({ error: 'Invalid payment method' });
      }
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

const handleReferralAndWallet = async (userId) => {
  const user = await User.findById(userId);
  if (user.refferedCode && !user.is_reffered) {
      const count = await Wallet.countDocuments({ userId });
      if (count === 0) {
          const wallet = new Wallet({ userId, totalPrice: 50 });
          await wallet.save();
          await User.findByIdAndUpdate(userId, { is_reffered: true });
      }
  }

  const referredUser = await User.findOne({ referalCode: user.refferedCode });
  if (referredUser && !user.is_reffered) {
      const referredUserWallet = await Wallet.findOne({ userId: referredUser._id });
      if (!referredUserWallet) {
          await new Wallet({ userId: referredUser._id, totalPrice: 100 }).save();
      } else {
          await Wallet.findOneAndUpdate({ userId: referredUser._id }, { $inc: { totalPrice: 100 } });
      }
  }
};

function generateOrderId() {
  const timestamp = Date.now().toString(); // Get current timestamp
  const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string

  // Concatenate timestamp and random string to create the order ID
  const orderId = `${timestamp}-${randomString}`;

  return orderId;
}

const razorpayVerify = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const cartData = await Cart.findOne({ userId }).populate('products.product').lean();
      if (!cartData) {
          throw new Error('Cart not found');
      }

      const { quantity, price, name } = req.body;
      const quantityArray = Array.isArray(quantity) ? quantity.map(Number) : [Number(quantity)];
      const priceArray = Array.isArray(price) ? price.map(Number) : [Number(price)];

      if (quantityArray.some(isNaN) || priceArray.some(isNaN)) {
          throw new Error('Invalid quantity or price values');
      }

      const productsArray = quantityArray.map((quantity, index) => ({
          product: cartData.products[index].product._id,
          quantity: parseInt(quantity),
          price: parseFloat(priceArray[index]),
      }));

      const totalPrice = productsArray.reduce((sum, product) => sum + product.price * product.quantity, 0);

      const orderData = new Order({
          userId: userId,
          products: productsArray,
          name: req.body.name,
          email: req.body.email,
          address: {
              address: req.body.address,
              city: req.body.city,
              pincode: req.body.pincode,
              state: req.body.state,
          },
          paymentMethod: req.body.payment,
          quantity: productsArray.reduce((sum, product) => sum + product.quantity, 0),
          totalPrice: totalPrice,
      });

      const savedOrder = await orderData.save();
      if (!savedOrder) {
          throw new Error('Failed to save order');
      }

      await Cart.updateOne({ userId }, { $pull: { products: { product: { $in: cartData.products.map(p => p.product) } } } });
      await handleReferralAndWallet(userId);

      const response = {
          success: true,
          message: 'Order Placed',
          payment: req.body.payment,
      };

      res.status(200).json(response);
  } catch (err) {
      console.error(err.message);
      res.status(400).json({ error: err.message });
  }
};

const orderPlaceLoad = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const orderDetails = await Order.findOne({ userId }).populate('products.product').sort({ _id: -1 }).lean();
      res.render('order-confirmation', { orderDetails, userId: userId });
      await Cart.deleteOne({ userId });
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { 
  loadCheckout,
  placeOrder,
  orderPlaceLoad,
  razorpayVerify,
};




