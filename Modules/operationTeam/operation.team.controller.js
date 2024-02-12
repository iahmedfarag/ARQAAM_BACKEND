import dayjs from "dayjs";
import { operationTeamModel } from "../../DB/Models/operation.team.model.js";
import { userModel } from "../../DB/Models/user.model.js";

const theMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const createTeam = async (req, res) => {
    const { leader } = req.body;

    if (!leader) return res.status(400).json({ message: "choose a team-leader" });

    const theLeader = await userModel.findById(leader);
    const isTheLeaderHasTeam = await operationTeamModel.findOne({ leader });

    if (theLeader.role !== "team-leader") return res.status(400).json({ message: "the tl isn't a tl" });
    if (isTheLeaderHasTeam) return res.status(400).json({ message: "has a team already" });

    const teamTemp = {
        leader,
        agents: [],
        performance: [],
    };

    const team = await operationTeamModel.create(teamTemp);

    if (team) theLeader.operationTeam = team._id;

    await theLeader.save();

    return res.status(200).json({ message: "Operation Team has been added successfuly", team });
};

export const addNumbersToTeam = async (req, res) => {
    const { user, team } = req;
    const { date, teamNumbers } = req.body;

    if (user.role !== "team-leader") return res.status(400).json({ message: "not a tl" });

    const theYear = dayjs(date).year();
    const theMonth = theMonths[dayjs(date).month()];
    const theDay = dayjs(date).date();

    // check if there is already nubmers with the same date

    // ! year
    if (!team.performance) team.performance = [];
    if (team.performance.length < 1) team.performance.push({ year: theYear, months: [] });
    let theYearArray;
    if (team.performance.length > 0) {
        const isYearExist = team.performance.find((y) => y.year === theYear);
        if (isYearExist) theYearArray = isYearExist;
        if (!isYearExist) {
            team.performance.push({ year: theYear, months: [] });
            theYearArray = team.performance.find((y) => y.year === theYear);
        }
    }

    // ! month
    if (theYearArray.months.length < 1) theYearArray.months.push({ month: theMonth, performance: [] });
    let theMonthObject;
    if (theYearArray.months.length >= 1) {
        const monthExist = theYearArray.months.find((m) => m.month === theMonth);
        if (monthExist) theMonthObject = monthExist;
        if (!monthExist) theYearArray.months.push({ month: theMonth, performance: [] });
    }

    // ! day
    if (theMonthObject.performance.length > 0) {
        const isThereNumbersWithSameDate = theMonthObject.performance.find((n) => n.date === theDay);
        if (isThereNumbersWithSameDate) isThereNumbersWithSameDate.deleteOne();
    }

    // fake object to push it instead of pushing direct
    let createNewNumbers = {
        date: theDay,
        total: {},
        performance: [],
        theTops: {},
    };

    let tops = {
        CSAT: {
            agent: "",
            CSAT: 0,
        },
        KCSAT: {
            agent: "",
            KCSAT: 0,
        },
        PMTD: {
            agent: "",
            PMTD: 0,
        },
    };

    // push team numbers on the team numbers array
    teamNumbers.forEach(async (number) => {
        // total
        if (number.Agent === "TOTAL") {
            createNewNumbers.total = {
                agent: number.Agent,
                surveys: number.Tickets_Calls,
                responseRate: number.Response_Rate,
                CSAT: number.Accurate,
                KCSAT: number.Solved,
                PPH: number.PPH,
                PPD: number.PPD,
                PMTD: number.PMTD,
                closedCases: number.Closed_Cases,
                QAEvaulations: number.QA_Evaluations,
                QAScore: number.QA_Score,
                IdleTime: number.Idle_Time,
            };
        } else {
            // tops
            if (number.Accurate > tops.CSAT.CSAT) {
                tops.CSAT.agent = number.Agent;
                tops.CSAT.CSAT = number.Accurate;
            }
            if (number.Solved > tops.KCSAT.KCSAT) {
                tops.KCSAT.agent = number.Agent;
                tops.KCSAT.KCSAT = number.Solved;
            }
            if (number.PMTD > tops.PMTD.PMTD) {
                tops.PMTD.agent = number.Agent;
                tops.PMTD.PMTD = number.PMTD;
            }

            createNewNumbers.theTops = tops;

            // teamnumbers array
            createNewNumbers.performance.push({
                agent: number.Agent,
                surveys: number.Tickets_Calls,
                responseRate: number.Response_Rate,
                CSAT: number.Accurate,
                KCSAT: number.Solved,
                PPH: number.PPH,
                PPD: number.PPD,
                PMTD: number.PMTD,
                closedCases: number.Closed_Cases,
                QAEvaulations: number.QA_Evaluations,
                QAScore: number.QA_Score,
                IdleTime: number.Idle_Time,
            });

            const agent = await userModel.findOne({ email: number.Agent });

            // check if the agent has an account on the website / if has push the numbers on his account
            if (agent) {
                // check if the agent has the year, month / if not create it
                const isAgentHasTheYear = agent.performance.find((y) => y.year === theYear);
                let agentYearsObject;
                if (isAgentHasTheYear) agentYearsObject = isAgentHasTheYear;
                if (!isAgentHasTheYear) {
                    agent.performance.push({ year: theYear, performance: [] });
                    agentYearsObject = agent.performance.find((y) => y.year === theYear);
                }

                const isAgentHasTheMonth = agentYearsObject.months.find((m) => m.month === theMonth);
                let agentMonthsObject;
                if (isAgentHasTheMonth) agentMonthsObject = isAgentHasTheMonth;
                if (!isAgentHasTheMonth) {
                    agentYearsObject.months.push({ month: theMonth });
                    agentMonthsObject = agentYearsObject.months.find((m) => m.month === theMonth);
                }

                const agentHasNumberWithSameDate = agentMonthsObject.performance.find((number) => number.date === theDay);
                if (agentHasNumberWithSameDate) agentHasNumberWithSameDate.deleteOne();

                // push the data after creatin the date in his object
                agentMonthsObject.performance.push({
                    date: theDay,
                    surveys: number.Tickets_Calls,
                    responseRate: number.Response_Rate,
                    CSAT: number.Accurate,
                    KCSAT: number.Solved,
                    PPH: number.PPH,
                    PPD: number.PPD,
                    PMTD: number.PMTD,
                    closedCases: number.Closed_Cases,
                    QAEvaulations: number.QA_Evaluations,
                    QAScore: number.QA_Score,
                    IdleTime: number.Idle_Time,
                });
                await agent.save();
            }
        }
    });

    // if it's th first time to add numbers so create the array
    theMonthObject.performance.push(createNewNumbers);

    await team.save();
    return res.status(200).json({ message: "numbers has been uploaded", teamNumbers: createNewNumbers });
};

export const getTeamNumbersPerDay = async (req, res) => {
    const { team } = req;
    const { date } = req.params;

    // get the specific date
    const findYear = team.performance.find((y) => y.year === dayjs(date).year());
    const monthNumbers = findYear?.months?.find((m) => m.month === theMonths[dayjs(date).month()]);
    const teamNumbers = monthNumbers?.performance?.find((n) => n.date === dayjs(date).date());

    if (!teamNumbers) return res.status(200).json({ message: "emptyy" });

    return res.status(200).json({ message: "team", teamNumbers });
};

export const getTeamNumbersPerMonth = async (req, res) => {
    const { team } = req;
    const { date } = req.params;

    // get the specific date
    const findYear = team.performance.find((y) => y.year === dayjs(date).year());
    const monthNumbers = findYear?.months?.find((n) => n.month === theMonths[dayjs(date).month()]);
    const teamNumbers = monthNumbers?.performance;

    if (!teamNumbers) return res.status(200).json({ message: "not updated yet" });

    function compare(a, b) {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    }

    teamNumbers.sort(compare);

    return res.status(200).json({ message: "team", teamNumbers });
};
