
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        video:{
            type:new mongoose.Schema.Types.ObjectId,
            ref:"Video"
        },
        likedBy:{
            type:new mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    }
    ,{timestamps:true})

export const Like = mongoose.model("Like",likeSchema)