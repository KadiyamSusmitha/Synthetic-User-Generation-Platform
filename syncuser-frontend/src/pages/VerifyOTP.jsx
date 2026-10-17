import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../components/AuthLayout";
import { verifyOTP, resendOTP } from "../api/auth";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // Resend OTP states
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // =====================================================
  // RESEND OTP COOLDOWN
  // =====================================================
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((previousValue) => previousValue - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // =====================================================
  // VERIFY OTP
  // =====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!otp) {
      setError("Please enter the OTP.");
      toast.error("Please enter the verification code.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      toast.error("Please enter a valid 6-digit verification code.");
      return;
    }

    setError("");

    try {
      const data = await verifyOTP(email, otp);

      toast.success("Verification code verified successfully.");

      navigate("/reset-password", {
        state: {
          email,
          resetToken: data.reset_token,
        },
      });
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  // =====================================================
  // OTP INPUT
  // =====================================================
  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, "");

    if (value.length <= 6) {
      setOtp(value);
      setError("");
    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================
  const handleResendOTP = async () => {
    // Prevent multiple clicks during cooldown
    if (resendCooldown > 0 || resendLoading) {
      return;
    }

    setError("");

    try {
      setResendLoading(true);

      await resendOTP(email);

      toast.success(
        "A new verification code has been sent to your email.",
      );

      // Start 60-second cooldown after successful resend
      setResendCooldown(60);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Enter OTP"
      description="Please enter the OTP sent to your email"
      leftTitle={
        <>
          Verify your
          <br />
          account securely.
        </>
      }
      leftDescription="We sent a verification code to your registered email address."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* =====================================================
            OTP
            ===================================================== */}
        <div>
          <label
            htmlFor="otp"
            className="mb-1.5 block text-sm font-medium text-[#262633]"
          >
            Verification code
          </label>

          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-center text-lg font-semibold tracking-[0.4em] text-[#262633] outline-none transition placeholder:text-[#9AA1A8] placeholder:tracking-normal ${
              error
                ? "border-red-400"
                : "border-[#D6DEE0] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#E7F3F2]"
            }`}
          />
        </div>

        {/* =====================================================
            VERIFY OTP BUTTON
            ===================================================== */}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#0F8E77] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#08705F] focus:outline-none focus:ring-2 focus:ring-[#E7F3F2] focus:ring-offset-2"
        >
          Verify OTP
        </button>
      </form>

      {/* =====================================================
          RESEND OTP
          ===================================================== */}
      <div className="mt-5 flex items-center justify-center gap-1 text-sm">
        <span className="text-[#626975]">
          Didn't receive the OTP?
        </span>

        <button
          type="button"
          className={`font-semibold text-[#0F8E77] ${
            resendCooldown > 0 || resendLoading
              ? "cursor-not-allowed opacity-60"
              : "hover:underline"
          }`}
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || resendLoading}
        >
          {resendLoading
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : "Resend OTP"}
        </button>
      </div>

      {/* =====================================================
          BACK
          ===================================================== */}
      <p className="mt-4 text-center text-sm text-[#626975]">
        <Link
          to="/forgot-password"
          className="font-semibold text-[#0F8E77] hover:underline"
        >
          Back
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyOTP;