const express = require ("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

const agentRoutes = require("./routes/agent.routes");

app.use("/api/agents", agentRoutes);

app.get("/api/health", (req, res)=>{
    res.status(200).json({
        success: true, 
        message: "Agent Presense API is running!"
    });
});

module.exports = app; 