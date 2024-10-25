//not found

const notFound = (req,res,next)=>{
    const error = new Error(`Not Found : ${req.originalUrl}`);
    res.status(404).render('404',{title:'404'});
   return next(error);
}

//Error handler

const errorHandler=(err,req,res,next)=>{
   
   const statusCode = res.statusCode || 500;
   
    res.status(statusCode)
}

module.exports={errorHandler,notFound};