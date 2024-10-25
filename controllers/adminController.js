const User = require('../model/userModel')

const Product = require('../model/productModel')

const Category = require('../model/category')

const bcrypt = require('bcrypt')

const Order = require('../model/orderModel')

// ...............................user....................................

const loadLogin = async (req, res) => {
    
    

    try {
        

        res.render('login')

    } catch (error) {
        console.log(error.message)
    }

}

const verfyLogin = async (req, res) => {

    

    try {

        const email = req.body.email
        const password = req.body.password

        const userDate = await User.findOne({ email: email });


        if (userDate) {

            const passwordMatch = await bcrypt.compare(password, userDate.password);

            if (passwordMatch) {

                if (userDate.is_admin === 0) {
                    res.render('login', { message: 'Email and password is incorrect' })
                } else {
                    req.session.admin_id = userDate._id
                    res.redirect('/admin/home')
                }

            } else {
                res.render('login', { message: 'Email and password is incorrect' })

            }

        } else {
            res.render('login', { message: 'Email and password is incorrect' })

        }

    } catch (error) {

        console.log(error.message)
    }

}

const loadHome = async (req, res) => {
    

    try {

        let log = req.session.admin_id;
        //const salesCount = await Order.find({ status: 'Delivered' }).count().lean();

        const adminData = await User.findOne({ _id: log });
        res.render('home', { adminData, salesCount:[] });

    } catch (error) {
        console.log(error.message)
    }

}

const logout = async (req, res) => {

    try {

        req.session.admin_id = null;
        // req.session.destroy()
        res.redirect('/admin')

    } catch (error) {
        console.log(error.message)
    }
}

const userList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = 15; // Number of users per page

        const totalCount = await User.countDocuments({ is_admin: 0 });
        const totalPages = Math.ceil(totalCount / limit);

        const userData = await User.find({ is_admin: 0 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('userList', { user: userData, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




const blockUser = async (req, res) => {

    try {

        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: true } })
        res.redirect('/admin/UserList');

    } catch (error) {

        console.log(error.message)

    }
};

const unblockUser = async (req, res) => {

    try {

        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: false } });
        res.redirect('/admin/userList');

    } catch (error) {

        console.log(error.message);
    }
};


module.exports = {
    loadLogin,
    verfyLogin,
    loadHome,
    logout,
    userList,
    blockUser,
    unblockUser,

}