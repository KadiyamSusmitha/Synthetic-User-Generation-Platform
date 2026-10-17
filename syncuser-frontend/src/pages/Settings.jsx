import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import {
  getCurrentUser,
  getLoginActivity,
  updateCurrentUser,
} from "../api/auth";
import { toast } from "react-toastify";

function Settings() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");

  /* ----------------------------- Language ----------------------------- */
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("English");

  const languageRef = useRef(null);

  /* -------------------------- Login Activity -------------------------- */
  const [loginActivityOpen, setLoginActivityOpen] = useState(false);
  const [loginActivities, setLoginActivities] = useState([]);
  const [loadingLoginActivity, setLoadingLoginActivity] = useState(false);
  const [loginActivityError, setLoginActivityError] = useState("");

  /* ---------------------------- Edit Profile -------------------------- */
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  /* ----------------------- Email Notifications ------------------------ */
  const [emailNotifications, setEmailNotifications] = useState(true);

  /* -------------------------------------------------------------------- */
  /* Load current authenticated user                                      */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    async function loadCurrentUser() {
      const accessToken = localStorage.getItem("synuserAccessToken");

      if (!accessToken) {
        const message = "Unable to load your account information.";

        setUserError(message);
        setLoadingUser(false);

        toast.error(message);

        return;
      }

      try {
        const currentUser = await getCurrentUser(accessToken);
        setUser(currentUser);
      } catch (error) {
        const message =
          error?.message || "Failed to load your account information.";

        setUserError(message);

        toast.error(message);
      } finally {
        setLoadingUser(false);
      }
    }

    loadCurrentUser();
  }, []);

  /* -------------------------------------------------------------------- */
  /* Close language dropdown when clicking outside                        */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    function handleOutsideClick(event) {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* -------------------------------------------------------------------- */
  /* Login time formatting                                                */
  /* -------------------------------------------------------------------- */

  function formatLoginTime(value) {
    if (!value) {
      return "—";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "—";
      }

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  }

  /* -------------------------------------------------------------------- */
  /* Open Edit Profile                                                    */
  /* -------------------------------------------------------------------- */

  function handleEditProfileClick() {
    setEditUsername(user?.username || "");
    setProfileError("");
    setEditProfileOpen(true);
  }

  /* -------------------------------------------------------------------- */
  /* Close Edit Profile                                                   */
  /* -------------------------------------------------------------------- */

  function closeEditProfile() {
    if (savingProfile) {
      return;
    }

    setEditProfileOpen(false);
    setProfileError("");
  }

  /* -------------------------------------------------------------------- */
  /* Save Username                                                         */
  /* -------------------------------------------------------------------- */

  async function handleSaveProfile() {
    const accessToken = localStorage.getItem("synuserAccessToken");

    if (!accessToken) {
      const message = "Unable to update your profile.";

      setProfileError(message);
      toast.error(message);

      return;
    }

    const trimmedUsername = editUsername.trim();

    if (!trimmedUsername) {
      const message = "Username cannot be empty.";

      setProfileError(message);
      toast.error(message);

      return;
    }

    if (trimmedUsername.length > 50) {
      const message = "Username must be 50 characters or less.";

      setProfileError(message);
      toast.error(message);

      return;
    }

    setSavingProfile(true);
    setProfileError("");

    try {
      const updatedUser = await updateCurrentUser(
        accessToken,
        trimmedUsername,
      );

      /*
       * Update Settings immediately with the backend response.
       */
      setUser(updatedUser);

      /*
       * Keep the existing frontend user information synchronized.
       */
      const storedUser = localStorage.getItem("synuserUser");

      let currentStoredUser = {};

      try {
        currentStoredUser = storedUser ? JSON.parse(storedUser) : {};
      } catch {
        currentStoredUser = {};
      }

      const updatedStoredUser = {
        ...currentStoredUser,
        username: updatedUser.username,
        email: updatedUser.email,
      };

      localStorage.setItem(
        "synuserUser",
        JSON.stringify(updatedStoredUser),
      );

      /*
       * Notify other already-open UI components such as TopBar
       * and Dashboard that the authenticated user's information
       * has changed.
       *
       * We will connect their listeners in their respective files.
       */
      window.dispatchEvent(
        new CustomEvent("userUpdated", {
          detail: updatedUser,
        }),
      );

      setEditProfileOpen(false);

      /*
       * Show success notification only after the profile
       * has been successfully updated and synchronized.
       */
      toast.success("Username updated successfully.");
    } catch (error) {
      const message =
        error?.message || "Failed to update your username.";

      setProfileError(message);
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  /* -------------------------------------------------------------------- */
  /* Login Activity                                                        */
  /* -------------------------------------------------------------------- */

  async function handleLoginActivityClick() {
    setLoginActivityOpen(true);
    setLoginActivityError("");
    setLoadingLoginActivity(true);

    const accessToken = localStorage.getItem("synuserAccessToken");

    if (!accessToken) {
      const message = "Unable to load your login activity.";

      setLoginActivityError(message);
      setLoadingLoginActivity(false);

      toast.error(message);

      return;
    }

    try {
      const activities = await getLoginActivity(accessToken);

      setLoginActivities(Array.isArray(activities) ? activities : []);
    } catch (error) {
      const message =
        error?.message || "Failed to load login activity.";

      setLoginActivityError(message);

      toast.error(message);
    } finally {
      setLoadingLoginActivity(false);
    }
  }

  function closeLoginActivity() {
    setLoginActivityOpen(false);
  }

  /* -------------------------------------------------------------------- */
  /* Derived user information                                              */
  /* -------------------------------------------------------------------- */

  const fullName = user?.username || "User";
  const email = user?.email || "—";
  const avatarLetter = fullName.trim().charAt(0).toUpperCase() || "U";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#262633]">Settings</h1>

          <p className="mt-1 text-sm text-[#626975]">
            Manage your account and application preferences.
          </p>
        </div>

        <div className="space-y-5">
          {/* ============================================================ */}
          {/* Profile Information                                           */}
          {/* ============================================================ */}

          <section className="rounded-xl border border-[#E5E8EB] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EEF0F2] px-6 py-4">
              <div>
                <h1 className="text-xl font-bold text-[#263238]">
                  Profile Information
                </h1>

                <p className="mt-1 text-[12.5px] text-[#8A939D]">
                  View and manage your account information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleEditProfileClick}
                disabled={loadingUser || !!userError}
                className="rounded-md border border-[#49C5B6] px-4 py-2 text-xs font-semibold text-[#159C8E] transition hover:bg-[#EAF8F5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Edit Profile
              </button>
            </div>

            <div className="px-6 py-6">
              {loadingUser ? (
                <div className="py-8 text-center text-sm text-[#8A939D]">
                  Loading account information...
                </div>
              ) : userError ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {userError}
                </div>
              ) : (
                <>
                  {/* User Summary */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF7F3] text-lg font-semibold text-[#159C8E]">
                      {avatarLetter}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#263238]">
                        {fullName}
                      </h3>

                      <p className="mt-1 text-xs text-[#626975]">
                        {email}
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-[#EAF7F3] px-2.5 py-1 text-[11px] font-medium text-[#159C8E]">
                        Researcher
                      </span>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="mt-6 grid grid-cols-1 gap-5 border-t border-[#EEF0F2] pt-5 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium text-[#8A939D]">
                        Username
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#39424E]">
                        {fullName}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-[#8A939D]">
                        Email Address
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#39424E]">
                        {email}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-[#8A939D]">
                        Role
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#39424E]">
                        Researcher
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ============================================================ */}
          {/* Account Security                                              */}
          {/* ============================================================ */}

          <section className="rounded-xl border border-[#E5E8EB] bg-white shadow-sm">
            <div className="border-b border-[#EEF0F2] px-6 py-4">
              <h1 className="text-xl font-bold text-[#263238]">
                Account Security
              </h1>

              <p className="mt-1 text-[12.5px] text-[#8A939D]">
                Manage your account security settings.
              </p>
            </div>

            <div className="divide-y divide-[#EEF0F2]">
              {/* Two-Factor Authentication */}
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-[#FAFCFC]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF7F3]">
                    <ShieldCheck className="h-4 w-4 text-[#159C8E]" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#39424E]">
                      Two-Factor Authentication
                    </p>

                    <p className="mt-0.5 text-xs text-[#8A939D]">
                      Add an extra layer of security
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#9AA2AA]" />
              </button>

              {/* Login Activity */}
              <button
                type="button"
                onClick={handleLoginActivityClick}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-[#FAFCFC]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF7F3]">
                    <Clock3 className="h-4 w-4 text-[#159C8E]" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#39424E]">
                      Login Activity
                    </p>

                    <p className="mt-0.5 text-xs text-[#8A939D]">
                      View your recent login activity
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#9AA2AA]" />
              </button>
            </div>
          </section>

          {/* ============================================================ */}
          {/* Preferences                                                   */}
          {/* ============================================================ */}

          <section className="rounded-xl border border-[#E5E8EB] bg-white shadow-sm">
            <div className="border-b border-[#EEF0F2] px-6 py-4">
              <h1 className="text-xl font-bold text-[#263238]">
                Preferences
              </h1>

              <p className="mt-1 text-[12.5px] text-[#8A939D]">
                Customize your application preferences.
              </p>
            </div>

            <div className="px-6 py-5">
              {/* ======================================================== */}
              {/* Theme                                                     */}
              {/* ======================================================== */}

              <div className="flex flex-col gap-3 border-b border-[#EEF0F2] pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#39424E]">
                    Theme
                  </p>

                  <p className="mt-0.5 text-xs text-[#8A939D]">
                    Choose your preferred appearance
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[#39424E]">
                    <input
                      type="radio"
                      name="theme"
                      defaultChecked
                      className="h-3.5 w-3.5 accent-[#159C8E]"
                    />

                    <Sun className="h-3.5 w-3.5 text-[#159C8E]" />

                    Light
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[#626975]">
                    <input
                      type="radio"
                      name="theme"
                      className="h-3.5 w-3.5 accent-[#159C8E]"
                    />

                    <Moon className="h-3.5 w-3.5 text-[#8A939D]" />

                    Dark
                  </label>
                </div>
              </div>

              {/* ======================================================== */}
              {/* Language                                                  */}
              {/* ======================================================== */}

              <div className="flex flex-col gap-3 border-b border-[#EEF0F2] py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#39424E]">
                    Language
                  </p>

                  <p className="mt-0.5 text-xs text-[#8A939D]">
                    Select your preferred language
                  </p>
                </div>

                {/* Screenshot-style custom dropdown */}
                <div ref={languageRef} className="relative w-full md:w-40">
                  <button
                    type="button"
                    onClick={() => setLanguageOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#49C5B6] bg-white px-4 py-2.5 text-sm font-medium text-[#4B5358] outline-none transition hover:bg-[#FAFCFC] focus:ring-2 focus:ring-[#D8F4EF]"
                  >
                    <span>{language}</span>

                    <ChevronDown
                      className={`h-4 w-4 text-[#7F888C] transition-transform ${
                        languageOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {languageOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E5E8EB] bg-white p-2 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setLanguage("English");
                          setLanguageOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                          language === "English"
                            ? "bg-[#159C8E] text-white"
                            : "text-[#39424E] hover:bg-[#EAF8F5] hover:text-[#159C8E]"
                        }`}
                      >
                        <span>English</span>

                        {language === "English" && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* Email Notifications                                      */}
              {/* ======================================================== */}

              <div className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF7F3]">
                    <Bell className="h-4 w-4 text-[#159C8E]" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#39424E]">
                      Email Notifications
                    </p>

                    <p className="mt-0.5 text-xs text-[#8A939D]">
                      Receive updates and important notifications
                    </p>
                  </div>
                </div>

                {/* Actual sliding toggle */}
                <label className="relative inline-flex h-5 w-10 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(event) => {
                      const enabled = event.target.checked;

                      setEmailNotifications(enabled);

                      if (enabled) {
                        toast.success("Email notifications enabled.");
                      } else {
                        toast.success("Email notifications disabled.");
                      }
                    }}
                    className="peer sr-only"
                  />

                  {/* Toggle track */}
                  <span className="absolute inset-0 rounded-full bg-[#D8DEE3] transition-colors duration-200 peer-checked:bg-[#159C8E] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#BDEDE5]" />

                  {/* Toggle knob */}
                  <span className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Edit Profile Modal                                                */}
      {/* ================================================================= */}

      {editProfileOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingProfile) {
              closeEditProfile();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E5E8EB] bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EEF0F2] px-6 py-4">
              <div>
                <h2
                  id="edit-profile-title"
                  className="text-lg font-bold text-[#263238]"
                >
                  Edit Profile
                </h2>

                <p className="mt-1 text-xs text-[#8A939D]">
                  Update your username.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={savingProfile}
                aria-label="Close edit profile"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A939D] transition hover:bg-[#EAF8F5] hover:text-[#159C8E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="edit-username"
                  className="text-xs font-semibold text-[#39424E]"
                >
                  Username
                </label>

                <input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(event) => setEditUsername(event.target.value)}
                  maxLength={50}
                  disabled={savingProfile}
                  autoFocus
                  className="mt-2 w-full rounded-lg border border-[#D9E1E5] bg-white px-3 py-2.5 text-sm text-[#39424E] outline-none transition placeholder:text-[#A1A9AF] focus:border-[#49C5B6] focus:ring-2 focus:ring-[#D8F4EF] disabled:bg-[#F7F9FA]"
                  placeholder="Enter username"
                />

                <p className="mt-1.5 text-[11px] text-[#8A939D]">
                  Maximum 50 characters.
                </p>
              </div>

              {/* Email - Read Only */}
              <div className="mt-5">
                <label
                  htmlFor="edit-email"
                  className="text-xs font-semibold text-[#39424E]"
                >
                  Email Address
                </label>

                <input
                  id="edit-email"
                  type="email"
                  value={email}
                  readOnly
                  className="mt-2 w-full cursor-not-allowed rounded-lg border border-[#E5E8EB] bg-[#F7F9FA] px-3 py-2.5 text-sm text-[#626975] outline-none"
                />

                <p className="mt-1.5 text-[11px] text-[#8A939D]">
                  Email address cannot be changed.
                </p>
              </div>

              {/* Error */}
              {profileError && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  {profileError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-[#EEF0F2] px-6 py-4">
              <button
                type="button"
                onClick={closeEditProfile}
                disabled={savingProfile}
                className="rounded-lg border border-[#D9E1E5] px-4 py-2 text-xs font-semibold text-[#626975] transition hover:bg-[#F7F9FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-lg bg-[#159C8E] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#11897D] focus:outline-none focus:ring-2 focus:ring-[#BDEDE5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Login Activity Modal                                              */}
      {/* ================================================================= */}

      {loginActivityOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-activity-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLoginActivity();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E8EB] bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EEF0F2] px-6 py-4">
              <div>
                <h2
                  id="login-activity-title"
                  className="text-lg font-bold text-[#263238]"
                >
                  Login Activity
                </h2>

                <p className="mt-1 text-xs text-[#8A939D]">
                  Your most recent account login activity.
                </p>
              </div>

              <button
                type="button"
                onClick={closeLoginActivity}
                aria-label="Close login activity"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A939D] transition hover:bg-[#EAF8F5] hover:text-[#159C8E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[420px] overflow-y-auto px-6 py-5">
              {loadingLoginActivity ? (
                <div className="py-10 text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#D8F4EF] border-t-[#159C8E]" />

                  <p className="mt-3 text-sm text-[#8A939D]">
                    Loading login activity...
                  </p>
                </div>
              ) : loginActivityError ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginActivityError}
                </div>
              ) : loginActivities.length === 0 ? (
                <div className="rounded-lg border border-[#EEF0F2] bg-[#FAFCFC] px-4 py-8 text-center">
                  <Clock3 className="mx-auto h-7 w-7 text-[#9AA2AA]" />

                  <p className="mt-3 text-sm font-medium text-[#39424E]">
                    No login activity found
                  </p>

                  <p className="mt-1 text-xs text-[#8A939D]">
                    Your recent login activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loginActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 rounded-xl border border-[#EEF0F2] bg-[#FAFCFC] px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF7F3]">
                        <Clock3 className="h-4 w-4 text-[#159C8E]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#39424E]">
                            Successful login
                          </p>

                          {index === 0 && (
                            <span className="rounded-full bg-[#EAF8F5] px-2 py-0.5 text-[10px] font-semibold text-[#159C8E]">
                              Latest
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-[#8A939D]">
                          {formatLoginTime(activity.login_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-[#EEF0F2] px-6 py-4">
              <button
                type="button"
                onClick={closeLoginActivity}
                className="rounded-lg bg-[#159C8E] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#11897D] focus:outline-none focus:ring-2 focus:ring-[#BDEDE5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Settings;
