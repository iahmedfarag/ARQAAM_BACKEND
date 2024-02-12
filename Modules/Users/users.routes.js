import express from "express";
import { addAgentToTeam, addUser, doEvaluate, getAgentMonthlyNumbers, getUserEvaluations, getUser, signIn, getTeamMembers, getSingleEvaluate, updateEvaluation, getAgentOperationEvaluations } from "./users.controller.js";
import { asyncHandler } from "../../utils/errorHandling.js";
import { isAuth } from "../../middlewares/auth.js";

const usersRouter = express.Router();

// add user
usersRouter.post("/", asyncHandler(addUser));
// add agent to a team
usersRouter.post("/addAgentToTeam", asyncHandler(addAgentToTeam));
// sign-in
usersRouter.post("/signIn", asyncHandler(signIn));
// get monthly numbers for user
usersRouter.get("/getAgentMonthlyNumbers/:date", isAuth(), asyncHandler(getAgentMonthlyNumbers));
// DO evaluate
usersRouter.post("/doEvaluate", isAuth(), asyncHandler(doEvaluate));
// get user
usersRouter.get("/getUser/:id", asyncHandler(getUser));
// get user evaluations
usersRouter.get("/getUserEvaluations/:date", isAuth(), asyncHandler(getUserEvaluations));
// get agent operations evaluations
usersRouter.get("/getAgentOperationEvaluations/:date", isAuth(), asyncHandler(getAgentOperationEvaluations));
// get team members
usersRouter.get("/getTeamMembers", isAuth(), asyncHandler(getTeamMembers));
// get single evaluate
usersRouter.get("/getSingleEvaluate/:id/:date", isAuth(), asyncHandler(getSingleEvaluate));
// get team memebers
usersRouter.get("/getTeamMembers", isAuth(), asyncHandler(getTeamMembers));
// get single evaluate
usersRouter.patch("/updateSingleEvaluation/:id/:date", isAuth(), asyncHandler(updateEvaluation));

export default usersRouter;
