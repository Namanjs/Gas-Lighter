import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, registerUser, updateAccountDetails } from "../controllers/user.controller.js";
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

export default router;