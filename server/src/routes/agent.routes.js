const express = require("express");
const router = express.Router();

const {
  getAgents,
  createAgent,
  updateAgentStatus,
} = require("../controllers/agent.controller");

router.get("/", getAgents);
router.post("/", createAgent);
router.patch("/:id/status", updateAgentStatus);

module.exports = router;