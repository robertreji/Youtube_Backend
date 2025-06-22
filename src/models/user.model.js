import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

const userSchema =new  mongoose.Schema(
    {
        username:{
            type:String,
            require:true,
            unique:true,
            lowercase:true
        },

        avatar:{
            type:String
        },
        coverImage:{
            type:String
        },
        password :{
            type:String,
            require:true
        },
        refreshToken:{
            type:String
        },
        watchHistory:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }]
    }
    ,{timestamps:true})

userSchema.pre("save",async function(){
    if(!this.isModified("password")) return 
 this.password=await bcryptjs.hash(this.password,10)
})

 userSchema.methods.isPasswordCorrect=async function(password){
     return  await bcryptjs.compare(password,this.password)
 }
 userSchema.methods.generateAccessToken= function(){
  return  jwt.sign(
        {
            _id:this._id,
            username :this.username
        },
        process.env.ACESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACESS_TOKEN_EXPIRY
        }
    )
 }
 userSchema.methods.generateRefreshToken= function(){
  return  jwt.sign(
        {
            _id:this._id,
            username :this.username
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
 }

export const User = mongoose.model("User",userSchema)