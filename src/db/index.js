import mongoose from  'mongoose'

export const connetDB =async ()=>{
    try
    {
        const dbInstance = await mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`)
        console.log("host id:", dbInstance.connection.host)
    }catch(err)
    {
        console.error("unable to connect eith database")
        console.log(err)
    }
}