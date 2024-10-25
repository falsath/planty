
const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});
    

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/Planty')

const {errorHandler,notFound}=require('./middleware/errorHandler');

const express = require('express')
const app = express()


const session = require('express-session');


// for user routes  
const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

// for admin routes
const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)

//error handlermiddleware
app.use(notFound);
app.use(errorHandler);


app.get('*',(req,res)=>{
    res.status(404).render('404')
})

const port = process.env.PORT;
app.listen(port || 8000,()=>{
    console.log(`Server listening to port http://localhost:${port}`);
})
