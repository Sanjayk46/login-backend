import mongoose from "mongoose";

const dbConnection = async ()=>{
    try{
        const connection = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB connected successfully: Host - ${connection.connection.host}, Database - ${connection.connection.db.databaseName}`)

    }catch(error){
        console.log(`MongoDb connection error:${error.message}`)
    }
}
export default dbConnection;