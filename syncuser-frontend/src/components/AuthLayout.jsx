function AuthLayout({
  title,
  description,
  children,
  leftTitle,
  leftDescription,
  compactLogoSpacing = false,
}) {
  return (
    <div className="h-screen w-full overflow-hidden bg-white">
      <div className="grid h-full w-full md:grid-cols-2">
        {/* =========================
            LEFT SECTION
        ========================== */}
        <div className="hidden h-full bg-[#E7F3F2] px-8 py-8 md:flex md:flex-col lg:px-12 lg:py-10">
          <div>
            {/* SynUser Logo */}
            <div className="mb-6 flex h-22 w-22 items-center justify-center">
              <img
                src="/synuser-logo.png"
                alt="SynUser logo"
                className="h-22 w-22 object-contain"
              />
            </div>

            {/* Left Heading */}
            <h1 className="max-w-md text-3xl font-bold leading-tight text-[#262633] lg:text-4xl">
              {leftTitle}
            </h1>

            {/* Left Description */}
            <p className="mt-4 max-w-md text-sm leading-6 text-[#626975] lg:text-base">
              {leftDescription}
            </p>
          </div>

          {/* =========================
              RESEARCH ILLUSTRATION
          ========================== */}
          <div className="mt-auto flex justify-center pb-4">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/70 lg:h-48 lg:w-48">
              <div className="text-center">
                <div className="text-5xl">🔬</div>

                <p className="mt-2 text-xs font-medium text-[#0F8E77]">
                  Research smarter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            RIGHT SECTION
        ========================== */}
        <div className="flex h-full items-center justify-center bg-white px-7 py-4 sm:px-10 sm:py-6 lg:px-16">
          <div className="w-full max-w-md">
            {/* SynUser Logo */}
            <div
              className={`flex h-20 w-20 items-center justify-center ${
                compactLogoSpacing ? "mb-3" : "mb-5"
              }`}
            >
              <img
                src="/synuser-logo.png"
                alt="SynUser logo"
                className="h-20 w-20 object-contain"
              />
            </div>

            {/* Page Heading */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[#262633] sm:text-3xl">
                {title}
              </h2>

              <p className="mt-1.5 text-sm leading-5 text-[#626975]">
                {description}
              </p>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
