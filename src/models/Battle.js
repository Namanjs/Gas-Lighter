import mongoose, { Schema } from "mongoose";

const turnSchema = new Schema({
    player: { 
        type: Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    },
    move_type: { 
        type: String, 
        enum: ["ATTACK", "SKIP", "SURRENDER"],
        required: true 
    },
    insult_text: { 
        type: String, 
        trim: true 
    },
    points_scored: { 
        type: Number, 
        default: 0 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
}, { _id: false });

const battleSchema = new Schema({
    player_one: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    player_two: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null 
    },
    
    invite_code: {
        type: String,
        unique: true, 
        sparse: true 
    },
    status: {
        type: String,
        enum: ["WAITING", "ACTIVE", "COMPLETED", "ABANDONED"],
        default: "WAITING"
    },
    turn_player: {
        type: Schema.Types.ObjectId, 
        ref: "User",
        default: null 
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null 
    },

    player_one_health: { type: Number, default: 100 },
    player_two_health: { type: Number, default: 100 },

    rounds: [turnSchema] 
}, { 
    timestamps: true 
});

export const Battle = mongoose.model("Battle", battleSchema);
