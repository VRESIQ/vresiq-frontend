import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createResume, deleteResume, getUserResumes } from "../api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import NavLogo from "../components/NavLogo";
import "./Dashboard.css";

const FREE_TEMPLATES = [
  { id: "template1", name: "Classic" },
];

const PREMIUM_TEMPLATES = [
  { id: "template2",  name: "Nova" },
  { id: "template3",  name: "Horizon" },
  { id: "premium1",  name: "Prestige" },
  { id: "premium2",  name: "Executive" },
  { id: "premium3",  name: "Elite" },
  { id: "premium4",  name: "Signature" },
  { id: "premium5",  name: "Apex" },
  { id: "premium6",  name: "Split" },
  { id: "premium7",  name: "Block" },
  { id: "premium8",  name: "Visual" },
  { id: "premium9",  name: "Centered" },
  { id: "premium10", name: "Minimal" },
  { id: "ats_classic",     name: "Standard" },
  { id: "ats_entry",       name: "Edge" },
  { id: "ats_senior",      name: "Serif" },
  { id: "ats_lead",        name: "Lead" },
  { id: "ats_intern",      name: "Campus" },
  { id: "ats_experienced", name: "Prime" },
  { id: "academic_cv",     name: "Scholar" },
];

const ALL_TEMPLATE_MAP = Object.fromEntries(
  [...FREE_TEMPLATES, ...PREMIUM_TEMPLATES].map((t) => [t.id, t.name])
);

const TemplateMini = ({ id, locked, selected, onClick }) => (
  <button
    type="button"
    className={`template-mini ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
    onClick={onClick}
    disabled={locked}
    title={locked ? "Upgrade to Pro to unlock" : ALL_TEMPLATE_MAP[id] || id}
  >
    <span className={`mini-art ${id}`}>
      <span /><span /><span />
    </span>
    <span>{ALL_TEMPLATE_MAP[id] || id}</span>
    {locked && <small>Pro</small>}
  </button>
);

const Dashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("template1");
  const [showModal, setShowModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }
    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [isMenuOpen]);

  const isFreePlan = user?.subscriptionPlan?.toLowerCase() !== "premium";
  const hasReachedLimit = isFreePlan && resumes.length >= 1;

  const stats = useMemo(() => {
    const updated = resumes
      .map((r) => r.updatedAt || r.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);

    return [
      { label: "Resumes", value: resumes.length },
      { label: "Plan", value: isFreePlan ? "Free" : "Pro" },
      { label: "Latest edit", value: updated ? new Date(updated).toLocaleDateString() : "None" },
    ];
  }, [resumes, isFreePlan]);

  useEffect(() => {
    getUserResumes()
      .then((res) => setResumes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await createResume(newTitle.trim(), selectedTemplate);
      navigate(`/resume/${res.data._id}/edit`);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Could not create resume.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setDeleteError("");
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setDeleteError("Could not delete this resume. Please try again.");
    }
  };

  const openModal = () => {
    setNewTitle("");
    setSelectedTemplate("template1");
    setCreateError("");
    setShowModal(true);
  };

  return (
    <div className="dashboard premium-shell">
      <nav className="dash-nav">
        <NavLogo className="dash-logo" />
        
        {/* Desktop Navigation */}
        <div className="dash-nav-right">
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="nav-link admin-glow" style={{ color: "var(--color-primary, #6366f1)", fontWeight: "600" }}>Admin Console</Link>
          )}
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          <span className="nav-plan">{isFreePlan ? "Free" : "Pro"}</span>
          <ThemeToggle />
          <button onClick={logoutUser} className="btn-logout">Log out</button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="nav-mobile-hamburger" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

      </nav>
      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="nav-mobile-drawer-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="nav-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <NavLogo className="nav-logo" />
              <button className="drawer-close" onClick={() => setIsMenuOpen(false)}>×</button>
            </div>
            <div className="drawer-links">
              {user?.role === "ADMIN" && (
                <Link to="/admin" className="drawer-link admin-glow" style={{ color: "var(--color-primary, #6366f1)", fontWeight: "600" }} onClick={() => setIsMenuOpen(false)}>Admin Console</Link>
              )}
              <Link to="/pricing" className="drawer-link" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              <Link to="/profile" className="drawer-link" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              <div className="drawer-toggle-row">
                <span>Theme Mode</span>
                <ThemeToggle />
              </div>
              <button onClick={() => { logoutUser(); setIsMenuOpen(false); }} className="drawer-btn btn-logout-drawer">Log out</button>
            </div>
          </div>
        </div>
      )}

      <main className="dash-content">
        <section className="dash-hero">
          <div>
            <p className="dash-kicker">Workspace</p>
            <h1>Your resumes, kept clean and ready to move.</h1>
            <span>
              Welcome back, {user?.name || "builder"}. Create role-specific versions, refine
              the content, then export when it feels finished.
            </span>
          </div>
          <button
            className="btn-create"
            onClick={openModal}
            disabled={hasReachedLimit}
            title={hasReachedLimit ? "Upgrade to Pro to create more resumes" : "Create resume"}
          >
            New resume
          </button>
        </section>

        <section className="dash-stats">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="stat-card skeleton">
                <div className="skeleton-line" style={{ width: "50%", height: "14px" }} />
                <div className="skeleton-line" style={{ width: "30%", height: "36px", marginTop: "8px" }} />
              </div>
            ))
          ) : (
            stats.map((item) => (
              <div className="stat-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))
          )}
        </section>

        {hasReachedLimit && (
          <div className="upgrade-strip">
            <span>Free accounts include one resume.</span>
            <Link to="/pricing">Unlock Pro →</Link>
          </div>
        )}

        {deleteError && <p className="dash-inline-error">{deleteError}</p>}

        {loading ? (
          <div className="resume-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="resume-card skeleton">
                <div className="resume-thumb-wrap skeleton-thumb" />
                <div className="resume-card-info">
                  <div className="skeleton-line" style={{ width: "40%" }} />
                  <div className="skeleton-line" style={{ width: "70%" }} />
                  <div className="skeleton-line" style={{ width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="dash-empty">
            <p>No resumes yet.</p>
            <button className="btn-create" onClick={openModal}>Create first resume</button>
          </div>
        ) : (
          <div className="resume-grid">
            {resumes.map((resume) => (
              <article key={resume._id} className="resume-card">
                <div className="resume-thumb-wrap">
                  {resume.thumbnailLink ? (
                    <img src={resume.thumbnailLink} alt={resume.title} className="resume-thumb" />
                  ) : (
                    <div className="resume-thumb-placeholder">
                      <span>{resume.title?.slice(0, 2)?.toUpperCase() || "CV"}</span>
                    </div>
                  )}
                </div>
                <div className="resume-card-info">
                  <span className="card-template-badge">
                    {ALL_TEMPLATE_MAP[resume.template] || resume.template || "Classic"}
                  </span>
                  <h3>{resume.title}</h3>
                  <p>{resume.profileInfo?.designation || "Designation not set"}</p>
                  <div className="resume-card-actions">
                    <button onClick={() => navigate(`/resume/${resume._id}/edit`)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(resume._id, resume.title)} className="btn-del">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <p>New resume</p>
              <h2>Name the version</h2>
            </div>
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                type="text"
                placeholder="Software Engineer – Product"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={60}
                required
              />

              <div className="template-picker">
                <p>Choose template</p>
                <div className="template-grid">
                  {FREE_TEMPLATES.map((t) => (
                    <TemplateMini
                      key={t.id}
                      id={t.id}
                      selected={selectedTemplate === t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                    />
                  ))}
                  {PREMIUM_TEMPLATES.map((t) => (
                    <TemplateMini
                      key={t.id}
                      id={t.id}
                      locked={isFreePlan}
                      selected={selectedTemplate === t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>

              {createError && <p className="field-error">{createError}</p>}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-create" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
