import {User} from '../Models/User.js'
import ErrorHandler from '../Util/ErrorHandler.js'
import { sendToken } from '../Util/SendToken.js'
import { catchAsyncError } from '../Middlewares/CatchAsyncError.js'
import { sendEmail } from '../Util/SendEmail.js'
import crypto from 'crypto'
import  {Course} from '../Models/Course.js'
import getDataUri from '../Util/dataUri.js'
import cloudinary from 'cloudinary'
import { Stats } from '../Models/Stats.js'

export const register = catchAsyncError(async (req,res,next)=>{
    
    const {name,email,password} = req.body

    const file=req.file
    const fileUri = getDataUri(file)
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

    if(!name || !email || !password ||!file)return next(new ErrorHandler("Please enter all fields",400))
    let user = await User.findOne({email})
    if(user)return next(new ErrorHandler("user already exists",400))

    user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url
        }
    })
    sendToken(res,user,"Registered Successfully",201)
})  

export const login = catchAsyncError(async (req,res,next)=>{

    const {email,password} = req.body
    if(!email || !password) return next(new ErrorHandler("Please enter all fields",400))
    const user = await User.findOne({email}).select("+password")
    if(!user)return next(new ErrorHandler("User doesn't exists",401))

    const isMatch = await user.comparePassword(password);
    if(!isMatch)return next(new ErrorHandler("Incorrect email or password",401))


    sendToken(res,user,`Welcome back ${user.name}`,200)

})

export const logout = catchAsyncError(async (req,res,next)=>{

    const options={
        expires:new Date(Date.now() + 15*24*60*60*1000),
        httpOnly:true,
        secure:true,
        sameSite:true
    }

    res.status(200).cookie("token",null,options).json({
        success:true,
        message:"Logged out successfully"
    })
})


export const getMyProfile = catchAsyncError(async (req,res,next)=>{

    const user = await User.findById(req.user._id)
    
    res.status(200).json({
        success:true,
        user
    })
})

export const changePassword = catchAsyncError(async (req,res,next)=>{

    const {oldPassword,newPassword} = req.body
    if(!oldPassword || !newPassword)return next(new ErrorHandler("Please enter all fields",400))

    const user = await User.findById(req.user._id).select("+password")

    const isMatch = await user.comparePassword(oldPassword)
    if(!isMatch)return next(new ErrorHandler("Incorrect old password",400))

    user.password = newPassword 

    await user.save()
    
    res.status(200).json({
        success:true,
        message:"Password changed successfully"
    })
})

export const updateProfile = catchAsyncError(async (req,res,next)=>{

    const {name,email} = req.body
    const user = await User.findById(req.user._id)

    if(name)user.name = name
    if(email)user.email = email 

    await user.save()
    
    res.status(200).json({
        success:true,
        message:"Profile updated successfully"
    })
})

export const updateProfilePicture = catchAsyncError(async (req,res,next)=>{

    const file=req.file
    const user = await User.findById(req.user._id)
    const fileUri = getDataUri(file)
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    user.avatar={
        public_id:myCloud.public_id,
        url:myCloud.secure_url
    }
    await user.save()
    
    res.status(200).json({
        success:true,
        message:"Profile picture updated successfully"
    })
})

export const forgetPassword = catchAsyncError(async (req,res,next)=>{

    const {email} = req.body
    const user = await User.findOne({email})

    if(!user)return next(new ErrorHandler("User doesn't exists",400))
    
    const resetToken = await user.getResetToken()

    await user.save()

    //send token via email

    const url = `${process.env.FRONTEND_URL}/api/v1/resetpassword/${resetToken}`

    const message = `Click on the link to reset your password. ${url}. Ignore if not requested `
    await sendEmail(user.email,"Skillsphere Reset Password",message)
    
    res.status(200).json({
        success:true,
        message:"Reset token has been send to your email"
    })
})

export const resetPassword = catchAsyncError(async (req,res,next)=>{

    const {token} = req.params
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest("hex")
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt:Date.now()
        }
    })

    if(!user)return next(new ErrorHandler("Token is invalid or has expired",401))

    user.password = req.body.password
    user.resetPasswordExpire=undefined
    user.resetPasswordToken=undefined

    await user.save()
    
    res.status(200).json({
        success:true,
        message:"Password changed successfully"
    })
})

export const addToPlaylist = catchAsyncError(async (req,res,next)=>{

    const user = req.user
    const courseId = req.body.id
    const course = await Course.findById(courseId)

    if(!course)return next(new ErrorHandler("Invalid course id",400))

    const courseInUserPlaylist = user.playlist.find((item)=>{
        if(item.course.toString()===courseId)return true;
    })

    if(courseInUserPlaylist)return next(new ErrorHandler("Course already exixts in your playlist",400))
 
    user.playlist.push({
        course:course._id,
        poster:course.poster.url
    })

    await user.save()
    
    res.status(200).json({
        success:true,
        message:"Added to playlist"
    })
})

export const removeFromPlaylist = catchAsyncError(async (req,res,next)=>{

    const user = req.user
    const courseId = req.body.id

    const newPlaylist = user.playlist.filter((item)=>{
        item.course.toString()!==courseId
    })
    user.playlist=newPlaylist

    await user.save()

    res.status(200).json({
        success:true,
        message:"Removed from playlist"
    })
})

//Admin controllers

export const getAllUsers = catchAsyncError(async (req,res,next)=>{
    const users = await User.find({})
    res.status(200).json({
        success:"true",
        users
    })
})

export const updateUserRole = catchAsyncError(async (req,res,next)=>{
    const id=req.params.id
    const user = await User.findById(id)
    if(!user)return next(new ErrorHandler("User not found",401))

    if(user.role==='user')user.role="admin"
    else user.role="user"

    await user.save()

    res.status(200).json({
        success:"true",
        msg:"Role updated"
    })
})

export const deleteUser = catchAsyncError(async (req,res,next)=>{
    const id=req.params.id
    const user = await User.findById(id)
    if(!user)return next(new ErrorHandler("User not found",401))

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    
    //cancel subscription (todo)

    await user.deleteOne()

    res.status(200).json({
        success:"true",
        msg:"User deleted successfully"
    })
})

export const deleteMe = catchAsyncError(async (req,res,next)=>{
    const id=req.user._id
    const user = await User.findById(id)
    if(!user)return next(new ErrorHandler("User not found",401))

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    
    await user.deleteOne()

    res.status(200).cookie("token",null,{
        expires:new Date(Date.now())
    }).json({
        success:"true",
        msg:"User deleted successfully"
    })
})

User.watch().on("change",async()=>{ 
    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1)   // stats for last month

    const subscription = User.find({"subscription.stats":"active"})

    stats[0].subscriptions = subscription.length
    stats[0].users = await User.countDocuments()
    stats[0].createdAt = new Date(Date.now())

    await stats[0].save()
})