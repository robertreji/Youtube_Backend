import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        video:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        },
        content :{
            type:String,
            require:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    }
    ,{timestamps:true})

export const Comment =  mongoose.model("Comment",commentSchema)