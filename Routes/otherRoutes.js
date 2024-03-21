import express from "express"
import { authorizeAdmin, isAuthenticated } from "../Middlewares/Auth.js"
import { contact, courseRequest, getDashboardStats} from "../Controllers/otherControllers.js"

const router = express.Router()

//contact form
router.route('/contact').post(contact)

//request form
router.route('/courserequest').post(courseRequest)

//get admin dashboard stats
router.route('/admin/stats').get(isAuthenticated,authorizeAdmin,getDashboardStats)

export default router