import { Schema, model } from "mongoose";
import { details, numbers } from "./commonSchema.js";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ["agent", "team-leader", "quality"],
            required: true,
        },
        operationTeam: {
            type: Schema.Types.ObjectId,
            ref: "operationTeam",
        },
        qualityTeam: {
            type: Schema.Types.ObjectId,
            ref: "qualityTeam",
        },

        performance: [
            {
                year: Number,
                months: [
                    {
                        month: String,
                        performance: [
                            {
                                date: Number,
                                ...numbers,
                            },
                        ],
                    },
                ],
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

export const userModel = model("User", userSchema);
