import {asyncHandler} from '../utils/asynchandler.js'
import {ApiError} from '../utils/apiError.js'
import {ApiResponse} from "../utils/apiResponse.js"
import { User } from '../models/user.model.js'
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js'
import jwt from 'jsonwebtoken'
import { Video } from '../models/video.model.js'
import mongoose from 'mongoose'
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
   console.log(user)
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