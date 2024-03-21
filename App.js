import express from 'express'
import { config} from 'dotenv'
import courseRoute from './Routes/courseRoutes.js'
import userRoute from './Routes/userRoutes.js'
import otherRoutes from './Routes/otherRoutes.js'
import paymentRoute from './Routes/paymentRoutes.js'
import bp from 'body-parser'
import ErrorMiddleware from './Middlewares/Error.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'


config({path:'./config/config.env'})

const app=express()

app.use(bp.json())
app.use(bp.urlencoded({extended:false}))
app.use(cookieParser())
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
    methods:["GET","POST","DELETE","PUT"]
}))

app.use('/api/v1',courseRoute)
app.use('/api/v1',userRoute)
app.use('/api/v1',paymentRoute)
app.use('/api/v1',otherRoutes)

export default app

app.get('/',(req,res)=>
    res.send(`<h1>Site is working. Click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend</h1>`)
)

app.use(ErrorMiddleware)