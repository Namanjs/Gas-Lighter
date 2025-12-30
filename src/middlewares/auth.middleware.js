import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const VerifyJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            return res.status(401).json({
                message: "Access Token is required"
            })
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodeToken?._id).select("-password -refresh_token");

        if(!user){
            return res.status(401).json({
                message: "Invalid access token"
            })
        }

        req.user = user;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(500).json({
            message: "Something went wrong while verifying token"
        })
    }
}

export { VerifyJwt }