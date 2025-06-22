import dotenv from 'dotenv'
dotenv.config()

const {app} =await import ('./app.js')
const {connetDB} = await import('../src/db/index.js')
const port = process.env.PORT || 7000

connetDB().then(()=>{
    app.on("error",()=>{
        console.log("unable to listen on server...")
    })
    app.listen(port,()=>{
        console.log(`server listening at port : ${port}`)
    })
}).catch(()=>{
        console.log("unable to ocnnect to database or server issue ..")

})

