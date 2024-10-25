


const nodemailer = require('nodemailer');
const UserotpVerification = require('../model/userOTPverification');

const sendOtpEmail = async (email, user_id) => {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`${otp} this is otp`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASS,
            },
        });

        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: 'For Verification',
            html: `<p>Enter <strong>${otp}</strong> in the app to verify your email address.</p>`,
        };

        await UserotpVerification.deleteOne({ userId: user_id });
        const info = await transporter.sendMail(mailOptions);

        console.log('Email has been sent:', info.response);

        const otpVerification = new UserotpVerification({
            userId: user_id,
            otp,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1 * 60 * 1000), // 1 minute expiration
        });

        await otpVerification.save();
    } catch (error) {
        console.log('Error sending verification email:', error.message);
    }
};

module.exports = { sendOtpEmail };
