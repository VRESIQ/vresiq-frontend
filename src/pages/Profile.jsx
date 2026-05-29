import { useState } from "react";
import { Link } from "react-router-dom";
import { updateProfile, uploadProfileImage } from "../api";
import { useAuth } from "../context/AuthContext";
import NavLogo from "../components/NavLogo";
import ThemeToggle from "../components/ThemeToggle";
import { sanitizeStrictText } from "../utils/inputSanitizers";
import "./Profile.css";

const Profile = () => {
  const { user, loginUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profileImageUrl || "");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const plan = user?.subscriptionPlan || "Basic";
  const initials = (name || user?.email || "U").slice(0, 2).toUpperCase();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
        </section>
      </main>
    </div>
  );
};

export default Profile;
