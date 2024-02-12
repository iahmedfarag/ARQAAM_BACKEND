import express from "express"
import { createTeam, addNumbersToTeam, getTeamNumbersPerDay, getTeamNumbersPerMonth } from "./operation.team.controller.js"
import { asyncHandler } from "../../utils/errorHandling.js"
import { isAuth } from "../../middlewares/auth.js"

const operationTeamRouter = express.Router()

// Operation Team
operationTeamRouter.post('/createTeam', asyncHandler(createTeam))
operationTeamRouter.post('/addNumbersToTeam', isAuth(), asyncHandler(addNumbersToTeam))
operationTeamRouter.get('/getTeamNumbersPerDay/:date', isAuth(), asyncHandler(getTeamNumbersPerDay))
operationTeamRouter.get('/getTeamNumbersPerMonth/:date', isAuth(), asyncHandler(getTeamNumbersPerMonth))



export default operationTeamRouter