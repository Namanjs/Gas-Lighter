require('dotenv').config();
const ConnectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

ConnectDB()
    .then(() => {
        app.on("error", (error) => {
            console.error("EXPRESS APP ERROR: ", error);
            throw error; //Port 5000 is busy, Server crash.
        }); 

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })
    })
    .catch((error) => {
        console.log("MongoDB Connection Failed !!!", error); //Backup for db.js.
    })

