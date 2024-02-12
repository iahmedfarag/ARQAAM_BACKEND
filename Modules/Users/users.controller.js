import { operationTeamModel } from "../../DB/Models/operation.team.model.js";
import { userModel } from "../../DB/Models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import { qualityTeamModel } from "../../DB/Models/quality.team.model.js";

const theMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// add user
export const addUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    let user;

    const isUserExist = await userModel.findOne({ email });

    if (isUserExist) return res.status(400).json({ messaeg: "email is duplicated" });

    if (!name | !email | !password | !role) return res.status(400).json({ message: "inputs couldn't be empty" });

    const hashedPassword = bcrypt.hashSync(password, 8);

    user = { name, email, password: hashedPassword, role };

    const createUser = await userModel.create(user);
    return res.status(200).json({ message: "User added successfuly", user: createUser });
};

// add agent to a team
export const addAgentToTeam = async (req, res) => {
    const { agentID, teamID, type } = req.body;

    if (!agentID || !teamID || !type) return res.status(400).json({ message: "inputs cannt be empty" });

    let isTeamExist;
    if (type === "operation") isTeamExist = await operationTeamModel.findById(teamID);
    if (type === "quality") isTeamExist = await qualityTeamModel.findById(teamID);

    const isAgentExist = await userModel.findById(agentID);

    if (!isTeamExist | !isAgentExist) return res.status(400).json({ message: "team | user 'not found'" });

    if (isAgentExist.role !== "agent") return res.status(400).json({ message: "agent isn't an agent" });

    if (isAgentExist.operationTeam && type === "operation") return res.status(400).json({ message: "agent is already in an operation team" });
    if (isAgentExist.qualityTeam && type === "quality") return res.status(400).json({ message: "agent is already in a quality team" });

    if (type === "operation") isAgentExist.operationTeam = teamID;
    if (type === "quality") isAgentExist.qualityTeam = teamID;

    isTeamExist.agents.push(agentID);

    await isTeamExist.save();
    await isAgentExist.save();

    return res.status(200).json({ message: "Agent Has been added successfuly to the team", isTeamExist });
};

// sign in
export const signIn = async (req, res) => {
    const { email, password } = req.body;

    const isUserExist = await userModel.findOne({ email });

    if (!isUserExist) return res.status(400).json({ message: "email | password is wrong" });

    const isPasswordCorrect = bcrypt.compareSync(password, isUserExist.password);

    if (!isPasswordCorrect) return res.status(400).json({ message: "email | password is wrong" });

    // ! check if the user in a team or not
    let isUserInTeam;
    if (isUserExist.role === "team-leader") isUserInTeam = await operationTeamModel.findOne({ leader: isUserExist._id });
    if (!isUserInTeam && isUserExist.role === "team-leader") return res.status(400).json({ message: "TL not in team" });

    if (isUserExist.role === "quality") isUserInTeam = await qualityTeamModel.findOne({ quality: isUserExist._id });
    if (!isUserInTeam && isUserExist.role === "quality") return res.status(400).json({ message: "QA not in team" });

    if (isUserExist.role === "agent") isUserInTeam = await operationTeamModel.findById(isUserExist.operationTeam);
    if (!isUserInTeam && isUserExist.role === "agent") return res.status(400).json({ message: "agent not in a team" });

    let user;
    if (isUserExist.role === "quality" || isUserExist.role === "team-leader") {
        if (isUserExist.role === "quality") {
            user = await isUserExist.populate("qualityTeam");
        }
        if (isUserExist.role === "team-leader") {
            user = await isUserExist.populate("operationTeam");
        }
    } else {
        user = isUserExist;
    }

    // ! saving the token
    const userToken = { id: user._id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(userToken, process.env.JWT_SECURITY_WORD, { expiresIn: "24h" });

    return res.status(200).json({ message: "Signed IN Successfully", token });
};

// get user
export const getUser = async (req, res) => {
    const { id } = req.params;
    const user = await userModel.findById(id);

    res.json({ message: "get user", user });
};

// get team memebers
export const getTeamMembers = async (req, res) => {
    const { team } = req;
    const teamMembers = await team.populate({ path: "agents", select: "name email" });

    return res.status(200).json({ message: "team members", teamMembers: teamMembers.agents });
};

// get agent monthly numbers
export const getAgentMonthlyNumbers = async (req, res) => {
    const { user } = req;
    const { date } = req.params;

    const findYear = user.performance.find((y) => y.year === dayjs(date).year());
    const numbers = findYear.months.find((m) => m.month === theMonths[dayjs(date).month()]);

    if (!numbers) return res.status(400).json({ message: "not updated yet" });

    function compare(a, b) {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    }
    numbers.performance.sort(compare);

    return res.status(200).json({ message: "agent monthly numbers", numbers: numbers });
};

// ! evaluations sction //

// do evaluate
export const doEvaluate = async (req, res) => {
    const { user } = req;
    const { data } = req.body;

    const theAgent = await userModel.findById(data.agent);

    // make sure that the quality | leaders has the agent in their team
    if (user.role === "quality" && theAgent.qualityTeam.toString() !== user.qualityTeam.toString()) return res.status(400).json({ message: "not authorized to mentor this agent" });
    if (user.role === "team-leader" && theAgent.operationTeam.toString() !== user.operationTeam.toString()) return res.status(400).json({ message: "not authorized to mentor this agent" });

    // get user team
    let team;
    if (user.role === "quality") team = await qualityTeamModel.findById(user.qualityTeam);
    if (user.role === "team-leader") team = await operationTeamModel.findById(user.operationTeam);

    let isYearExist = team.evaluations.find((y) => y.year === dayjs().year());

    if (!isYearExist) {
        team.evaluations.push({ year: dayjs().year(), months: [{ month: theMonths[dayjs().month()], evaluations: [] }] });
        isYearExist = team.evaluations.find((y) => y.year === dayjs().year());
    }

    let findMonth = isYearExist.months.find((m) => m.month === theMonths[dayjs().month()]);

    if (!findMonth) {
        isYearExist.months.push({ month: theMonths[dayjs().month()], evaluations: [] });
        findMonth = isYearExist.months.find((m) => m.month === theMonths[dayjs().month()]);
    }

    const eva = {
        date: dayjs().date(),
        from: user._id,
        to: theAgent._id,
        details: {
            ticket: data.ticket,
            ticketType: data.type,
            conversationFlow: data.conversationFlow,
            softSkills: data.softSkills,
            calrityOfCommunication: data.calrityOfCommunication,
            ownership: data.ownership,
            solution: data.solution,
            proceduresAndTools: data.proceduresAndTools,
            understanding: data.understanding,
            behaviourWithCustomer: data.behaviourWithCustomer,
            wrongInformation: data.wrongInformation,
            dataCompliance: data.dataCompliance,
            denigrates: data.denigrates,

            comment: data.comment,
            score: data.score,
        },
    };

    findMonth.evaluations.push(eva);

    await team.save();

    return res.status(200).json({ message: "evaulation has done successfuly" });
};

// get evaluations for user
export const getUserEvaluations = async (req, res) => {
    const { user } = req;
    const { date } = req.params;
    let yearIndex;
    let monthIndex;

    // get user team
    let team;
    if (user.role === "quality") team = await qualityTeamModel.findById(user.qualityTeam).populate({ path: "agents", select: "email name" });
    else if (user.role === "team-leader") team = await operationTeamModel.findById(user.operationTeam).populate({ path: "agents", select: "email name" });
    else if (user.role === "agent") team = await qualityTeamModel.findById(user.qualityTeam).populate({ path: "agents", select: "email name" });

    // get year index // to use it while populating (because the maodel has nesting objs)
    const findYear = team?.evaluations?.find((y, i) => {
        if (y.year === dayjs(date).year()) {
            yearIndex = i;
            return y.year === dayjs(date).year();
        }
    });

    //  get month index // to use it while populating (because the maodel has nesting objs)
    const monthNumbers = findYear?.months?.find((m, i) => {
        if (m.month === theMonths[dayjs(date).month()]) {
            monthIndex = i;
            return theMonths[dayjs(date).month()];
        }
    });

    if (!monthNumbers) return res.status(200).json({ message: "not updated yet" });

    // to get evaluation (to)
    const teamPopulated = await team.populate({ path: `evaluations.${yearIndex}.months.${monthIndex}.evaluations.to`, select: "email name" });

    // get the monthly team nubmers
    const theYear = teamPopulated?.evaluations?.find((y) => y.year === dayjs(date).year());
    const theMonthNumbers = theYear?.months?.find((m) => m.month === theMonths[dayjs(date).month()]);
    const teamNumbers = theMonthNumbers?.evaluations;

    if (!teamNumbers) return res.status(200).json({ message: "not updated yet" });

    function compare(a, b) {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    }
    teamNumbers.sort(compare);

    let agentNumbers;
    if (user.role === "agent") {
        agentNumbers = teamNumbers.filter((num) => {
            return num.to._id.toString() === user._id.toString();
        });
    }

    res.status(200).json({ message: "get evaluations for user", evaluations: user.role === "agent" ? agentNumbers : teamNumbers });
};

// get agent evaluations -> that evaluated from the team-leader
export const getAgentOperationEvaluations = async (req, res) => {
    const { user } = req;
    const { date } = req.params;
    let yearIndex;
    let monthIndex;

    // get user team
    let team = await operationTeamModel.findById(user.operationTeam).populate({ path: "agents", select: "email name" });

    // get year index
    const findYear = team?.evaluations?.find((y, i) => {
        if (y.year === dayjs(date).year()) {
            yearIndex = i;
            return y.year === dayjs(date).year();
        }
    });

    //  get month index // to use them while populating on (to)
    const monthNumbers = findYear?.months?.find((m, i) => {
        if (m.month === theMonths[dayjs(date).month()]) {
            monthIndex = i;
            return theMonths[dayjs(date).month()];
        }
    });

    if (!monthNumbers) return res.status(200).json({ message: "not updated yet" });

    // to get evaluation (to)

    const teamPopulated = await team.populate({ path: `evaluations.${yearIndex}.months.${monthIndex}.evaluations.to`, select: "email name" });

    // get the monthly team nubmers
    const theYear = teamPopulated?.evaluations?.find((y) => y.year === dayjs(date).year());
    const theMonthNumbers = theYear?.months?.find((m) => m.month === theMonths[dayjs(date).month()]);
    const teamNumbers = theMonthNumbers?.evaluations; //! ! ! !!!!!

    if (!teamNumbers) return res.status(200).json({ message: "not updated yet" });
    function compare(a, b) {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    }
    teamNumbers.sort(compare);

    let agentNumbers;
    if (user.role === "agent") {
        agentNumbers = teamNumbers.filter((num) => {
            return num.to._id.toString() === user._id.toString();
        });
    }
    res.status(200).json({ message: "get evaluations for user", evaluations: agentNumbers });
};

// get single evaluation
export const getSingleEvaluate = async (req, res) => {
    const { team } = req;
    const { id: ticketID, date } = req.params;

    const findYear = Number(date.split("-")[1]);
    const findMonth = theMonths[Number(date.split("-")[0] - 1)];

    const theYear = team?.evaluations?.find((y, i) => {
        yearIndex = i;
        return y.year === findYear;
    });

    const theMonth = theYear?.months.find((m, i) => {
        monthIndex = i;
        return m.month === findMonth;
    });

    const theTicket = theMonth?.evaluations.find((e) => e._id.toString() === ticketID);

    return res.status(200).json({ message: "single evaluation", ticket: theTicket });
};

// update evaluation
export const updateEvaluation = async (req, res) => {
    const { team } = req;
    const { id: ticketID, date } = req.params;
    const ticket = req.body;

    const findYear = Number(date.split("-")[1]);
    const findMonth = theMonths[Number(date.split("-")[0] - 1)];

    const theYear = team?.evaluations?.find((y, i) => {
        yearIndex = i;
        return y.year === findYear;
    });

    const theMonth = theYear?.months.find((m, i) => {
        monthIndex = i;
        return m.month === findMonth;
    });

    const theTicket = theMonth?.evaluations.find((e) => e._id.toString() === ticketID);

    const newTicket = {
        date: theTicket.date,
        from: theTicket.from,
        to: theTicket.to,
        _id: theTicket._id,
        details: {
            ticket: ticket.ticket,
            ticketType: ticket.type,
            conversationFlow: ticket.conversationFlow,
            softSkills: ticket.softSkills,
            calrityOfCommunication: ticket.calrityOfCommunication,
            ownership: ticket.ownership,
            solution: ticket.solution,
            proceduresAndTools: ticket.proceduresAndTools,
            understanding: ticket.understanding,
            behaviourWithCustomer: ticket.behaviourWithCustomer,
            wrongInformation: ticket.wrongInformation,
            dataCompliance: ticket.dataCompliance,
            denigrates: ticket.denigrates,
            comment: ticket.comment,
            score: ticket.score,
        },
    };

    theTicket.deleteOne();
    theMonth.evaluations.push(newTicket);
    await team.save();

    return res.status(200).json({ message: "update evaluation" });
};
