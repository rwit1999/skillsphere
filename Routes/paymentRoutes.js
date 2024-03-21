import express from "express"
import { isAuthenticated } from "../Middlewares/Auth.js"
import { buySubscription, cancelSubscription, getRazorpayKey, paymentverification } from "../Controllers/paymentControllers.js"
const router = express.Router()

//buy subscription
router.route('/subscribe').get(isAuthenticated,buySubscription)

//verify Payment and save reference in database
router.route('/paymentverification').post(isAuthenticated,paymentverification)

//Get Razorpay Key
router.route('/getrazorpaykey').get(getRazorpayKey)

//cancel subscription
router.route('/subscribe/cancel').delete(isAuthenticated,cancelSubscription)

export default router