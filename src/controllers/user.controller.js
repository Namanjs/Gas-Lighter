import { User } from "../models/User.js"

const registerUser = async(req, res) => {
    try {
        const { username, email, password, display_name, twitter_handle } = req.body;

        const required_fields = [username, email, password, twitter_handle];

        const is_any_field_empty = required_fields.some((field) => !field || field.trim() === "");

        if(is_any_field_empty){
            return res.status(400).json({
                message: "Username, Email, Password, and Twitter Handle are required"
            });
        }

        const existed_user = await User.findOne({
            $or: [{username}, {email}]
        })

        if(existed_user){
            return res.status(409).json({
                message: "User already with same email or username already exist"
            });
        }

        const avatar_path = req.files?.avatar?.[0]?.path;

        // code to upload the avatar path to cloudinary and checking if the upload was successfull(platform i will use)

        const user = await User.create({
            display_name: display_name || username, 
            avatar: avatar_path,
            email,
            password,
            username: username.toLowerCase(),
            twitter_handle
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refresh_token"
        );

        if(!createdUser){
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