const User = require('../model/userModel')

const Product = require('../model/productModel')

const Category = require('../model/category')

const nodemailer = require('nodemailer')

const UserotpVerification = require('../model/userOTPverification')

const OrderModel = require('../model/orderModel')

const CategoryOffer = require('../model/categOfferModel');
const WalletHistory = require('../model/walletHistoryModel'); // Ensure you require the WalletHistory model







const mongoose = require('mongoose');

const bcrypt = require('bcrypt')

const randomstring = require('randomstring')

require('dotenv').config()

const otpHelper = require('../controllers/otpHelper');

const securePassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash

    } catch (error) {
        console.log(error.message)
    }
}


const loadRegister = async (req, res) => {
    try {

        res.render('signup')

    } catch (error) {
        console.log(error.message)
    }
}



// login user methods started

const insertUser = async (req, res) => {
    try {
        const email = req.body.email;

        const generateReferalId = () => {
            const timestampPart = Date.now().toString().slice(-8);
            const randomPart = Math.floor(Math.random() * 100000000).toString().slice(0, 2);

            return timestampPart + randomPart;
        };

        const exitEmail = await User.findOne({ email: email });
        if (exitEmail) {
            return res.render('signup', { message: 'Email already exists', exist: true });
        }

        const spassword = await securePassword(req.body.password);
        const refId = generateReferalId();

        const refCode = req.body.ref_code;
        let referrer = null;


        // Check if the provided referral code is valid
        if (refCode) {
            referrer = await User.findOne({ referalCode: refCode });

            if (!referrer) {
                return res.render('signup', { message: 'Invalid referral code', exist: true });
            }
        }

        const user = new User({
            name: req.body.name,
            username: req.body.username,
            dob: req.body.dob,
            email: email,
            addresses: [{ address: req.body.address }],
            mobile: req.body.mobile,
            password: spassword,
            gender: req.body.gender,
            referalCode: refId,
            refferedCode: refCode,
            is_referred: referrer !== null,
            is_admin: 0,
        });

        const userData = await user.save();

        // If there is a referrer, update their wallet or provide some reward
        if (referrer) {
            const rewardAmount = 100; // Example reward amount (adjust as needed)

            // Update the referrer's wallet history with a credit transaction
            const creditTransaction = new WalletHistory({
                userId: referrer._id,
                amount: rewardAmount,
                type: 'credit',
            });

            await creditTransaction.save();
        }
        if (userData) {
            await otpHelper.sendOtpEmail(req.body.email, userData._id, res);
            res.redirect(`/verifyMail/${userData._id}`);
        } else {
            res.render('signup', { message: 'Your registration has failed' });
        }

    } catch (error) {
        console.error(error.message);
        res.render('signup', { message: 'Error during registration' });
    }
};

const loginLoad = async (req, res) => {

    try {

        res.render('login')

    } catch (error) {

        console.log(error.message)

    }

}

// login verification
const verifyLogin = async (req, res) => {

    try {

        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({ email: email })

        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {

                if (userData.is_verified === 0) {
                    res.render('login', { message: 'please verify your mail.' })
                } else {
                    req.session.user_id = userData._id
                   console.log("haiiii:",req.session.user_id)
                    res.redirect('/home')
                }

            } else {

                res.render('login', { message: 'Email and Password are incorrect' })
            }

        } else {
            res.render('login', { message: 'Email and Password are incorrect' })
        }

    } catch (error) {
        console.log(error.message)
    }

}

const loadHome = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const user = await User.findById(req.session.user_id);
        if (user) {
            if (user.is_blocked) {
              return  res.render('login', { message: 'Your account is blocked.' });
            } else {
              return  res.render('home', { userId });
            }
        } else {
            // return res.render('login', { message: 'User not found. Please log in again.' });
            return  res.render('home',{ userId: null });
        }
       
    } catch (error) {
        console.log(error.message);
        return res.render('login', { message: 'Error loading home page.' });
    }
}


const userLogout = async (req, res) => {

    try {

        req.session.destroy()
        res.redirect('/')

    } catch (error) {
        console.log(error.message)
    }

}

const verifyMail = async (req, res) => {
    try {

        const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } })

        console.log(updateInfo)
        res.render('verifyMail', { userId: req.params.id });

    } catch (error) {
        console.log(error.message)
    }
}


const resendOtp = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findOne({ _id: userId })

        if (!user) {
            return res.status(404).send('user not found')
        }

        // resend the otp
        await otpHelper.sendOtpEmail(user.email, userId, res);
        // sendVerifyMail(user.email, userId, res)

        res.redirect(`/verifyMail/${userId}`)

    } catch (error) {
        console.log(error.message)
        res.status(500).send('Internal server Error')
    }
}



const verifyOtp = async (req, res) => {
    try {
        const userId = req.body.userId;
        const enteredOtp = req.body.otp;

        const userotp = await UserotpVerification.findOne({ userId: userId });

        if (userotp && userotp.otp === enteredOtp && userotp.expiresAt > new Date()) {
            await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

            // Check if the wallet exists for the user
            const walletExists = await WalletHistory.findOne({ userId });

            if (!walletExists) {
                // Create a new wallet with default balance
                await WalletHistory.create({
                    userId: userId,
                    walletBalance: 0, // Initial wallet balance can be 0 or any default value
                    totalPrice: 0,
                    transactions: []
                });
            }

            res.redirect('/login');
        } else {
            if (userotp && userotp.expiresAt <= new Date()) {
                res.render('verifyMail', { error: 'OTP has expired, please request a new one', userId: userId });
            } else {
                res.render('verifyMail', { error: 'Invalid OTP, please enter the correct OTP', userId: userId });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.render('verifyMail', { error: 'An error occurred', userId: userId });
    }
};


// const verifyOtp = async (req, res) => {
//     try {
//         const userId = req.body.userId;
//         const enteredOtp = req.body.otp;

//         const userotp = await UserotpVerification.findOne({ userId: userId });

//         if (userotp && userotp.otp === enteredOtp && userotp.expiresAt > new Date()) {
//             await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

//             res.redirect('/login');
//         } else {

//             if (userotp && userotp.expiresAt <= new Date()) {
//                 res.render('verifyMail', { error: 'OTP has expired, please request a new one', userId: userId });
//             } else {

//                 res.render('verifyMail', { error: 'Invalid OTP, please enter the correct OTP', userId: userId });
//             }
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.render('verifyMail', { error: 'An error occurred', userId: userId });
//     }
// };



// const verifyOtp = async (req, res) => {
//     try {
//         const userId = req.body.userId;
//         const enteredOtp = req.body.otp;

//         // Retrieve OTP record from the database
//         const userotp = await UserotpVerification.findOne({ userId: userId });

//         console.log('Entered OTP:', enteredOtp);
//         console.log('Stored OTP:', userotp ? userotp.otp : 'Not found');
//         console.log('OTP Expiration Time:', userotp ? userotp.expiresAt : 'Not found');
        
//         // Check OTP validity and expiration
//         if (userotp && userotp.otp === enteredOtp && userotp.expiresAt > new Date()) {
//             // Update user verification status
//             await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });
            
//             // Return success response with redirect URL
//             return res.status(200).json({ redirectUrl: '/login', message: 'Registration complete. Redirecting to login.' });
//         } else {
//             let errorMessage;
//             if (userotp && userotp.expiresAt <= new Date()) {
//                 errorMessage = 'OTP has expired, please request a new one';
//             } else {
//                 errorMessage = 'Invalid OTP, please enter the correct OTP';
//             }
//             // Return error response
//             return res.status(400).json({ error: errorMessage });
//         }
//     } catch (error) {
//         console.error('Error:', error.message);
//         return res.status(500).json({ error: 'An error occurred' });
//     }
// };


// for forget password...
const forgetLoad = async (req, res) => {

    try {

        res.render('forgetLoad', { message: "" })

    } catch (error) {
        console.log(error.message)
    }

}

const forgetVerify = async (req, res) => {

    try {

        const email = req.body.email
        const userData = await User.findOne({ email: email })

        if (userData) {

            if (userData.is_verified === 0) {
                res.render('forgetLoad', { message: 'Please verify your mail' })
            } else {
                const randomString = randomstring.generate()
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } })
                sendResetPasswordMail(userData.email, userData._id, randomString)
                res.render('forgetLoad', { message: 'Please check your mail to reset your password' })
            }
        } else {
            res.render('forgetLoad', { message: 'email is incorrect' })
        }

    } catch (error) {
        console.log(error.message)
    }

}

const sendResetPasswordMail = async (email, user_id, token) => {

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASS  //You should provide your password here
            }
        })

        const mailOptions = {
            from: 'falsathkoolath@gmail.com',
            to: email,
            subject: 'For Verification',
            html: `<p>Click the link <a href="http://13.238.252.35/changePassword?token=${token}">here</a></p>`
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email has been sent to :', info.response)
            }
        })
    } catch (error) {

    }

}

// changepassword

const changePasswordLoad = async (req, res) => {
    try {
        const token = req.query.token
        const tokenData = await User.findOne({ token: token })
        if (tokenData) {

            res.render('changePassword', { user_id: tokenData._id })

        } else {

            res.render('404', { message: 'token is invalid' })

        }

    } catch (error) {
        console.log(error.message)
    }
}

const resetPassword = async (req, res) => {

    try {

        const password = req.body.password
        const user_id = req.body.user_id
        const secure_password = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } })
        res.redirect('/')

    } catch (error) {
        console.log(error.message)
    }

}


const profileLoad = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
        console.log("userid:",userId)
        
        const user = await User.findById(userId).exec();
        console.log("userrr:",user._id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const orderDetails = await OrderModel.find({ userId }).populate('products.product')
         console.log("orderdetailsss:",orderDetails)
        if (orderDetails.length === 0) {

            return res.render('profile', { user, orderDetails: null, userId });
        }

        res.render('profile', { user, orderDetails, userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const editUserLoad = async (req, res) => {
    try {
        const id = req.query. id;
        const userId = req.session.user_id;
        if (!id) {
            return res.redirect('/profile');
        }
        const userData = await User.findById(id);

        if (userData) {
            res.render('edit-user', { user: userData, userId });
        } else {
            res.redirect('/profile');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateUser = async (req, res) => {

    const userId = req.session.user_id;
    const { username, name, mobile, dob, addresses, email, id } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { username, name, mobile, dob, $push: { addresses: { address: addresses } }, email },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const orderDetails = await OrderModel.find({ userId: updatedUser._id }).populate('products.product');

        res.render('profile', { user: updatedUser, orderDetails, message: 'User updated successfully', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;

        const user = await User.findById(req.session.user_id);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (currentPassword === newPassword) {
            return res.json({ success: false, message: 'New password must be different from the current password' });
        }

        // Update user password without OTP-related steps
        const updatedData = await User.findByIdAndUpdate(
            req.session.user_id,
            { $set: { password: hashedPassword } },
            { new: true }
        );

        // Return success response
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error changing password' });
    }
};



const addAddressProfile = async (req, res) => {
    try {
        console.log("reached")
        const userId = req.session.user_id;
        console.log(userId,">>>>1")
        const { newAddress, city, state, pincode, country, phoneNumber } = req.body;
        console.log(req.body,">>>>>>>2")
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    addresses: {
                        address: newAddress,
                        city: city,
                        state: state,
                        pincode: pincode,
                        country: country,
                        phoneNumber: phoneNumber
                    }
                }
            },
            { new: true }
        );
        console.log(updatedUser,">>>>3")
        if (!updatedUser) {
            return res.json({ success: false, message: 'User not found' });
        }

       res.redirect("/profile")
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error adding address' });
    }
};


// const addAddressProfile = async (req, res) => {
//     try {
//         const userId = req.body.userId;
//         const { newAddress, city, state, pincode, country, phoneNumber } = req.body;

//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             {
//                 $push: {
//                     addresses: {
//                         address: newAddress,
//                         city: city,
//                         state: state,
//                         pincode: pincode,
//                         country: country,
//                         phoneNumber: phoneNumber
//                     }
//                 }
//             },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.json({ success: false, message: 'User not found' });
//         }

//         res.json({ success: true, message: 'Address added successfully', user: updatedUser });
//     } catch (error) {
//         console.error(error);
//         res.json({ success: false, message: 'Error adding address' });
//     }
// };







// const addAddressProfile = async (req, res) => {
//     try {
//         const { userId, newAddress, city, state, pincode, country, phoneNumber } = req.body;

//         // Ensure all required fields are provided
//         if (!userId || !newAddress || !city || !state || !pincode || !country || !phoneNumber) {
//             return res.json({ success: false, message: 'All fields are required' });
//         }

//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             {
//                 $push: {
//                     addresses: {
//                         address: newAddress,
//                         city: city,
//                         state: state,
//                         pincode: pincode,
//                         country: country,
//                         phoneNumber: phoneNumber
//                     }
//                 }
//             },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.json({ success: false, message: 'User not found' });
//         }

//         res.json({ success: true, message: 'Address added successfully', user: updatedUser });
//     } catch (error) {
//         console.error(error);
//         res.json({ success: false, message: 'Error adding address' });
//     }
// };



const editAddressLoad = async (req, res) => {
    try {
        const userId = req.query.id;
        const addressId = req.query.addressId;

        if (!userId || !addressId) {
            return res.redirect('/profile');
        }

        const userData = await User.findOne({ _id: userId });

        if (userData) {
            const address = userData.addresses.find(addr => addr._id.toString() === addressId);
            res.render('edit-address', { user: userData, address, userId });
        } else {
            res.redirect('/profile');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const updateAddress = async (req, res) => {
    const { userId, addressId, newAddress, city, state, pincode, country, phoneNumber } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, 'addresses._id': addressId },
            {
                $set: {
                    'addresses.$.address': newAddress,
                    'addresses.$.city': city,
                    'addresses.$.state': state,
                    'addresses.$.pincode': pincode,
                    'addresses.$.country': country,
                    'addresses.$.phoneNumber': phoneNumber
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'User or address not found' });
        }

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error updating address' });
    }
};

const deleteAddress = async (req, res) => {
    const { userId, addressId } = req.query;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error deleting address' });
    }
};

const loadHome1 = (req,res)=>{
   try{
   res.redirect("/home")
   }catch(e){
  console.log(e.message)
   }
}


module.exports = {
    loadHome1,
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    verifyMail,
    verifyOtp,
    resendOtp,
    forgetLoad,
    forgetVerify,
    changePasswordLoad,
    resetPassword,
    // ..................
     profileLoad,
    editUserLoad,
    updateUser,
    changePassword,
    addAddressProfile,
    editAddressLoad,
    updateAddress,
   deleteAddress
}