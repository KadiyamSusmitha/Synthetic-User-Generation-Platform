import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'

import { validatePassword } from '../utils/validation'
import { resetPassword } from '../api/auth'

function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const resetToken = location.state?.resetToken || ''

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const passwordError = validatePassword(
      formData.password
    )

    const confirmPasswordValidationError =
      validatePassword(formData.confirmPassword)

    const confirmPasswordError =
      confirmPasswordValidationError ||
      (formData.password !== formData.confirmPassword
        ? 'Passwords do not match.'
        : '')

    // Show only the first validation error
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (confirmPasswordError) {
      toast.error(confirmPasswordError)
      return
    }

    if (!resetToken) {
      toast.error(
        'Your password reset session is invalid or expired.'
      )
      navigate('/forgot-password')
      return
    }

    try {
      await resetPassword(
        resetToken,
        formData.password
      )

      toast.success(
        'Password reset successfully. You can now log in with your new password.'
      )

      navigate('/')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Set your new password"
      leftTitle={
        <>
          Create a new
          <br />
          secure password.
        </>
      }
      leftDescription="Choose a new password for your SynUser account and continue securely."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[#262633]"
          >
            New password
          </label>

          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-[#262633]"
          >
            Confirm password
          </label>

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
          />
        </div>

        {/* Reset Password */}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#0F8E77] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#08705F] focus:outline-none focus:ring-2 focus:ring-[#E7F3F2] focus:ring-offset-2"
        >
          Reset Password
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#626975]">
        Remember your password?{' '}
        <Link
          to="/"
          className="font-semibold text-[#0F8E77] hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ResetPassword