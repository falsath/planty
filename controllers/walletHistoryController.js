

const Order=require('../model/orderModel')
const Wallet=require('../model/walletHistoryModel')



const loadWallet = async (req, res) => {
    try {
        const log = req.session.user_id;

        // Fetch all orders for the logged-in user
        const orderData = await Order.find({ userId: log });
        console.log('Fetched Orders:', orderData);

        // Filter cancelled orders and wallet transactions
        const filteredData = orderData.filter(order => order.is_cancelled && order.paymentMethod !== 'COD');
        const creditData = orderData.filter(order => order.paymentMethod === 'WALLET');

        console.log('Filtered Cancelled Orders:', filteredData);
        console.log('Filtered Wallet Orders:', creditData);

        // Fetch or initialize the user's wallet details
        let wallet = await Wallet.findOne({ userId: log }).lean();
        console.log("walletttt:",wallet);
        
        if (!wallet) {
            wallet = { userId: log, totalPrice: 0, walletBalance: 0, transactions: [] };
            console.log("Initialized new wallet:", wallet);
        }

        // Render the wallet page with relevant data
        res.render('wallet', { log, wallet, data: filteredData, data1: creditData, orderData, userId: log });
    } catch (err) {
        console.error("Error in loadWallet:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    loadWallet
};
