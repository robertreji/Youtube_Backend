import {Router} from 'express'
import { comment, currentUserDetails, getAllvideos, getcomments, getMoreVideosFromChannel, getSubscriberCount, getVideoDetails, getWatchHistory, isLiked, isSubscribed, isUserNameAvailable, likeVideo, loginUser, logOutUser, refreshToken, signUpUser, subscribetoChannel, totalLikes, unlikeVideo, unsubscribetoChannel, upDateWatchHistory, uploadVideo, userVideos, verifyJWT ,verifyUser} from '../controllers/user.controller.js'
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
router.route("/getVideoDetails").post(getVideoDetails)
router.route("/subscribeToChannel").post(verifyJWT,subscribetoChannel)
router.route("/unsubscribeToChannel").post(verifyJWT,unsubscribetoChannel)
router.route("/getSubscriberCount").post(getSubscriberCount)
router.route("/isSubscribed").post(verifyJWT,isSubscribed)
router.route("/getAllvideos").get(getAllvideos)
router.route("/likeVideo").post(verifyJWT,likeVideo)
router.route("/unlikeVideo").post(verifyJWT,unlikeVideo)
router.route("/islikeVideo").post(verifyJWT,isLiked)
router.route("/totalLikes").post(totalLikes)
router.route("/getMoreVideosFromChannel").post(getMoreVideosFromChannel)
router.route("/comment").post(verifyJWT,comment)
router.route("/getAllComments").post(getcomments)
router.route("/updateWatchHistory").post(verifyJWT,upDateWatchHistory)
router.route("/getUserWatchHistory").post(verifyJWT,getWatchHistory)
export default router
