import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema =new  mongoose.Schema(
    {
        videoFile:{
            type:String,
            require : true
        },
        thumbnail:{
            type:String,
            require : true
        },
        title:{
            type:String,
            require : true
        },
        description:{
            type:String,
            require : true
        },
        duraton:{
            type:Number
        },
         views:{
            type:Number
        },
        owner:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    }   
    ,{timestamps:true})
videoSchema.plugin(aggregatePaginate)
export const Video = mongoose.model("Video",videoSchema)


