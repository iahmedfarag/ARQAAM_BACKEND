import jwt from "jsonwebtoken";
import { userModel } from "../DB/Models/user.model.js";
import { operationTeamModel } from "../DB/Models/operation.team.model.js";
import { qualityTeamModel } from "../DB/Models/quality.team.model.js";

export const isAuth = () => {
    return async (req, res, next) => {
        const { authorization } = req.headers;

        if (!authorization) return res.status(400).json({ message: "login please" });

        try {
            const decodedToken = jwt.verify(JSON.parse(authorization), process.env.JWT_SECURITY_WORD);

            if (!decodedToken) return res.status(400).json({ message: "invalid token" });

            const findUser = await userModel.findById(decodedToken.id);
            if (!findUser) return res.status(400).json({ message: "user not found" });

            let findTeam;

            if (findUser.role === "team-leader") findTeam = await operationTeamModel.findById(findUser.operationTeam);
            else if (findUser.role === "quality") findTeam = await qualityTeamModel.findById(findUser.qualityTeam);
            else if (findUser.role === "agent") findTeam = await operationTeamModel.findById(findUser.operationTeam);

            req.user = findUser;
            req.team = findTeam;

            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({ message: "expired token" });
            }
            return res.status(500).json({ message: error });
        }
    };
};
