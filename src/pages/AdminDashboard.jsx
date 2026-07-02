import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavLogo from "../components/NavLogo";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/formatters";
import {
  getAdminAnalytics,
  getAdminUsers,
  toggleUserStatus,
  deleteUserAdmin,
  getAdminResumes,
  deleteAdminResume,
  getAdminPayments,
  getAdminAiStats,
  updateAdminSubscription
} from "../api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [aiStats, setAiStats] = useState([]);

  // Action status loading states
  const [actioningUser, setActioningUser] = useState("");
  const [actioningResume, setActioningResume] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "analytics") {
        const res = await getAdminAnalytics();
        setAnalytics(res.data);
      } else if (activeTab === "users") {
        const res = await getAdminUsers();
        setUsers(res.data);
      } else if (activeTab === "resumes") {
        const res = await getAdminResumes();
        setResumes(res.data);
      } else if (activeTab === "payments") {
        const res = await getAdminPayments();
        setPayments(res.data);
      } else if (activeTab === "ai") {
        const res = await getAdminAiStats();
        setAiStats(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    setActioningUser(userId);
    setError("");
    try {
      const res = await toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, active: res.data.active } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user access.");
    } finally {
      setActioningUser("");
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you absolutely sure you want to delete user "${email}"?\nThis will permanently purge all their resumes, stats, and billing records cascadingly.`)) {
      return;
    }
    setActioningUser(userId);
    setError("");
    try {
      await deleteUserAdmin(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActioningUser("");
    }
  };

  const handleChangeSubscription = async (userId, newPlan) => {
    if (!window.confirm("Are you sure you want to change this user's subscription?")) {
      fetchData();
      return;
    }
    setActioningUser(userId);
    setError("");
    try {
      const res = await updateAdminSubscription(userId, newPlan);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, subscriptionPlan: res.data.subscriptionPlan } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user subscription.");
      fetchData();
    } finally {
      setActioningUser("");
    }
  };

  const handleDeleteResume = async (resumeId, title) => {
    if (!window.confirm(`Permanently delete resume "${title}"?`)) {
      return;
    }
    setActioningResume(resumeId);
    setError("");
    try {
      await deleteAdminResume(resumeId);
      setResumes((prev) => prev.filter((r) => r._id !== resumeId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete resume.");
    } finally {
      setActioningResume("");
    }
  };

  const formatRevenue = (paise) => {
    return formatINR(paise);
  };

  return (
    <div className="admin-dashboard premium-shell">
      <nav className="dash-nav">
        <NavLogo className="dash-logo" />
        <div className="dash-nav-right">
          <Link to="/dashboard" className="nav-link">User Dashboard</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          <ThemeToggle />
          <span className="admin-badge">Admin</span>
        </div>
      </nav>

      <main className="admin-content">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Administrative System Panel</p>
            <h1>SaaS Workspace Control</h1>
            <span>Monitor platform usage, manage active accounts, audit invoices, and analyze AI load.</span>
          </div>
          <button onClick={fetchData} className="btn-refresh" disabled={loading}>
            {loading ? "Syncing…" : "Sync Panel"}
          </button>
        </header>

        {error && <div className="admin-error-banner">{error}</div>}

        {/* Tab Controls */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics Overview
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            User Accounts
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "resumes" ? "active" : ""}`}
            onClick={() => setActiveTab("resumes")}
          >
            Resumes List
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Razorpay Payments
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            AI Usage Metrics
          </button>
        </div>

        {/* Content Panel */}
        <div className="admin-panel-card">
          {loading ? (
            <div className="admin-loader-wrap">
              <div className="spinner" />
              <span>Fetching secure tables...</span>
            </div>
          ) : (
            <div className="admin-tab-content">
              {activeTab === "analytics" && analytics && (
                <div className="analytics-grid">
                  <div className="stat-card">
                    <span>Platform Signups</span>
                    <strong>{analytics.totalUsers}</strong>
                    <small>Registered Accounts</small>
                  </div>
                  <div className="stat-card">
                    <span>Premium Pro Subscribers</span>
                    <strong>{analytics.premiumUsers}</strong>
                    <small>Active Tier Upgrades</small>
                  </div>
                  <div className="stat-card">
                    <span>Total Resumes Kept</span>
                    <strong>{analytics.totalResumes}</strong>
                    <small>Documents Saved</small>
                  </div>
                  <div className="stat-card">
                    <span>Payment Orders</span>
                    <strong>{analytics.totalPayments}</strong>
                    <small>Attempted checkouts</small>
                  </div>
                  <div className="stat-card revenue">
                    <span>Accrued Platform Revenue</span>
                    <strong>{formatRevenue(analytics.totalRevenuePaise)}</strong>
                    <small>Paid Transactions</small>
                  </div>
                  <div className="stat-card">
                    <span>Active AI Rewrites</span>
                    <strong>{analytics.totalAiRewrites}</strong>
                    <small>Daily generation queries</small>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Avatar</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subscription</th>
                        <th>Verified</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Control Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-cell">No users registered yet.</td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} className={!u.active ? "disabled-row" : ""}>
                            <td>
                              <div className="user-avatar">
                                {u.profileImageUrl ? (
                                  <img src={u.profileImageUrl} alt={u.name} />
                                ) : (
                                  <span>{u.name?.slice(0, 2)?.toUpperCase()}</span>
                                )}
                              </div>
                            </td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td>
                              <select
                                value={u.subscriptionPlan?.toLowerCase() === "premium" ? "premium" : "basic"}
                                onChange={(e) => handleChangeSubscription(u._id, e.target.value)}
                                className="admin-plan-select"
                                disabled={actioningUser === u._id}
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "4px",
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.15)",
                                  color: "var(--text-color, #ffffff)"
                                }}
                              >
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                              </select>
                            </td>
                            <td>{u.emailVerified ? "Yes" : "No"}</td>
                            <td>
                              <span className={`status-pill ${u.active ? "active" : "disabled"}`}>
                                {u.active ? "Enabled" : "Suspended"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() => handleToggleStatus(u._id)}
                                className={`btn-admin-action ${u.active ? "suspend" : "enable"}`}
                                disabled={actioningUser === u._id || u.email === user?.email}
                                title={u.email === user?.email ? "Self-action blocked" : ""}
                              >
                                {u.active ? "Suspend" : "Enable"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id, u.email)}
                                className="btn-admin-action delete"
                                disabled={actioningUser === u._id || u.email === user?.email}
                                title={u.email === user?.email ? "Self-action blocked" : ""}
                              >
                                Purge
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "resumes" && (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Thumbnail</th>
                        <th>Document Title</th>
                        <th>Owner User ID</th>
                        <th>Template Layout</th>
                        <th>Last Modified</th>
                        <th style={{ textAlign: "right" }}>Purge Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-cell">No resumes created yet.</td>
                        </tr>
                      ) : (
                        resumes.map((r) => (
                          <tr key={r._id}>
                            <td>
                              <div className="resume-mini-thumb">
                                {r.thumbnailLink ? (
                                  <img src={r.thumbnailLink} alt={r.title} />
                                ) : (
                                  <span>{r.title?.slice(0, 2)?.toUpperCase()}</span>
                                )}
                              </div>
                            </td>
                            <td><strong>{r.title}</strong></td>
                            <td className="code-font">{r.userId}</td>
                            <td>
                              <span className="template-badge-pill">{r.template || "Classic"}</span>
                            </td>
                            <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : new Date(r.createdAt).toLocaleString()}</td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() => handleDeleteResume(r._id, r.title)}
                                className="btn-admin-action delete"
                                disabled={actioningResume === r._id}
                              >
                                Purge
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Receipt ID</th>
                        <th>Razorpay Order ID</th>
                        <th>Razorpay Payment ID</th>
                        <th>User ID</th>
                        <th>Amount</th>
                        <th>Billing Status</th>
                        <th>Checkout Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-cell">No transactions found.</td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p._id}>
                            <td className="code-font">{p.receipt || p._id}</td>
                            <td className="code-font">{p.razorpayOrderId}</td>
                            <td className="code-font">{p.razorpayPaymentId || "Pending"}</td>
                            <td className="code-font">{p.userId}</td>
                            <td><strong>{formatRevenue(p.amount)}</strong></td>
                            <td>
                              <span className={`status-pill ${p.status === "paid" ? "active" : "disabled"}`}>
                                {p.status}
                              </span>
                            </td>
                            <td>{new Date(p.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Record ID</th>
                        <th>Account User ID</th>
                        <th>Daily Rewrite Queries</th>
                        <th>Last Reset Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiStats.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="empty-cell">No active AI rewrite logs recorded.</td>
                        </tr>
                      ) : (
                        aiStats.map((s) => (
                          <tr key={s._id}>
                            <td className="code-font">{s._id}</td>
                            <td className="code-font">{s.userId}</td>
                            <td>
                              <div className="ai-meter-wrap">
                                <strong>{s.dailyRewriteCount} / 20</strong>
                                <div className="ai-meter">
                                  <div
                                    className="ai-meter-bar"
                                    style={{ width: `${Math.min(100, (s.dailyRewriteCount / 20) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>{new Date(s.lastResetDate).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
