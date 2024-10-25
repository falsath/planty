
const isLogin = async(req,res,next) => {

    try {
        
        if(req.session.user_id){
            console.log("Next")
            next()
        }else{
            console.log("reached")
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
    }
    

}

const isLogout = async(req,res,next) => {

    try {
        
       next()
        
    } catch (error) {
        console.log(error.message)
    }

}

module.exports ={
    isLogout,
    isLogin
}