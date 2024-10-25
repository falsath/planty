const User = require('../model/userModel');
const Product = require('../model/productModel');

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.productId;

        // Add the product to the user's wishlist
        await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } });

        res.redirect('/wishlist');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Error adding to wishlist' });
    }
};

const viewWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const user = await User.findById(userId).populate('wishlist');
        
        const productIds = user.wishlist.map(wishlistItem => wishlistItem._id);

        const wishlistProducts = await Product.find({ _id: { $in: productIds } });

        res.render('wishlist', { wishlist: wishlistProducts, message: '' ,userId});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Error fetching wishlist' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.productId;

        console.log('Removing from wishlist. User ID:', userId, 'Product ID:', productId);

        await User.findByIdAndUpdate(userId, { $pull: { wishlist: productId } });

        res.redirect('/wishlist');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Error removing from wishlist' });
    }
}

module.exports = {
    addToWishlist,
    viewWishlist,
    removeFromWishlist
};