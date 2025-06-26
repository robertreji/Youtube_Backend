import {asyncHandler} from '../utils/asynchandler.js'
import {ApiError} from '../utils/apiError.js'
import {ApiResponse} from "../utils/apiResponse.js"
import { User } from '../models/user.model.js'
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js'
import jwt from 'jsonwebtoken'
import { Video } from '../models/video.model.js'
import mongoose from 'mongoose'
import { Subscription } from '../models/Subscriptions.js'
import { Like } from '../models/Like.models.js'
import { Comment } from '../models/comment.models.js'

export const signUpUser =asyncHandler(async (req,res)=>{
   const  {username,password} =req.body

   const {avatar} =req.files
   if(!(username && password))throw new ApiError(201,"username and password is required !")
   
   const alreadyExists =await   User.findOne({username:username})
   if(alreadyExists) throw new ApiError(401,"user already exists...")

   const avatarUrl =avatar? await uploadToCloudinary(avatar[0].path):null
   
   const user =await User.create({
    username:username,
    password:password,
    avatar:avatarUrl,
   })
  
   res.status(200).json(new ApiResponse(200,{user},"user signed up secessfully "))
})

export const isUserNameAvailable = asyncHandler(async(req,res)=>{
   const {username}= req.body
   const user = await User.findOne({username:username})

   if(user){
      return res.status(200).json(new ApiResponse(200,true,"username already in use "))
   }
   return res.status(200).json(new ApiResponse(200,false,"username is  available "))
})

export const loginUser = asyncHandler(async (req,res)=>{
   const {username, password} = req.body

   if(!(username && password)) throw new ApiError(402,"username and password are required for login ")
   
   const user= await User.findOne({username:username})
   if(!user) throw new ApiError(402,"user does not exists please sighnUp...")

   const isPasswordCorrect=await user.isPasswordCorrect(password)
   if(!isPasswordCorrect) throw new ApiError(401,"password is wrong, please try again..")
   
   const accessToken  = user.generateAccessToken()
   const refreshToken=user.generateRefreshToken()

   await User.findByIdAndUpdate(user._id,
      {
         refreshToken:refreshToken,
      },
      {
         new:true
      }
   ).select("-password -refreshToken")


       const optionsACessToken ={
            httpOnly :true,
            secure:false,
            sameSite:'lax',
            maxAge:60*60*1000
         }
          const optionsRefreshToken ={
            httpOnly :true,
            secure:false,
            sameSite:'lax',
            maxAge:30*24*60*60*1000
         }
   res.status(200).cookie("accessToken",accessToken,optionsACessToken)
   .cookie("refreshToken",refreshToken,optionsRefreshToken)
   .json(new ApiResponse(200,{},"user looged in sucessfully !"))
})

export const verifyJWT = asyncHandler(async (req,_,next)=>{
      const accessToken = req.cookies.accessToken
      if(!accessToken) throw new ApiError(401,"acess token didint recieved")
    try {
        const decoded = jwt.verify(accessToken,process.env.ACESS_TOKEN_SECRET)        
        const verifiedUser= await User.findById(decoded._id).select("-password -refreshToken")
        if (! verifiedUser) throw new ApiError(401,"unauthorized user")
        req.user=verifiedUser
        next()
    } catch (error) {
      throw new ApiError(401,"acess token has expired")
    }
})

export const logOutUser=asyncHandler(async(req,res)=>
   {
      const userObj=req.user
      
      await User.findByIdAndUpdate(userObj._id,{
         refreshToken:undefined
      },
      {
         new:true
      })
       const options ={
            httpOnly :true,
            secure:false,
            sameSite:'lax',
         }
   console.log("user loogeed out")
   res.status(200)
      .cookie("accessToken",options)
      .cookie("refreshToken",options)
      .json(new ApiResponse(200,{},"user looged Out sucessfully !"))
})

export const currentUserDetails = (req,res)=>{
   const currentUser =req.user
   return res.json(new ApiResponse(200,currentUser,"current user details"))
}


export const verifyUser = asyncHandler(async (req,res)=>{
      const accessToken = req.cookies.accessToken
      if(!accessToken) throw new ApiError(419,"acess token didint recieved")
    try {
        const decoded = jwt.verify(accessToken,process.env.ACESS_TOKEN_SECRET)        
        const verifiedUser= await User.findById(decoded._id).select("-password -refreshToken")
        if (! verifiedUser) throw new ApiError(401,"unauthorized user")
       return res.json(new ApiResponse(200,{userVerified:true},"user is authenticated"))
    } catch (error) {

   throw new ApiError(401,"acess token expired")    
}
})

export const  refreshToken = asyncHandler(async(req,res)=>{
   const {refreshToken} =req.cookies
console.log("🔥 Incoming refresh token:", req.cookies.refreshToken);

   if(!!!refreshToken)throw new ApiError(401,"Refresh token didint recived")
   
      try{
         const decoded =  jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)

         const user =await  User.findById(decoded._id)
         if(!user)throw new ApiError(401,"no user found with that refresh token or unauthorised ")
         const newrefreshToken =user.generateRefreshToken()
         const newacesstoken = user.generateAccessToken()
         await User.findByIdAndUpdate(decoded._id,
            {
               refreshToken:newrefreshToken
            },
            {
               new:true
            }
         )
         const optionsACessToken ={
            httpOnly :true,
            secure:false,
            sameSite:'lax',
            maxAge:15*60*1000
         }
          const optionsRefreshToken ={
            httpOnly :true,
            secure:false,
            sameSite:'lax',
            maxAge:30*24*60*60*1000
         }
         return res.status(200)
         .cookie("accessToken",newacesstoken,optionsACessToken)
         .cookie("refreshToken",newrefreshToken,optionsRefreshToken)
         .json(new ApiResponse(200,{},"refresh token and acess token updated"))

      }catch(err)
      {
         throw new Error
        console.log("unable to Update refresh and acess token")
      }
})

export const uploadVideo = asyncHandler(async(req,res)=>{
   const files =req.files
   const filedetails=req.body
   const user = req.user
  if(!(files && filedetails && user))throw new ApiError(400,"somenthing went wrong wile uploading the file ")
  
   const videoPath = await uploadToCloudinary(files.video[0].path)
   const thumbnailPath = await uploadToCloudinary(files.thumbnail[0].path)

  const video= await Video.create({
      videoFile:videoPath,
      thumbnail:thumbnailPath,
      title:filedetails.title,
      description:filedetails.description,
      owner:user._id,
      duraton:videoPath.duration,
      views:0
   })

   if(!video)throw new ApiError(400,"something went wrong whie uploading")
   res.status(200).json(new ApiResponse(200,{videoPath},"sucessfully uploaded"))
})

export const userVideos = asyncHandler(async (req,res)=>{
   const user = req.user
   if(!user)throw new ApiError(401,"user not verified")
   try {
      const userVideos = await User.aggregate(
         [
            {
               $match: {
                  _id:new mongoose.Types.ObjectId(user._id)
               }
            },
            {
               $lookup: {
                  from: "videos",
                  localField: "_id",
                  foreignField: "owner",
                  as: "userVideos"
               }
            },
            {
               $project: {
                  "_id":0,
                  "userVideos":1
               }
            }
         ]
      )
      console.log("user videos :",userVideos)
      res.status(200).json(new ApiResponse(200,userVideos,"sucess"))
   } catch (error) {
      console.log(error)
   }
})
export const getMoreVideosFromChannel = asyncHandler(async (req,res)=>{
   const {userId} = req.body
   if(!userId)throw new ApiError(401,"user not verified")
   try {
      const userVideos = await User.aggregate(
         [
            {
               $match: {
                  _id:new mongoose.Types.ObjectId(userId)
               }
            },
            {
               $lookup: {
                  from: "videos",
                  localField: "_id",
                  foreignField: "owner",
                  as: "userVideos"
               }
            },
            {
               $project: {
                  "_id":0,
                  "userVideos":1
               }
            }
         ]
      )
      console.log("user videos :",userVideos)
      res.status(200).json(new ApiResponse(200,userVideos,"sucess"))
   } catch (error) {
      console.log(error)
   }
})

export const upDateWatchHistory = asyncHandler(async(req,res)=>{
   const user = req.user
   const {videoId} = req.body

   if(!(user &&  videoId ))throw new ApiError(403,"user and video id didint recieved..")
try {
   
      await User.findByIdAndUpdate(user._id,
         {
           $addToSet:{watchHistory:videoId}
         }
      )
   
      res.json(new ApiResponse(200,{},"sucess"))
} catch (error) {
   return res.json("already aded in list")
}
})
export const getWatchHistory = asyncHandler(async (req,res)=>{
   const user = req.user
  const watHistory= await User.aggregate([
  {
    $match: {
      _id:new  mongoose.Types.ObjectId(user._id)}
  },
  {
    $lookup: {
      from: "videos",
      localField: "watchHistory",
      foreignField: "_id",
      as: "watchHistoryVideos"
    }
  },
  {
    $unwind: "$watchHistoryVideos"
  },
  {
    $lookup: {
      from: "users",
      localField: "watchHistoryVideos.owner", 
      foreignField: "_id",
      as: "watchHistoryVideos.ownerDetails"
    }
  },
  {
    $unwind: "$watchHistoryVideos.ownerDetails"
  },
  {
    $group: {
      _id: null,
      watchHistoryVideos: { $push: "$watchHistoryVideos" }
    }
  },
  {
    $project: {
      _id: 0,
      watchHistoryVideos: 1
    }
  }
]
)
   res.status(200).json(new ApiResponse(200,{watchHistory:watHistory},"watch History fetched sucessfully"))
})

export const getVideoDetails = asyncHandler(async(req,res)=>{
   const {videoId} = req.body
   if(!videoId) throw new ApiError(402,"video id didnt recieved !!")
   const video = await Video.aggregate(
      [
         {
            $match: {
            _id:new mongoose.Types.ObjectId(videoId)
         }
         },
      {
      $lookup: {
         from: "users",
         localField: "owner",
         foreignField: "_id",
         as: "ownerDetails"
         }
      }
   ])
   if(!video) throw new ApiError(402,"video doesnt exists..")
      console.log("sucess")
   res.status(200).json(new ApiResponse(200,video,"sucess"))
})

export const isSubscribed = asyncHandler(async (req,res)=>{
   const user =req.user
   const {channelId} = req.body
    const subcribed=await Subscription.aggregate([
      {
         $match: {
            subscriber:new mongoose.Types.ObjectId(user._id),
            channel:new mongoose.Types.ObjectId(channelId)
         }
      }
      ])
      if(subcribed.length>0)return res.status(200).json(new ApiResponse(200,{isSubscribed :true},"subscribed"))
     return res.status(200).json(new ApiResponse(200,{isSubscribed :false},"not subscribed"))
})
export const subscribetoChannel = asyncHandler(async(req,res)=>{
   const user = req.user
   const {channelId} = req.body
   if(!(user && channelId))throw new ApiError(403,"user or channel didint recieved")
   const alreadySubscribed = await Subscription.aggregate([
      {
         $match: {
            subscriber:new mongoose.Types.ObjectId(user._id),
            channel:new mongoose.Types.ObjectId(channelId)
         }
      }
   ])
   if(alreadySubscribed.length>0)throw new ApiError(403,"user already exists")
   const subscription = await Subscription.create(
      {
         subscriber:user._id,
         channel:channelId
      })
   if(!subscription)throw new ApiError(501,"unablel to subscribe at this moment...")
   
   res.status(200).json(new ApiResponse(200,subscription,"sucessfully subscribed"))
})
export const unsubscribetoChannel = asyncHandler(async(req,res)=>{
   const user = req.user
   const {channelId} =req.body
   if(!(user && channelId))throw new ApiError(403,"user or channel didint recieved")
   
  const subscription= await Subscription.aggregate([
      {
         $match: {
            subscriber:new mongoose.Types.ObjectId(user._id),
            channel:new mongoose.Types.ObjectId(channelId)
         }
      }
   ])
   await Subscription.deleteOne({_id:subscription[0]._id})

   res.status(200).json(new ApiResponse(200,{},"sucessfully unssubscribed"))
})

export const getSubscriberCount = asyncHandler(async (req,res)=>{
   const {channelId} = req.body
   console.log("channel id :",channelId)
   const subscriberCount=  await User.aggregate([
      {
         $match: {
            _id:new mongoose.Types.ObjectId(channelId)
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      }
      ])
   res.status(200).json(new ApiResponse(200,{totalSubscribers:subscriberCount[0].subscribers.length},"fetched subscriber count sucessfully"))
})

export const getAllvideos=asyncHandler(async (req,res)=>{
   const videos = await Video.aggregate([
  {
    $project: {
      owner: 1,
      createdAt: 1,
      thumbnail: 1,
      __v: 1,
      description: 1,
      _id: 1,
      videoFile: 1,
      title: 1,
      views: 1,
      updatedAt: 1
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "user"
    }
  }
])
res.json(new ApiResponse(200,videos,"fetched all videos"))
})




export const likeVideo =asyncHandler(async(req,res)=>{
   const {videoId}  = req.body
   const user = req.user
   const alreadyLiked=await Like.aggregate([
      {
         $match:{
            video:new mongoose.Types.ObjectId(videoId),
            likedBy:new mongoose.Types.ObjectId(user._id)
         }
      }
   ])
   if(alreadyLiked.length>0) throw new ApiError(404,"already liked")
   await Like.create({
      video:new mongoose.Types.ObjectId(videoId),
      likedBy:new mongoose.Types.ObjectId(user._id)
    })
   
   res.json("sucess")
})
export const isLiked =asyncHandler(async (req,res)=>{
   const {videoId}  = req.body
   const user = req.user
if (!videoId) {
  throw new ApiError(400, "videoId is required");
}

   const like = await Like.findOne({
  video: new mongoose.Types.ObjectId(videoId),
  likedBy: new mongoose.Types.ObjectId(user._id)
});

   console.log("liked?",like)
     if(like)return res.status(200).json(new ApiResponse(200,{isLiked :true},"liked"))
     return res.status(200).json(new ApiResponse(200,{isLiked :false},"not liked"))
})
export const unlikeVideo =asyncHandler(async (req,res)=>{
   const {videoId}  = req.body
   const user = req.user

   const like=await Like.aggregate([
      {
         $match:{
            video:new mongoose.Types.ObjectId(videoId),
            likedBy:new mongoose.Types.ObjectId(user._id)

         }
      }
   ])
   await Like.deleteOne({_id:like[0]._id})
   res.status(200).json(new ApiResponse(200,{},"sucessfully disliked"))

})
export const totalLikes = asyncHandler(async (req,res)=>{
   const {videoId} = req.body

  const likes= await Video.aggregate([
      {
         $match: {
            _id:new mongoose.Types.ObjectId(videoId)
         }
      },
      {
         $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "totallikes"
         }
      }
      ])
      console.log("total likes : ",likes[0])
   res.status(200).json(new ApiResponse(200,{totalLikes:likes[0].totallikes},"secessfully fetched total likes"))
})
export const comment = asyncHandler(async (req,res)=>{
   const user = req.user
   const {videoId,comment} = req.body
   if(!(user && videoId))throw new ApiError(403,"user id and video id didint recived..")

   await Comment.create({
      video:videoId,
      content:comment,
      owner:user._id
   })
   res.json("sucess")
})

export const getcomments = asyncHandler(async(req,res)=>{
   const {videoId} = req.body
   console.log("video IDDDDDDD:",videoId)
   const comments =await Video.aggregate([
      {
         $match: {
            _id:new mongoose.Types.ObjectId(videoId)
         }
      },
      {
         $lookup: {
            from: "comments",
            let: { videoId: "$_id" },  
            pipeline: [
            {
               $match: {
                  $expr: {
                  $eq: ["$video", "$$videoId"]
                  }
               }
            },
            {
               $sort: { createdAt: -1 } 
            },
            {
               $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "ownerDetails"
               }
            },
            {
               $unwind: "$ownerDetails"
            },
            {
               $project: {
                  content: 1,
                  createdAt: 1,
                  "ownerDetails.username": 1,
                  "ownerDetails.avatar": 1
               }
            }
            ],
            as: "comment"
         }
      },
      {
         $project: {
            comment:1
         }
      }
      ])
   res.json(new ApiResponse(200,{Comments:comments}),"sucess")
})

