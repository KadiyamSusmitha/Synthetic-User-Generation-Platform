import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

import { validateEmail, validatePassword } from "../utils/validation";

import { loginUser, getCurrentUser } from "../api/auth";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    // Show only the first validation error
    if (emailError) {
      toast.error(emailError);
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    try {
      const data = await loginUser(formData.email, formData.password);

      localStorage.setItem("synuserAccessToken", data.access_token);

      const currentUser = await getCurrentUser(data.access_token);

      localStorage.setItem(
        "synuserUser",
        JSON.stringify({
          username: currentUser.username,
          email: currentUser.email,
        }),
      );

      localStorage.setItem("synuserLoggedIn", "true");

      toast.success("Login successful. Welcome back!");

      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Login to your SynUser account"
      leftTitle={
        <>
          Understand users.
          <br />
          Design better.
          <br />
          Build with confidence.
        </>
      }
      leftDescription="AI-powered synthetic user research for smarter product decisions."
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
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@gmail.com"
            className={`w-full rounded-lg border bg-white px-4 py-1.5 text-sm text-[#262633] outline-none transition placeholder:text-[#9AA1A8] ${
              errors.email
                ? "border-red-400 focus:border-red-500"
                : "border-[#D6DEE0] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#E7F3F2]"
            }`}
          />
        </div>

        {/* =====================================================
            PASSWORD
            ===================================================== */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[#262633]"
          >
            Password
          </label>

          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          {/* Forgot Password */}
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#0F8E77] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* =====================================================
            LOGIN BUTTON
            ===================================================== */}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#0F8E77] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#08705F] focus:outline-none focus:ring-2 focus:ring-[#E7F3F2] focus:ring-offset-2"
        >
          Login
        </button>
      </form>

      {/* =====================================================
          SIGN UP
          ===================================================== */}
      <p className="mt-5 text-center text-sm text-[#626975]">
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

export default Login;
