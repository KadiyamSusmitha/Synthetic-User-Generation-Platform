import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../components/AuthLayout";

import { validateEmail } from "../utils/validation";
import { forgotPassword } from "../api/auth";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const emailError = validateEmail(email);

    setError(emailError);

    if (emailError) {
      toast.error(emailError);
      return;
    }

    try {
      await forgotPassword(email);

      toast.success(
        "Verification code sent successfully. Please check your email.",
      );

      navigate("/verify-otp", {
        state: { email },
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      description="Please enter your email address"
      leftTitle={
        <>
          Get back to
          <br />
          your account.
        </>
      }
      leftDescription="Enter the email address associated with your SynUser account and we'll help you reset your password."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* =====================================================
            EMAIL
            ===================================================== */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[#262633]"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="you@gmail.com"
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#262633] outline-none transition placeholder:text-[#9AA1A8] ${
              error
                ? "border-red-400 focus:border-red-500"
                : "border-[#D6DEE0] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#E7F3F2]"
            }`}
          />
        </div>

        {/* =====================================================
            NEXT BUTTON
            ===================================================== */}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#0F8E77] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#08705F] focus:outline-none focus:ring-2 focus:ring-[#E7F3F2] focus:ring-offset-2"
        >
          Next
        </button>
      </form>

      {/* =====================================================
          SIGN UP
          ===================================================== */}
      <p className="mt-2 text-center text-sm text-[#626975]">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-[#0F8E77] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
