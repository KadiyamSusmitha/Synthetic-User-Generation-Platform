function EyeIcon({ visible }) {
  return visible ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12s3.75-6 9.75-6 9.75 6 9.75 6-3.75 6-9.75 6-9.75-6-9.75-6Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 3 18 18"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.58 10.58a2 2 0 0 0 2.84 2.84"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.88 5.09A9.9 9.9 0 0 1 12 4.86c6 0 9.75 7.14 9.75 7.14a17.5 17.5 0 0 1-3.17 3.96"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.61 6.61C4.29 8.2 2.25 12 2.25 12s3.75 6 9.75 6c1.48 0 2.82-.34 4-.86"
      />
    </svg>
  )
}

function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  showPassword,
  setShowPassword,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-[#D6DEE0] bg-white px-4 py-1.5 pr-12 text-sm text-[#262633] outline-none transition placeholder:text-[#9AA1A8] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#E7F3F2]"
      />

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626975] transition hover:text-[#0F8E77]"
        aria-label={
          showPassword ? 'Hide password' : 'Show password'
        }
      >
        <EyeIcon visible={showPassword} />
      </button>
    </div>
  )
}

export default PasswordInput