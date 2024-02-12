import { qualityTeamModel } from "../../DB/Models/quality.team.model.js";
import { userModel } from "../../DB/Models/user.model.js";

// quality team functions
export const createTeam = async (req, res) => {
    const { quality } = req.body;

    if (!quality) return res.status(400).json({ message: "choose a quality" });

    const theQuality = await userModel.findById(quality);

    if (!theQuality) return res.status(400).json({ message: "quality not found" });

    if (theQuality.role !== "quality") return res.status(400).json({ message: "the quality isn't a quality" });

    const isTheQualityHasTeam = await qualityTeamModel.findOne({ quality: theQuality._id });

    if (isTheQualityHasTeam) return res.status(400).json({ message: "has a team already" });

    const teamTemp = {
        quality,
        agents: [],
        years: [],
    };

    const team = await qualityTeamModel.create(teamTemp);
    if (team) theQuality.qualityTeam = team._id;

    theQuality.save();
    return res.status(200).json({ message: "Quality Team has been added successfuly", team });
};

// get Q team
export const getTeam = async (req, res) => {
    const { id } = req.params;

    const team = await qualityTeamModel.findById(id);

    return res.status(200).json({ message: "quality team", team });
};
