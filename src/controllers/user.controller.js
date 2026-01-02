import { Follow } from "../models/Followers.js";
import { User } from "../models/User.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

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
            avatar_url: avatar?.url,
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

        if ((!username && !email) || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!user) {
            return res.status(401).json({
                message: "User with email and username does not exist"
            })
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid password"
            })
        }

        const accessToken = user.generateAccessToken();

        if (!accessToken) {
            return res.status(500).json({
                message: "Something went wrong while generating access token"
            })
        }

        const refreshToken = user.generateRefreshToken();

        if (!refreshToken) {
            return res.status(500).json({
                message: "Something went wrong while generating refresh token"
            })
        }

        user.refresh_token = refreshToken;

        await user.save({
            validateBeforeSave: false
        })

        const loggedInUser = await User.findById(user._id).select("-password -refresh_token");

        const options = {
            httpOnly: true,
            secure: true // will work in testing but might fail while connecting to frontend
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                status: 200,
                data: {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                message: "User successfully logged in"
            })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong while logging in user"
        })
    }
}

const logoutUser = async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refresh_token: undefined
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true // might give trouble in production
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({
            status: 200,
            message: "User logout successfully"
        })
}

const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        status: 200,
        user: req.user,
        message: "User fetched successfully"
    })
}

const changeCurrentPassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        // no need to check for user as middleware make sure user is logged in i.e exist in database

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password"
            })
        }

        user.password = newPassword;

        await user.save();

        return res.status(200).json({
            message: "Password changed successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while updating password"
        })
    }
}

const updateAccountDetails = async (req, res) => {
    try {
        const { newDisplayname, newEmail, newUsername, newTwitterhandle } = req.body;

        const updates = {};

        if (newDisplayname) updates.display_name = newDisplayname;
        if (newEmail) updates.email = newEmail;
        if (newUsername) updates.username = newUsername;
        if (newTwitterhandle) updates.twitter_handle = newTwitterhandle;

        // SUGGESTION 1: Stop if there is nothing to update
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No fields provided to update"
            });
        }

        // SUGGESTION 2: One DB call instead of two
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: updates
            },
            {
                new: true // Return the new document
            }
        ).select("-password -refresh_token"); // Chain the select here!

        // SUGGESTION 3: Use 200 for updates
        return res.status(200).json({
            status: 200,
            updatedUser: user, // Standard camelCase key
            message: "Details successfully updated"
        })

    } catch (error) {
        // BONUS: specific error for Duplicate Email/Username
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email or Username already exists" });
        }

        console.log(error);
        return res.status(500).json({
            message: "Something went wrong while updating user details"
        })
    }
}

const updateAvatar = async (req, res) => {
    try {
        const newAvatarLocalPath = req.file?.path;

        if (!newAvatarLocalPath) {
            return res.status(400).json({
                message: "New avatar path is required for updation"
            })
        }

        const avatarResponse = await uploadOnCloudinary(newAvatarLocalPath);

        if (!avatarResponse.url) {
            return res.status(500).json({
                message: "Error while uploading avatar"
            })
        }

        // --- CORRECTION HERE ---
        // We use .avatar_url because you confirmed that is the Schema name
        const oldAvatarUrl = req.user.avatar_url;

        if (oldAvatarUrl) {
            const publicId = oldAvatarUrl.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar_url: avatarResponse.url // Matches Schema
                }
            },
            {
                new: true
            }
        ).select("-password -refresh_token")

        return res.status(200).json({
            status: 200,
            User: user,
            message: "Avatar updated successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong while updating avatar"
        })
    }
}

const getUserChannelProfile = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username?.trim()) {
            return res.status(400).json({
                message: "Username is required"
            })
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username: username.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "follows",
                    localField: "_id",
                    foreignField: "following",// finding all the follow documents where our user id is in following, i.e no of followers
                    as: "followersList"
                }
            },
            {
                $lookup: {
                    from: "follows",
                    localField: "_id",
                    foreignField: "follower",// finding all the follow document where our user id is in followes showing whom all he follows
                    as: "followingList"
                }
            },
            {
                $addFields: {
                    followersCount: { $size: "$followersList" },
                    followingCount: { $size: "$followingList" },
                    isFollowed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$followersList.follower"] },
                            then: true,
                            else: false
                        }
                    },
                    isFollower: {
                        $cond: {
                            if: { $in: [req.user?._id, "$followingList.following"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    display_name: 1,
                    username: 1,
                    twitter_handle: 1,
                    followersCount: 1,
                    followingCount: 1,
                    isFollowed: 1,
                    isFollower: 1,
                    avatar_url: 1, // or avatar_url
                    email: 1
                }
            }
        ]);

        if (!channel?.length) {
            return res.status(404).json({
                message: "User channel does not exist"
            });
        }

        return res.status(200).json({
            status: 200,
            data: channel[0],
            message: "User profile fetched successfully"
        });
    } catch (error) {
        console.error("Error fetching channel profile:", error);
        return res.status(500).json({
            message: "Something went wrong while fetching the profile",
            error: error.message
        });
    }
}

const toggleFollow = async (req, res) => {
    // follow successfully created now unfollow functionality
    try {
        const { channelId } = req.params;
        const user = req.user;
    
        if(!channelId){
            return res.status(400).json({
                message: "Channel Id is required"
            })
        }
    
        const toBeFollowed = await User.findOne({_id: channelId});
    
        if(!toBeFollowed){
            return res.status(404).json({
                message: "Channel not found"
            })
        }
    
        if(channelId === user._id){
            return res.status(401).json({
                message: "You can't follow yourself"
            })
        }
    
        const followDocument = await Follow.create({
            follower: user._id,
            following: channelId
        });
    
        const createdFollowDocument = await Follow.findById(followDocument._id);
    
        if(!createdFollowDocument){
            return res.status(500).json({
                message: "Something went wrong while creating the follow document"
            })
        }
    
        return res.status(201).json({
            status: 201,
            Follow_Document: createdFollowDocument,
            message: "User successfully followed the channel"
        })
    } catch (error) {
        console.log("Error while following", error);
        return res.status(500).json({
            message: "Something went wrong while following the channel"
        })
    }
}

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatar,
    getUserChannelProfile,
    toggleFollow
}