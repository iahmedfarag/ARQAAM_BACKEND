import express from "express";
import { asyncHandler } from "../../utils/errorHandling.js";
import { isAuth } from "../../middlewares/auth.js";
import { createTeam, getTeam } from "./quality.team.controller.js";

const qualityTeamRouter = express.Router();

// Operation Team
qualityTeamRouter.post("/createTeam", asyncHandler(createTeam));
qualityTeamRouter.get("/:id", asyncHandler(getTeam));

export default qualityTeamRouter;
