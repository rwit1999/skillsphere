import mongoose from 'mongoose'
import validator from 'validator'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter you name"],
    },
    email:{
        type:String,
        required:[true,"Please enter your email"],
        unique:true,
        validate:validator.isEmail,
    },
    password:{
        type:String,
        required:[true,"Please enter your password"],
        minLength:[6,"Password must be atleast 6 characters"],
        select:false,
    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user"
    },
    subscription:{
        id:String,
        status:String //active or inactive
        // will get these 2 from razorpay
    },
    avatar:{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    playlist:[
        {
            course:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Course"
            },
            poster:String
        }
    ],
    createdAt:{
        type:Date,
        default:Date.now
    },
    resetPasswordToken:String, // this will be created when user will reset password
    resetPasswordExpire:String //expire time of the token
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password"))return next()
    const hashedPassword = await bcrypt.hash(this.password,10)
    this.password = hashedPassword
    next()
})

userSchema.methods.getJWTToken = function(){
    const token= jwt.sign({_id:this._id},process.env.JWT_SECRET,{
        expiresIn:"15d"
    })
    return token
}

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.getResetToken = async function(email){
    const resetToken = crypto.randomBytes(20).toString("hex")
    
    //hashing token
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest("hex") 

    this.resetPasswordExpire = Date.now() + 15*60*1000  //15 mins

    return resetToken
}

export const User = mongoose.model('User',userSchema)