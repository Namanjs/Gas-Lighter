import { User } from "../models/User.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = async (req, res) => {
    try {
        const { username, email, password, display_name, twitter_handle } = req.body;

        const required_fields = [username, email, password, twitter_handle];

        const is_any_field_empty = required_fields.some((field) => !field || field.trim() === "");

        if (is_any_field_empty) {
            return res.status(400).json({
                message: "Username, Email, Password, and Twitter Handle are required"
            });
        }

        const existed_user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existed_user) {
            return res.status(409).json({
                message: "User already with same email or username already exist"
            });
        }

        const avatar_path = req.files?.avatar?.[0]?.path;
        let avatar; 

        
        if (avatar_path) {
            avatar = await uploadOnCloudinary(avatar_path);

            
            if (!avatar) {
                return res.status(400).json({
                    message: "Error uploading avatar image"
                });
            }
        }

        const user = await User.create({
            display_name: display_name || username,
            avatar: avatar?.url,
            email,
            password,
            username: username.toLowerCase(),
            twitter_handle
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refresh_token"
        );

        if (!createdUser) {
            return res.status(500).json({
                message: "Something went wrong while registering the user"
            })
        };

        return res.status(201).json({
            status: 201,
            data: createdUser,
            message: "User registered successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong while registering user"
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, username, password } = req.body;
    
        if(!(email || username || password)){
            return res.status(400).json({
                message: "All fields are required"
            })
        }
    
        const user = await User.findOne({
            $or: [{username}, {email}]
        })
    
        if(!user){
            return res.status(401).json({
                message: "User with email and username does not exist"
            })
        }
    
        const isPasswordValid = await user.isPasswordCorrect(password);
    
        if(!isPasswordValid){
            return res.status(400).json({
                message: "Invalid password"
            })
        }
    
        const accessToken = user.generateAccessToken();

        if(!accessToken){
            return res.status(500).json({
                message: "Something went wrong while generating access token"
            })
        }

        const refreshToken = user.generateRefreshToken();
    } catch (error) {
        
    }
}

export {
    registerUser,
    loginUser
}