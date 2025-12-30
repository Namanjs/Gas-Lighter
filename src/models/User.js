import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        require: [true, "Password is required"]
    },
    display_name: {
        type: String,
        default : ""
    },
    avatar_url: {
        type: String, // cloudinary url
        default: "https://api.dicebear.com/7.x/pixel-art/svg"
    },
    twitter_handle: {
        type: String,
        require: true
    },
    total_battles: {
        type: Number,
        default: 0
    },
    total_wins: {
        type: Number,
        default: 0
    },
    refresh_token: {
        type: String
    }
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});


userSchema.pre("save", async function () { 
    
    if(!this.isModified("password")){
        return; 
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        display_name: this.display_name
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", userSchema);

 