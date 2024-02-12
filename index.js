import { config } from "dotenv";
config();
import express from "express";
import usersRouter from "./Modules/Users/users.routes.js";
import { connectionDB } from "./DB/Connection.js";
import operationTeamRouter from "./Modules/operationTeam/operation.team.routes.js";
import qualityTeamRouter from "./Modules/qualityTeam/quality.team.routes.js";
const app = express();

import cors from "cors";

app.use(express.json());

connectionDB();

app.use(cors());
app.get("/", (req, res) => {
    res.send("<h1>hello hello</h1>");
});

app.use("/user", usersRouter);
app.use("/team/operation", operationTeamRouter);
app.use("/team/quality", qualityTeamRouter);

app.listen(3000, () => {
    console.log("server is listening on port 3000");
});
