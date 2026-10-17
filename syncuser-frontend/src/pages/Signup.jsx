import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

import {
  validateUsername,
  validateEmail,
  validatePassword,
} from "../utils/validation";

import { registerUser } from "../api/auth";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const usernameError = validateUsername(formData.username);

    const emailError = validateEmail(formData.email);

    const passwordError = validatePassword(formData.password);

    const confirmPasswordError = !formData.confirmPassword
      ? "Please confirm your password."
      : validatePassword(formData.confirmPassword) ||
        (formData.password !== formData.confirmPassword
          ? "Passwords do not match."
          : "");

    setErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    // Show only the first validation error
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    if (emailError) {
      toast.error(emailError);
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (confirmPasswordError) {
      toast.error(confirmPasswordError);
      return;
    }

    // Real registration API will be connected later.
    try {
      const data = await registerUser(
        formData.username,
        formData.email,
        formData.password,
      );

      localStorage.setItem(
        "synuserUser",
        JSON.stringify({
          username: data.username,
          email: data.email,
        }),
      );

      toast.success("Account created successfully. Welcome to SynUser!");

      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Sign up to start using SynUser"
      compactLogoSpacing
      leftTitle={
        <>
          Start your
          <br />
          research journey.
        </>
      }
      leftDescription="Create your SynUser account and start understanding your users with AI-powered synthetic research."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* =====================================================
            USERNAME
            ===================================================== */}
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-[#262633]"
          >
            Username
          </label>

          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            className={`w-full rounded-lg border bg-white px-4 py-1.5 text-sm text-[#262633] outline-none transition placeholder:text-[#9AA1A8] ${
              errors.username
                ? "border-red-400 focus:border-red-500"
                : "border-[#D6DEE0] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#E7F3F2]"
            }`}
          />
        </div>

        {/* =====================================================
            EMAIL
            ===================================================== */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-[#262633]"
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
            className="mb-1 block text-sm font-medium text-[#262633]"
          >
            Password
          </label>

          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>

        {/* =====================================================
            CONFIRM PASSWORD
            ===================================================== */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-[#262633]"
          >
            Confirm password
          </label>

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
          />
        </div>

        {/* =====================================================
            SIGN UP BUTTON
            ===================================================== */}
        <button
          type="submit"
          className="mt-2.5 w-full rounded-lg bg-[#0F8E77] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#08705F] focus:outline-none focus:ring-2 focus:ring-[#E7F3F2] focus:ring-offset-2"
        >
          Sign up
        </button>
      </form>

      {/* =====================================================
          LOGIN
          ===================================================== */}
      <p className="mt-2 text-center text-sm text-[#626975]">
        Already have an account?{" "}
        <Link to="/" className="font-semibold text-[#0F8E77] hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Signup;
