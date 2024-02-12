import { Schema, model } from "mongoose";
import { details, numbers } from "./commonSchema.js";

const operationTeamSchema = new Schema(
    {
        leader: {
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

        performance: [
            {
                year: Number,
                months: [
                    {
                        month: String,
                        performance: [
                            {
                                date: Number,
                                total: numbers,

                                performance: [
                                    {
                                        agent: String,
                                        ...numbers,
                                    },
                                ],

                                theTops: {
                                    CSAT: {
                                        agent: String,
                                        CSAT: Number,
                                    },
                                    KCSAT: {
                                        agent: String,
                                        KCSAT: Number,
                                    },
                                    PMTD: {
                                        agent: String,
                                        PMTD: Number,
                                    },
                                },
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

export const operationTeamModel = model("operationTeam", operationTeamSchema);
