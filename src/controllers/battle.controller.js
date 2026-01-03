import crypto from 'crypto';
import { Battle } from "../models/Battle.js";
import mongoose from 'mongoose';
import { stat } from 'fs';

const createBattle = async (req, res) => {
    try {
        const user = req.user;

        const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const createdBattle = await Battle.create({
            player_one: user._id,
            player_two: null, 
            invite_code: inviteCode
        });

        return res.status(201).json({
            status: 201,
            room: createdBattle, 
            message: "Room successfully created. Share the invite code!"
        });

    } catch (error) {
        console.log("Error while creating room for battle", error);
        return res.status(500).json({
            message: "Something went wrong while creating a room"
        });
    }
}

const joinBattle = async (req, res) => {
    try {
        const code = req.body;
        const user_2 = req.user;

        const room = await Battle.findByIdAndUpdate(
            {
                invite_code: code,
                player_two: null,
            },
            {
                $set: {
                    player_two: user_2._id,
                    status: "Active"
                }
            },
            {
                new: true
            }
        )

        if(!room){
            return res.status(401).json({
                message: "Room doesn't exist"
            })
        }

        return res.status(200).json({
            status: 200,
            room: room,
            message: "Successfully joined the room"
        })
    } catch (error) {
       console.log("Error while joining the room", error);
       return res.status(500).json({
        message: "Something went wrong while joining the room"
       }) 
    }
}

export{
    createBattle,
    joinBattle
}