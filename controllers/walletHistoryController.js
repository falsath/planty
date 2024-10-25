const Order = require('../model/orderModel');
const Wallet = require('../model/walletHistoryModel');



// // const loadWallet = async (req, res) => {
// //     console.log("before rendering wallet");
// //     try {
// //         // Log the user ID from the session
// //         console.log("User ID from session:", req.session.user_id);
// //         const log = req.session.user_id;

// //         // Redirect to login if the user is not logged in
// //         if (!log) {
// //             return res.redirect('/login');
// //         }

// //         console.log("Fetching orders for user:", log);
// //         const orderData = await Order.find({ userId: log }).lean(); // Add .lean() for better performance
// //         console.log("Fetched Orders:", orderData);

// //         // Filter orders for credit and debit transactions
// //         const filteredData = orderData.filter(order => order.isCancelled && order.paymentMethod !== 'COD');
// //         const creditData = orderData.filter(order => order.paymentMethod === 'WALLET');

// //         console.log("Filtered Credit Transactions:", filteredData);
// //         console.log("Filtered Debit Transactions:", creditData);

// //         // Fetch wallet details
// //         let wallet = await Wallet.findOne({ userId: log }).lean();
// //         if (!wallet) {
// //             console.log("No wallet found, creating a new one");
// //             wallet = new Wallet({
// //                 userId: log,
// //                 totalPrice: 0,
// //                 walletBalance: 0,
// //                 transactions: []
// //             });
// //             await wallet.save();
// //             console.log("Wallet created:", wallet);
// //         }

// //         console.log("Fetched Wallet:", wallet);

// //         // Check if there are orders; if not, provide empty arrays
// //         const data = filteredData.length ? filteredData : [];
// //         const data1 = creditData.length ? creditData : [];

// //         console.log("Length of filteredData:", data.length);
// //         console.log("Length of creditData:", data1.length);

// //         console.log("Rendering the wallet page with data");
// //         res.render('wallet', { log, data, wallet, data1, orderData });
// //     } catch (err) {
// //         // Enhanced error logging
// //         console.error("Error in loadWallet:", err.message);
// //         console.error("Error Stack Trace:", err.stack);
// //         res.status(500).json({ error: 'Internal server error', details: err.message });
// //     }
// // };


// // module.exports = { 
// //     loadWallet
// // };


// const loadWallet = async(req,res)=>{
//     try{
//         const log = req.session.user_id;
//         const orderData = await Order.find({userId:log});

//         const filteredData = orderData.filter(order=>order.is_cancelled === true && order.paymentMethod!=='COD' );
//         const creditData = orderData.filter(order=>order.paymentMethod === 'WALLET');

//         console.log('filteredData:', filteredData);
//         console.log('creditData', creditData);

//             const wallet = await Wallet.findOne({userId:log}).lean();
//             console.log(wallet);

//             const data = filteredData.map(order=>order);
//             console.log('data:', data);
//             const data1 = creditData.map(order=>order);
//             console.log('data1:', data1);
//             res.render('wallet',{log,data,wallet,data1,orderData});
            

//     }
//     catch(err){
//         console.log(err.message);
//         res.status(500).json({error:'Internal server error'})
//     }
// }

// module.exports = {
//     loadWallet
// }

const loadWallet = async (req, res) => {
    try {
        const log = req.session.user_id;

        // Fetch all orders for the logged-in user
        const orderData = await Order.find({ userId: log });
        console.log('Fetched Orders:', orderData); // Log fetched orders

        // Filter for cancelled orders
        // const filteredCancelledOrders = orderData.filter(order => order.status === 'Cancelled');
        // console.log('Filtered Cancelled Orders:', filteredCancelledOrders); // Log filtered cancelled orders

        // Filter for wallet orders
        // const filteredWalletOrders = orderData.filter(order => order.paymentMethod === 'WALLET');
        // console.log('Filtered Wallet Orders:', filteredWalletOrders); // Log filtered wallet orders




        const filteredData = orderData.filter(order=>order.is_cancelled === true && order.paymentMethod!=='COD' );
        const creditData = orderData.filter(order=>order.paymentMethod === 'WALLET');

        console.log('filteredData:', filteredData);
        console.log('creditData', creditData);



    //     // Fetch the user's wallet details
    //     let wallet = await Wallet.findOne({ userId: log }).lean();
    //     if (!wallet) {
    //         // If no wallet exists, create a new wallet with default values
    //         wallet = {
    //             totalPrice: 0,
    //             walletBalance: 0,
    //             transactions: [] 
    //         };
    //     }


    // // Prepare the data to be rendered on the page
    //     const data = filteredCancelledOrders.length ? filteredCancelledOrders : [];
    //     const data1 = filteredWalletOrders.length ? filteredWalletOrders : [];

    const wallet = await Wallet.findOne({userId:log}).lean();
    console.log(wallet);

    const data = filteredData.map(order=>order);
    console.log('data:', data);
    const data1 = creditData.map(order=>order);
    console.log('data1:', data1);




        // Render the wallet page with relevant data
        const userId=log
        res.render('wallet' ,{ log, data, wallet, data1, orderData,userId});
    } catch (err) {
        console.error("Error in loadWallet:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {

    loadWallet
};
