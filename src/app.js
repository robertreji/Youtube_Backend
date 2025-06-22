import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'
import { ErrorHandler } from "./middlewares/ErrorHandler.middleware.js";

const app = express()

app.use(cors({
    origin : "http://localhost:5173",
    credentials:true
}))
app.use(express.json())
app.use(express.urlencoded())
app.use(cookieParser())

import userRouter from "./routes/user.route.js"

app.use("/api/v1/user",userRouter)
app.use(ErrorHandler);

export {app}