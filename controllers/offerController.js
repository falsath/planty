const mongoose = require('mongoose');
const Offers = require('../model/categOfferModel');
const Product = require('../model/productModel');
const Category = require('../model/category');

const offerLoad = async (req, res) => {
    try {
        const offers = await Offers.find().lean();
        offers.forEach(offer => {
            const expiryDate = new Date(offer.expireAt);
            const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'UTC'
            });
            offer.expiry = formattedExpiry;
        });
        res.render('viewOffers', { offers });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Internal Server Error');
    }
};

const fetchCategoriesFromDatabase = async () => {

    const category = await Category.find();
    return category;

};

const addOffersLoad = async (req, res) => {
    try {
        const categories = await fetchCategoriesFromDatabase();

        res.render('addOffers', { category: categories });
    }
    catch (err) {
        console.log(err.message);
    }
}

const addOffers = async (req, res) => {
    try {
        const { category, discount, expiry } = req.body;

        const expiryWithOffset = expiry + "+00:00";
        // console.log(expiryWithOffset)
        const expiryDate = new Date(expiryWithOffset);
        console.log(category)
        console.log(discount)
        console.log(expiry)
        console.log(expiryDate)

        //console.log(expiryDate.toISOString())
        const offer = new Offers({
            category: category,
            discount: discount,
            expireAt: expiryDate,
            is_offer: true
        });
        const savedOffers = await offer.save();
        if (savedOffers) {
            const products = await Product.find().populate('category_id');
            console.log('products', products)
            const offer = await Offers.findOne({ is_offer: true });
            console.log('offer', offer)
            const proResult = products.filter(pro => pro.category_id.categoryName.toLowerCase() === offer.category.toLowerCase())
            console.log(proResult)

            const discount = offer.discount;

            const updatedProducts = await Promise.all(
                proResult.map(async (product) => {
                    const earlierPrice = product.price
                    const discountedPrice = product.price * (1 - discount / 100);

                    // Update the product with the discounted price
                    await Product.findByIdAndUpdate(product._id, { $set: { price: discountedPrice, is_offer: true ,earlierPrice} });

                    return { ...product, discountedPrice };
                })
            );

            console.log('updatedProducts:', updatedProducts)
            if (updatedProducts) {
                await Offers.findOneAndUpdate({ is_offer: true }, { $set: { is_offer: false } });
            }

            console.log(`${updatedProducts.length} products updated with individual discounts.`);


            res.redirect('/admin/offers');
        }

    }
    catch (err) {
        console.log(err.message);
    }
}






module.exports = {
    offerLoad,
    addOffersLoad,
    addOffers
};
