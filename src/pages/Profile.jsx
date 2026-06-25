import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile, uploadProfileImage, deleteProfile, getProviders, unlinkProvider } from "../api";
import { useAuth } from "../context/AuthContext";
import NavLogo from "../components/NavLogo";
import ThemeToggle from "../components/ThemeToggle";
import { sanitizeStrictText } from "../utils/inputSanitizers";
import "./Profile.css";

/*
Purpose: Manages user account profiles, details updates, profile photo uploads, and self-serve deletion.
Used By: App.jsx (Routes)
Request Flow: User Profile interactions -> API helpers -> AuthController -> DB write / delete
Data Flow: Form inputs -> sanitizers -> updateProfile JSON payload -> AuthContext state synchronization
Learn: State variables (useState), custom verification dialogs, data sanitization
*/
const Profile = () => {
  const { user, loginUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profileImageUrl || "");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [providers, setProviders] = useState({
    google: false,
    microsoft: false,
    apple: false,
    phone: false,
    local: false
  });

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await getProviders();
        setProviders(res.data);
      } catch (err) {
        console.error("Failed to load connected providers", err);
      }
    };
    fetchProviders();
  }, []);

  const handleUnlink = async (providerName) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${providerName} account?`)) return;
    try {
      await unlinkProvider(providerName.toLowerCase());
      setProviders(prev => ({ ...prev, [providerName.toLowerCase()]: false }));
      setMessage({ text: `${providerName} account unlinked successfully.`, type: "success" });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || `Failed to unlink ${providerName}.`, type: "error" });
    }
  };

  const plan = user?.subscriptionPlan || "Basic";
  const initials = (name || user?.email || "U").slice(0, 2).toUpperCase();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: "File size exceeds the maximum limit of 2MB.", type: "error" });
      return;
    }
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // Remove profile photo — clears image and saves null to backend
  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    setRemoving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await updateProfile({ name, profileImageUrl: null });
      loginUser({ ...res.data, token: localStorage.getItem("token") });
      setPreviewImage("");
      setProfileImage(null);
      setMessage({ text: "Profile photo removed.", type: "success" });
    } catch {
      setMessage({ text: "Failed to remove photo.", type: "error" });
    } finally {
      setRemoving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      let profileImageUrl = user?.profileImageUrl;

      if (profileImage) {
        const res = await uploadProfileImage(profileImage);
        profileImageUrl = res.data.imageUrl;
      }

      const updateRes = await updateProfile({ name, profileImageUrl });
      loginUser({ ...updateRes.data, token: localStorage.getItem("token") });
      setMessage({ text: "Profile updated.", type: "success" });
      setProfileImage(null);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Profile update failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== user?.email) return;
    setDeleting(true);
    try {
      await deleteProfile();
      logoutUser();
      navigate("/");
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to delete account. Please try again.",
        type: "error",
      });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="profile-page premium-shell">
      <nav className="profile-nav">
        <NavLogo className="pricing-logo" />
        <div className="profile-nav-links">
          <Link to="/pricing" className="btn-back">Pricing</Link>
          <Link to="/dashboard" className="btn-back">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="profile-layout">
        <aside className="profile-summary">
          <div className="profile-avatar-large">
            {previewImage ? <img src={previewImage} alt="Profile" /> : <span>{initials}</span>}
          </div>
          <h1>{name || "Your profile"}</h1>
          <p>{user?.email}</p>
          <div className={`profile-plan ${plan.toLowerCase()}`}>{plan} plan</div>
        </aside>

        <section className="profile-card">
          <div className="profile-card-head">
            <p>Account</p>
            <h2>Keep your public details tidy.</h2>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="avatar-control">
              <div className="avatar-preview">
                {previewImage ? (
                  <img src={previewImage} alt="Profile preview" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">{initials}</div>
                )}
              </div>
              <div className="avatar-actions">
                <label className="avatar-upload-btn">
                  Upload photo
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </label>
                {previewImage && (
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={handleRemovePhoto}
                    disabled={removing}
                    title="Remove profile photo"
                  >
                    {removing ? "Removing…" : "Remove"}
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(sanitizeStrictText(e.target.value))}
                required
                minLength={2}
                maxLength={40}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                title="Email cannot be changed"
                className="disabled-input"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Saving" : "Save changes"}
              </button>
            </div>
          </form>

          <div className="connected-accounts-card" style={{ marginTop: "2rem", marginBottom: "2rem", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "1.5rem", background: "var(--paper)" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)" }}>Connected Accounts</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem", marginBottom: "1.2rem" }}>
              Manage third-party authentication services linked to your VResIQ account.
            </p>
            <div style={{ display: "grid", gap: "1rem" }}>
              {[
                { name: "Google", key: "google" },
                { name: "Microsoft", key: "microsoft" },
                { name: "Apple", key: "apple" },
                { name: "Phone", key: "phone" }
              ].map(provider => {
                const isLinked = providers[provider.key];
                return (
                  <div key={provider.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid var(--line)" }}>
                    <div>
                      <span style={{ fontWeight: 650, color: "var(--ink)" }}>{provider.name}</span>
                      <div style={{ fontSize: "0.8rem", color: isLinked ? "#16a34a" : "var(--muted)" }}>
                        {isLinked ? "Connected" : "Not connected"}
                      </div>
                    </div>
                    {isLinked ? (
                      <button 
                        type="button" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", background: "transparent", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--danger)", cursor: "pointer" }}
                        onClick={() => handleUnlink(provider.name)}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", background: "var(--wash)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "var(--radius)", cursor: "pointer" }}
                        onClick={() => alert(`To link a new provider, sign in using ${provider.name} on the login page with the same email address.`)}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="danger-zone-card">
            <h3>Danger Zone</h3>
            <p>
              Once you delete your account, all your resumes, payments, and stats will be permanently removed. This action is irreversible.
            </p>
            <p className="danger-zone-support">
              Need assistance? Contact Support: <a href="mailto:vresiq.app@gmail.com" className="support-link">vresiq.app@gmail.com</a>
            </p>
            <button
              type="button"
              className="danger-zone-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </button>
          </div>
        </section>
      </main>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p>
              Are you absolutely sure you want to delete your account? This will permanently erase your resumes and all related data.
            </p>
            <div className="warning-box">
              <p>Warning: This action cannot be undone.</p>
            </div>
            <div className="modal-input-group">
              <label>Please type <strong>{user?.email}</strong> to confirm:</label>
              <input
                type="text"
                placeholder={user?.email}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmEmail("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-delete-btn"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmEmail !== user?.email}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
