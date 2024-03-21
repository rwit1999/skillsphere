import express from "express"
import { addToPlaylist, changePassword, deleteMe, deleteUser, forgetPassword, getAllUsers, getMyProfile, login, logout, register, removeFromPlaylist, resetPassword, updateProfile, updateProfilePicture, updateUserRole } from "../Controllers/userController.js"

import {authorizeAdmin, isAuthenticated} from "../Middlewares/Auth.js"
import singleUpload from "../Middlewares/multer.js"

const router = express.Router()

router.route('/register').post(singleUpload,register)
router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/me')
    .get(isAuthenticated,getMyProfile)
    .delete(isAuthenticated,deleteMe)
router.route('/changepassword').put(isAuthenticated,changePassword)  //put is for update
router.route('/updateprofile').put(isAuthenticated,updateProfile)  
router.route('/updateprofilepicture').put(isAuthenticated,singleUpload,updateProfilePicture) 

router.route('/forgetpassword').post(forgetPassword)  
router.route('/resetpassword/:token').put(resetPassword)  

router.route('/addtoplaylist').post(isAuthenticated,addToPlaylist)  
router.route('/removefromplaylist').delete(isAuthenticated,removeFromPlaylist)  

//ADmin routes
router.route('/admin/users').get(isAuthenticated,authorizeAdmin,getAllUsers)
router.route('/admin/user/:id')
    .put(isAuthenticated,authorizeAdmin,updateUserRole)
    .delete(isAuthenticated,authorizeAdmin,deleteUser)

export default router