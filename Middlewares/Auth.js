import jwt, { decode } from 'jsonwebtoken'
import { catchAsyncError } from './CatchAsyncError.js'
import ErrorHandler from '../Util/ErrorHandler.js'
import {User} from '../Models/User.js'

export const isAuthenticated = catchAsyncError(async (req,res,next)=>{
    const token = req.cookies.token
    if(!token)return next(new ErrorHandler("Not logged in",401))

    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    
    req.user = await User.findById(decoded._id)

    next()
})

export const authorizeAdmin = (req,res,next)=>{
    if(req.user.role!=='admin')
        return next(new ErrorHandler(`${req.user.role} is not allowed to access this`,403))
    next()
}

export const authorizeSubscribers = (req,res,next)=>{
    if(req.subscription.status!=='active' && req.user.role!=='admin')
        return next(new ErrorHandler(`Only subscribers can access this`,403))
    next()
}