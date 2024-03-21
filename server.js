import app from "./App.js";
import mongoose from "mongoose";
import cloudinary from 'cloudinary'
import Razorpay from 'razorpay'
import nodeCron from 'node-cron'
import { Stats } from "./Models/Stats.js";

cloudinary.v2.config({
    cloud_name:"dqpkddodw",
    api_key:"435389217868814",
    api_secret:"rroJTEve6SikjetuBLKb1LxaJOg"
})

export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET
});

nodeCron.schedule("0 0 0 1 * *",async ()=>{
    try{
        await Stats.create({})
    }catch(err){
        console.log(err); 
    }
})

mongoose.connect("mongodb+srv://wribobeats:1234567899@cluster0.lf4eiei.mongodb.net/skillsphereDB?retryWrites=true&w=majority").then(()=>{
    console.log('Connected to DB');
}).catch(err=>console.log(err))

app.listen(process.env.PORT,()=>{
    console.log(`Server is working on ${process.env.PORT}`);
})