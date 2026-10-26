
import { useEffect, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000/api/agents";

function App() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    team: "",
    status: "Offline",
    location: "",
  });

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }

        const result = await response.json();
        setAgents(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const availableCount = agents.filter(
    (agent) => agent.status === "Available"
  ).length;

  const busyCount = agents.filter(
    (agent) => agent.status === "Busy"
  ).length;

  const offlineCount = agents.filter(
    (agent) => agent.status === "Offline"
  ).length;

  const stats = [
    {
      title: "Total agents",
      count: agents.length,
      description: "Registered agents",
    },
    {
      title: "Available",
      count: availableCount,
      description: "Ready to receive work",
    },
    {
      title: "Busy",
      count: busyCount,
      description: "Currently handling work",
    },
    {
      title: "Offline",
      count: offlineCount,
      description: "Not currently available",
    },
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create agent"
        );
      }

      setAgents((previous) => [result.data, ...previous]);

      setFormData({
        name: "",
        email: "",
        team: "",
        status: "Offline",
        location: "",
      });

      setFormSuccess("Agent added successfully!");
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (agentId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/agents/${agentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update status");
      }

      setAgents((currentAgents) =>
        currentAgents.map((agent) =>
          agent._id === agentId ? result.data : agent
        )
      );
    } catch (error) {
      console.error("Status update failed:", error);
      setError(error.message || "Failed to update agent status");
    }
  };

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("agentStatusUpdated", (updatedAgent) => {
      console.log("Real-time status update received:", updatedAgent);

      setAgents((currentAgents) =>
        currentAgents.map((agent) =>
          agent._id === updatedAgent._id ? updatedAgent : agent
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <h2>AgentPresence</h2>
            <span>Service Desk Operations</span>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          System online
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <p className="eyebrow">OPERATIONS OVERVIEW</p>
          <h1>Agent Presence Dashboard</h1>
          <p>Monitor agent availability across your service desk.</p>
        </section>

        {formSuccess && (
          <p className="success-message">{formSuccess}</p>
        )}

        {stats.length > 0 && (
          <section className="stats">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.title}>
                <span>{stat.title}</span>
                <h2>{loading ? "—" : stat.count}</h2>
                <p>{stat.description}</p>
              </article>
            ))}
          </section>
        )}

        <section className="agents-panel">
          <div className="panel-heading">
            <div>
              <h2>Agent Directory</h2>
              <p>Current team availability</p>
            </div>

            <button
              type="button"
              className="add-agent-button"
              onClick={() => {
                setFormError("");
                setFormSuccess("");
                setShowForm(true);
              }}
            >
              + Add Agent
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>Loading agents...</h3>
            </div>
          ) : error ? (
            <div className="empty-state">
              <h3>Couldn't load agents</h3>
              <p>{error}</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="empty-state">
              <h3>No agents yet</h3>
              <p>Add your first agent using the button above.</p>
            </div>
          ) : (
            <div className="agent-list">
              {agents.map((agent) => (
                <div className="agent-row" key={agent._id}>
                  <div className="agent-avatar">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="agent-info">
                    <h3>{agent.name}</h3>
                    <p>{agent.email}</p>
                    <p>
                      {agent.team} · {agent.location}
                    </p>
                  </div>

                  <select
                    className={`agent-status ${agent.status.toLowerCase()}`}
                    value={agent.status}
                    onChange={(e) =>
                      handleStatusChange(agent._id, e.target.value)
                    }
                    aria-label={`Change status for ${agent.name}`}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="api-footer">
          <span>Backend connection</span>
          <span>
            {error
              ? "Connection failed"
              : loading
                ? "Connecting..."
                : "Connected · MongoDB data loaded"}
          </span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
              setFormError("");
            }
          }}
        >
          <section
            className="agent-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-agent-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="add-agent-title">Add new agent</h2>
                <p>Enter the agent's details below.</p>
              </div>

              <button
                type="button"
                className="close-button"
                aria-label="Close form"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Full name
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. priya@example.com"
                  required
                />
              </label>

              <label>
                Team
                <input
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                  placeholder="e.g. APJ Service Desk"
                  required
                />
              </label>

              <label>
                Location
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Bangalore"
                />
              </label>

              <label>
                Initial status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </label>

              {formError && (
                <p className="form-error">{formError}</p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-agent-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Agent"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
