import axiosInstance from "./axiosInstance";

// ─── AUTH ────────────────────────────────────────────────
export const register = (data) =>
  axiosInstance.post("/api/auth/register", data);
// data: { name, email, password, profileImageUrl? }

export const login = (data) =>
  axiosInstance.post("/api/auth/login", data);
// data: { email, password }
// returns: { id, name, email, profileImageUrl, subscriptionPlan, emailVerified, token, createdAt, updatedAt }

export const getProfile = () =>
  axiosInstance.get("/api/auth/profile");

export const updateProfile = (data) =>
  axiosInstance.put("/api/auth/profile", data, { skipLoader: true });

export const deleteProfile = () =>
  axiosInstance.delete("/api/auth/profile", { skipLoader: true });

export const verifyEmail = (token, email) => {
  const url = `/api/auth/verify-email?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  return axiosInstance.get(url);
};

export const resendVerification = (email) =>
  axiosInstance.post("/api/auth/resend-verification", { email });

export const refresh = (refreshToken) =>
  axiosInstance.post("/api/auth/refresh", { refreshToken }, { skipLoader: true });

export const forgotPassword = (email) =>
  axiosInstance.post("/api/auth/forgot-password", { email });

export const resetPassword = (token, password) =>
  axiosInstance.post("/api/auth/reset-password", { token, password });

export const uploadProfileImage = (file) => {
  const form = new FormData();
  form.append("image", file);
  return axiosInstance.post("/api/auth/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
    skipLoader: true,
  });
};

// ─── RESUMES ─────────────────────────────────────────────
export const createResume = (title, template) =>
  axiosInstance.post("/api/resumes", { title, template });
// returns: full Resume object

export const getUserResumes = () =>
  axiosInstance.get("/api/resumes", { skipLoader: true });

export const getResumeById = (id) =>
  axiosInstance.get(`/api/resumes/${id}`, { skipLoader: true });

export const updateResume = (id, data) =>
  axiosInstance.put(`/api/resumes/${id}`, data, { skipLoader: true });
// data: full Resume object (profileInfo, contactInfo, workExperience, education, skills, projects, certifications, languages, interests, template)

export const deleteResume = (id) =>
  axiosInstance.delete(`/api/resumes/${id}`, { skipLoader: true });

export const uploadResumeImages = (id, thumbnail, profileImage) => {
  const form = new FormData();
  form.append("thumbnail", thumbnail);
  if (profileImage) form.append("profileImage", profileImage);
  return axiosInstance.put(`/api/resumes/${id}/upload-images`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    skipLoader: true,
  });
};

// ─── TEMPLATES ───────────────────────────────────────────
export const getTemplates = () =>
  axiosInstance.get("/api/templates", { skipLoader: true });
// returns: { templates: [...], userPlan: "basic" | "premium" }

// ─── PAYMENT ─────────────────────────────────────────────
export const createOrder = () =>
  axiosInstance.post("/api/payment/create-order", { planType: "premium" });
// returns: { orderId, amount, currency, receipt }

export const verifyPayment = (data) =>
  axiosInstance.post("/api/payment/verify", data);
// data: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

export const getPaymentHistory = () =>
  axiosInstance.get("/api/payment/history", { skipLoader: true });

export const getOrderDetails = (orderId) =>
  axiosInstance.get(`/api/payment/order/${orderId}`, { skipLoader: true });

// ─── EMAIL ───────────────────────────────────────────────
export const sendResumeByEmail = ({ recipientEmail, subject, message, pdfFile }) => {
  const form = new FormData();
  form.append("recipientEmail", recipientEmail);
  form.append("subject", subject);
  form.append("message", message);
  form.append("pdfFile", pdfFile);
  return axiosInstance.post("/api/email/send-resume", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const exportResumePdf = (id, htmlContent, isFreePlan = true) =>
  axiosInstance.post(`/api/resumes/${id}/export-pdf`, { htmlContent, isFreePlan: String(isFreePlan) }, {
    responseType: "blob"
  });

// ─── AI / ATS REFINE ─────────────────────────────────────
export const refineResume = (resumeId) =>
  axiosInstance.post(`/api/ai/refine/${resumeId}`);
// Pro only. Returns: { atsScore, overallFeedback, category, issues: [{ type, section, original, suggestion, severity, points }] }

// ─── VERIFICATION ────────────────────────────────────────
export const verifyGitHub = (username) =>
  axiosInstance.get(`/api/verify/github?username=${username}`, { skipLoader: true });

export const verifyInstitution = (name) =>
  axiosInstance.get(`/api/verify/institution?name=${name}`, { skipLoader: true });

export const verifyCertification = (name) =>
  axiosInstance.get(`/api/verify/certification?name=${name}`, { skipLoader: true });

export const rewriteContent = (content, tone = "professional") =>
  axiosInstance.post("/api/ai/rewrite", { content, tone });



export const getProviders = () =>
  axiosInstance.get("/api/auth/providers");

export const unlinkProvider = (provider) =>
  axiosInstance.post("/api/auth/providers/unlink", { provider });

// ─── ADMIN ───────────────────────────────────────────────
export const getAdminAnalytics = () => axiosInstance.get("/api/admin/analytics", { skipLoader: true });
export const getAdminUsers = () => axiosInstance.get("/api/admin/users", { skipLoader: true });
export const toggleUserStatus = (userId) => axiosInstance.put(`/api/admin/users/${userId}/toggle-status`, {}, { skipLoader: true });
export const deleteUserAdmin = (userId) => axiosInstance.delete(`/api/admin/users/${userId}`, { skipLoader: true });
export const getAdminResumes = () => axiosInstance.get("/api/admin/resumes", { skipLoader: true });
export const deleteAdminResume = (resumeId) => axiosInstance.delete(`/api/admin/resumes/${resumeId}`, { skipLoader: true });
export const getAdminPayments = () => axiosInstance.get("/api/admin/payments", { skipLoader: true });
export const getAdminAiStats = () => axiosInstance.get("/api/admin/ai-stats", { skipLoader: true });
