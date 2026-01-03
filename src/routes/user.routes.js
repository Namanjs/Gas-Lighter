import { Router } from "express";
import { changeCurrentPassword, getCurrentUser,getUserChannelProfile, loginUser, logoutUser, registerUser, toggleFollow, updateAccountDetails, updateAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),

    registerUser
);

router.route("/login").post(loginUser)

router.route("/logout").post(VerifyJwt, logoutUser);

router.route("/currentUser").get(VerifyJwt, getCurrentUser);

router.route("/changePassword").post(VerifyJwt, changeCurrentPassword);

router.route("/update-account").patch(VerifyJwt, updateAccountDetails);

router.route("/update-avatar").patch(VerifyJwt, upload.single("avatar"), updateAvatar);

router.route("/get-channel-profile/:username").get(VerifyJwt, getUserChannelProfile);

router.route("/follow/:channelId").post(VerifyJwt, toggleFollow);

export default router;