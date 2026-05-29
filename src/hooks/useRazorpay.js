import { createOrder, verifyPayment } from "../api";
import { useAuth } from "../context/AuthContext";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const useRazorpay = () => {
  const { user, updateUser } = useAuth();

  const startPayment = async ({ onSuccess, onFailure } = {}) => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      onFailure?.("Razorpay checkout could not be loaded.");
      return;
    }

    try {
      const res = await createOrder();
      const { orderId, amount, currency } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "VRESIQ",
        description: "Pro Plan - one-time payment",
        order_id: orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#111410" },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            updateUser({ subscriptionPlan: "premium" });
            onSuccess?.();
          } catch {
            onFailure?.("Payment verification failed.");
          }
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      onFailure?.(err.response?.data?.message || "Failed to create payment order.");
    }
  };

  return { startPayment };
};

export default useRazorpay;
