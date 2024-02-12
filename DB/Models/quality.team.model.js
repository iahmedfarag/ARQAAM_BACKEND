import { Schema, model } from "mongoose";
import { details } from "./commonSchema.js";

const qualityTeamSchema = new Schema(
    {
        quality: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },

        agents: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        evaluations: [
            {
                year: Number,
                months: [
                    {
                        month: String,
                        evaluations: [
                            {
                                date: Number,
                                from: {
                                    type: Schema.Types.ObjectId,
                                    ref: "User",
                                },
                                to: {
                                    type: Schema.Types.ObjectId,
                                    ref: "User",
                                },
                                details: details,
                            },
                        ],
                    },
                ],
            },
        ],
    },

    { timestamps: true }
);

export const qualityTeamModel = model("qualityTeam", qualityTeamSchema);
