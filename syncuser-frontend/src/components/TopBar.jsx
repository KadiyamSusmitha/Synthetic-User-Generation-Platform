import { Bell, Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const searchablePages = [
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "Experiments",
    path: "/experiments",
  },
  {
    name: "Personas",
    path: "/personas",
  },
  {
    name: "Surveys",
    path: "/surveys",
  },
  {
    name: "Interviews",
    path: "/interviews",
  },
  {
    name: "Insights",
    path: "/insights",
  },
  {
    name: "Reports",
    path: "/reports",
  },
  {
    name: "Settings",
    path: "/settings",
  },
];

function TopBar() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(() => {
    const storedUser = localStorage.getItem("synuserUser");

    if (!storedUser) {
      return "User";
    }

    try {
      const user = JSON.parse(storedUser);

      return user.username || "User";
    } catch {
      return "User";
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  /*
   * Load the latest username from the backend.
   *
   * This is important because the username can also be changed
   * directly through Swagger. In that case, synuserUser in
   * localStorage may still contain the old username.
   */
  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem("synuserAccessToken");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const currentUser = await response.json();

        if (currentUser?.username) {
          setUsername(currentUser.username);

          /*
           * Keep localStorage synchronized with the backend.
           * This also makes the username consistent across
           * Dashboard, Settings, and TopBar.
           */
          const storedUser = localStorage.getItem("synuserUser");

          let updatedUser = {};

          if (storedUser) {
            try {
              updatedUser = JSON.parse(storedUser);
            } catch {
              updatedUser = {};
            }
          }

          const newUser = {
            ...updatedUser,
            ...currentUser,
            username: currentUser.username,
          };

          localStorage.setItem("synuserUser", JSON.stringify(newUser));

          /*
           * Notify other components that the user information
           * has been synchronized.
           */
          window.dispatchEvent(new Event("userUpdated"));
        }
      } catch {
        // Keep the existing local username if the API request fails.
      }
    };

    loadCurrentUser();
  }, []);

  /*
   * Listen for username changes made from the frontend.
   *
   * Settings.jsx dispatches "userUpdated" after successfully
   * changing the username.
   */
  useEffect(() => {
    const handleUserUpdated = () => {
      const storedUser = localStorage.getItem("synuserUser");

      if (!storedUser) {
        setUsername("User");
        return;
      }

      try {
        const user = JSON.parse(storedUser);

        setUsername(user.username || "User");
      } catch {
        setUsername("User");
      }
    };

    window.addEventListener("userUpdated", handleUserUpdated);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const firstLetter = username
    ? username.charAt(0).toUpperCase()
    : "U";

  const filteredPages = searchablePages.filter((page) =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const firstResult = filteredPages[0];

    if (firstResult) {
      navigate(firstResult.path);
      setSearchTerm("");
      setShowResults(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("synuserLoggedIn");
    localStorage.removeItem("synuserAccessToken");
    localStorage.removeItem("synuserUser");

    setShowMenu(false);

    navigate("/");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-[72px] bg-white lg:left-52">
      {/* TopBar Content */}
      <div className="flex h-full items-center justify-between px-5 sm:px-7 lg:px-8">
        {/* Search */}
        <div className="relative w-full max-w-md lg:-ml-8">
          <div className="flex items-center gap-3 rounded-xl bg-[#F7F9F9] px-4 py-2.5">
            <Search
              className="h-[18px] w-[18px] shrink-0 text-[#8A9299]"
              strokeWidth={1.8}
            />

            <input
              id="global-search"
              name="global-search"
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm text-[#262633] outline-none placeholder:text-[#9AA1A8]"
            />
          </div>

          {/* Search Results */}
          {showResults && searchTerm && (
            <div className="absolute left-0 top-14 z-50 w-full rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
              {filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <button
                    key={page.path}
                    type="button"
                    onClick={() => {
                      navigate(page.path);
                      setSearchTerm("");
                      setShowResults(false);
                    }}
                    className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                  >
                    {page.name}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2.5 text-sm text-[#8A9299]">
                  No matching pages found.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="ml-6 flex items-center gap-4">
          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((previous) => !previous);
                setShowMenu(false);
              }}
              className="relative rounded-lg p-2 text-[#626975] transition hover:bg-[#F5F8F8] hover:text-[#0F8E77]"
              aria-label="Notifications"
            >
              <Bell
                className="h-[19px] w-[19px]"
                strokeWidth={1.8}
              />

              {/* Notification Indicator */}
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#E84C4C]" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#262633]">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-xs text-[#8A9299]">
                      Recent activity
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="rounded-lg p-1.5 text-[#8A9299] transition hover:bg-[#F5F8F8] hover:text-[#0F8E77]"
                    aria-label="Close notifications"
                  >
                    <Check
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </button>
                </div>

                <div className="px-4 pb-4">
                  <div className="rounded-xl bg-[#F7F9F9] p-3">
                    <p className="text-sm font-medium text-[#262633]">
                      Welcome to SynUser!
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#626975]">
                      Your workspace is ready. Start by creating your
                      first experiment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMenu((previous) => !previous);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#F5F8F8]"
            >
              {/* First Letter Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F3F2] text-sm font-semibold text-[#0F8E77]">
                {firstLetter}
              </div>

              {/* User Details */}
              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-sm font-semibold text-[#262633]">
                  {username}
                </p>

                <p className="text-xs text-[#8A9299]">
                  Researcher
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-[#8A9299] transition sm:block ${
                  showMenu ? "rotate-180" : ""
                }`}
                strokeWidth={1.8}
              />
            </button>

            {/* User Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-14 z-50 w-44 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#626975] transition hover:bg-red-50 hover:text-red-500"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;