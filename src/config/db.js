const mongoose = require("mongoose");

const ConnectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log(`\nMongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection failed: ", error);
        process.exit(1); //Wrong DB Password, No Internet.
    }
}

module.exports = ConnectDB;