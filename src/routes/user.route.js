import {Router} from 'express'
import { currentUserDetails, isUserNameAvailable, loginUser, logOutUser, refreshToken, signUpUser, uploadVideo, userVideos, verifyJWT ,verifyUser} from '../controllers/user.controller.js'
import { uploadFile } from '../middlewares/fileUploader.middleware.js'

const router = Router()

router.route("/signUp").post(uploadFile.fields([{name:"avatar",maxCount:1}]),signUpUser)
router.route("/isUserNameAvailable").post(isUserNameAvailable)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logOutUser)
router.route('/currentUserdetails').post(verifyJWT,currentUserDetails)
router.route("/verifyUser").get(verifyUser)
router.route("/refreshToken").post(refreshToken)
router.route("/uploadVideo").post(verifyJWT,uploadFile.fields([
    {name:"video",maxCount:1},
    {name:"thumbnail",maxCount:1}
]),verifyJWT,uploadVideo)
router.route("/userVideos").post(verifyJWT,userVideos)
export default router