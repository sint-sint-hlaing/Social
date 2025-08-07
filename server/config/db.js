import mongoose, { mongo } from "mongoose";

 const connectDB = async () => {
    try{
        mongoose.connection.on('connected',()=>console.log('Database connected'))
        await mongoose.connect(`${process.env.MONOGODB_URL}/knowledgehive`)
    }catch (error){
        console.log(error.message)
    }
 }

export default connectDB