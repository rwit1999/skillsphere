import { catchAsyncError } from "../Middlewares/CatchAsyncError.js";
import ErrorHandler from "../Util/ErrorHandler.js";
import { sendEmail } from "../Util/SendEmail.js";
import  {Stats} from '../Models/Stats.js'

export const contact=catchAsyncError(async(req,res,next)=>{
    const {name,email,message}=req.body
    if(!name || !email || !message){
        return next(new ErrorHandler("All fields are mandatory",400))
    }
    const to=process.env.MY_MAIL
    const subject = "Contact form Skillsphere"
    const text = `I am ${name} and my email is ${email}. \n${message}`

    await sendEmail(to,subject,text)

    res.status(200).json({
        success:true,
        message:"Your message has been sent"
    })
})

export const courseRequest=catchAsyncError(async(req,res,next)=>{
    const {name,email,course}=req.body
    if(!name || !email || !course){
        return next(new ErrorHandler("All fields are mandatory",400))
    }
    const to=process.env.MY_MAIL
    const subject = "Request for a course"
    const text = `I am ${name} and my email is ${email}. \n${course}`

    await sendEmail(to,subject,text)

    res.status(200).json({
        success:true,
        message:"Your request has been sent"
    })
})

export const getDashboardStats=catchAsyncError(async(req,res,next)=>{

    
    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(12)

    const statsData = []
    const requiredSize =12 - stats.length

    for(let i=0;i<stats.length;i++){
        statsData.unshift(stats[i])  // unshift is like push_front
    }

    for(let i=0;i<requiredSize;i++){
        statsData.unshift({
            users:0,
            subscriptions:0,
            views:0
        })
    }

    // last month's data
    const userCount = statsData[11].users
    const subscriptionCount = statsData[11].subscriptions
    const viewsCount = statsData[11].views

    let userProfit = true
    let viewsProfit = true
    let subscriptionProfit = true

    let userPercentage = 0
    let viewsPercentage = 0
    let subscriptionPercentage = 0

    if(statsData[10].users===0)userPercentage = userCount*100
    if(statsData[10].views===0)viewsPercentage = viewsCount*100
    if(statsData[10].subscriptions===0)subscriptionPercentage = subscriptionCount*100
    else{
        const difference={
            users: statsData[11].users - statsData[10].users,
            views: statsData[11].views - statsData[10].views,
            subscriptions: statsData[11].subscriptions - statsData[10].subscriptions
        }
        userPercentage = (difference.users/stats[10].users)*100
        viewsPercentage = (difference.views/stats[10].views)*100
        subscriptionPercentage = (difference.subscriptions/stats[10].subscriptions)*100

        if(userPercentage < 0 )userProfit=false
        if(viewsPercentage < 0 )viewsProfit=false
        if(subscriptionPercentage < 0 )subscriptionProfit=false
    }

    res.status(200).json({
        success:true,
        stats:statsData,
        userCount,
        viewsCount,
        subscriptionCount,
        userPercentage,
        viewsPercentage,
        subscriptionPercentage,
        userProfit,
        viewsProfit,
        subscriptionProfit
    })
})