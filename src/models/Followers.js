import mongoose, { Schema } from "mongoose";

const followSchema = new Schema({
    follower: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.model("Follow", followSchema);