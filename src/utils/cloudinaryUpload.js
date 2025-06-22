import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_APIKEY, 
  api_secret: process.env.CLOUD_APIKEY_SECRET
});

export const uploadToCloudinary = async(loacalFilePath)=>{
    if(!loacalFilePath)return
    try{
        const response = await cloudinary.uploader.upload(loacalFilePath,
            {
                resource_type: 'auto'
            }
        )
        console.log(response)
        fs.unlinkSync(loacalFilePath)
        return response.url
    }
    catch(err)
    {
        console.log(err)
        console.log("failed while uploading t cloudinary...")
        fs.unlinkSync(loacalFilePath)
    }
}