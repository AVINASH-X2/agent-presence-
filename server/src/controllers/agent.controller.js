
const Agent = require("../models/Agent.model");

// GET /api/agents — retrieve all agents
const getAgents = async (req, res) => {
    try {
        const agents = await Agent.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: agents.length,
            data: agents,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve agents",
        });
    }
};

// POST /api/agents — create an agent
const createAgent = async (req, res) => {
    try {
        const { name, email, team, status, location } = req.body;

        const agent = await Agent.create({
            name,
            email,
            team,
            status,
            location,
        });

        res.status(201).json({
            success: true,
            data: agent,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An agent with this email already exists",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create agent",
        });
    }
};


const updateAgentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = ["Available", "Busy", "Offline"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid agent status",
            });
        }

        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found",
            });
        }

        req.app.get("io").emit("agentStatusUpdated", agent);

        res.status(200).json({ success: true, data: agent });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid agent ID",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update agent status",
        });
    }
};


module.exports = {
    getAgents,
    createAgent,
    updateAgentStatus,
};
