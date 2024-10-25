const express = require('express')

const admin_route = express()

const config = require('../config/config')


require('dotenv').config()



const session = require('express-session')
admin_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true,
    cookie:{maxAge:600000}
}))

const path = require('path')


const multer = require('multer')
const storage = multer.diskStorage({
    destination:(req,res,cd) => {
        cd(null,path.join(__dirname,'../public/productImage'))
    },
    filename:(req,file,cd) => {
        const name = Date.now()+'-'+file.originalname
        cd(null,name)
    }
})

const upload = multer({storage:storage,}) 

const bodyParse = require('body-parser')
admin_route.use(bodyParse.json())
admin_route.use(bodyParse.urlencoded({extended:true}))

admin_route.use('/public',express.static('public'))
admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

const auth = require('../middleware/adminauth')

const adminController = require('../controllers/adminController')

// ......................user...............................

admin_route.get('/',auth.isLogout,adminController.loadLogin)

admin_route.post('/',adminController.verfyLogin)

admin_route.get('/home',auth.isLogin,adminController.loadHome)

admin_route.get('/logout',auth.isLogin,adminController.logout)

admin_route.get('/userList',auth.isLogin,adminController.userList)

admin_route.get('/block-user', adminController.blockUser);

admin_route.get('/unblock-user', adminController.unblockUser);

// ......................category...............................

const categoryController = require('../controllers/categoryController')

admin_route.get('/addCategory', categoryController.loadCategory)

admin_route.post('/addCategory', categoryController.addCategory)

admin_route.get('/viewCategory',auth.isLogin,categoryController.loadCategoryList)

admin_route.get('/editCategory',auth.isLogin,categoryController.editCategoryLoad)

admin_route.post('/editCategory',categoryController.editCategory)

admin_route.get('/deleteCategory',categoryController.deleteCategory) 


// ......................product...............................

const productController = require('../controllers/productController')

admin_route.get('/viewProduct',auth.isLogin,productController.loadProductList)

admin_route.get('/addProduct', productController.loadProduct)

admin_route.post('/addProduct',upload.array('image',3), productController.addProduct)

admin_route.get('/editProduct',auth.isLogin,productController.editProductLoad)

admin_route.post('/editProduct',upload.array('image',3),productController.updateProduct)

admin_route.get('/deleteProduct',productController.softDeleteProduct)

admin_route.get('/deleteImage', productController.deleteImage);



// .......................order......................................

const orderController = require('../controllers/orderController')

const { approveReturn } = require('../controllers/orderController');


admin_route.get('/viewOrder',orderController.loadOrder)

admin_route.put('/orders/:orderId/status', orderController.updateOrderStatus)

// Route to approve return
// admin_route.post('/orders/:orderId/return-status', orderController. updateReturnStatus);

// admin_route.put('/orders/:orderId/return-status', orderController.updateReturnStatus);


// ......................coupons.......................................................

const couponController = require('../controllers/couponController');

admin_route.get('/coupons', auth.isLogin, couponController.couponLoad)

admin_route.get('/add-coupon', auth.isLogin, couponController.addCouponLoad)

admin_route.post('/add-coupon',auth.isLogin, couponController.createCoupon)

admin_route.get('/edit-coupon', auth.isLogin, couponController.loadEditCoupon)

admin_route.post('/edit-coupon',auth.isLogin, couponController.editCoupons)

admin_route.get('/delete-coupon', auth.isLogin, couponController.deleteCoupons)

admin_route.get('/unlist-coupon', auth.isLogin, couponController.unlistCoupon);  
admin_route.get('/list-coupon', auth.isLogin, couponController.listCoupon);

// .....................offers............................................

const offerController =require('../controllers/offerController')

//category

admin_route.get('/offers', auth.isLogin, offerController.offerLoad)

admin_route.get('/add-offers', auth.isLogin, offerController.addOffersLoad)

admin_route.post('/addOffers',auth.isLogin, offerController.addOffers);


// ....................salesReport......................

const salesReportController = require('../controllers/salesReportController')

admin_route.get('/reports', auth.isLogin, salesReportController.loadReport);

admin_route.get('/export-ordersExcel', auth.isLogin, salesReportController.exportExcelOrders);

admin_route.get('/export-ordersPdf', auth.isLogin, salesReportController.exportPdfOrders);



// ..........................charts..........................................

const chartController = require('../controllers/chartController')



admin_route.get('/monthlyBarChart', auth.isLogin, chartController.monthlyBarChart);

admin_route.get('/yearlyBarChart', auth.isLogin, chartController.yearlyBarChart);



admin_route.get('/monthlyAreaChart', auth.isLogin, chartController.monthlyAreaChart);

admin_route.get('/yearlyAreaChart', auth.isLogin, chartController.yearlyAreaChart);

admin_route.get('/piechart', auth.isLogin, chartController.piechart);

admin_route.get('/linechart', auth.isLogin, chartController.linechart);








admin_route.get('*',(req,res)=>{
    res.redirect('/admin')
})

module.exports = admin_route