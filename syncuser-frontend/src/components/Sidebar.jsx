import {
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  Lightbulb,
  Settings,
  Users,
  Video,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Gauge,
  },
  {
    name: "Experiments",
    path: "/experiments",
    icon: FolderKanban,
  },
  {
    name: "Personas",
    path: "/personas",
    icon: Users,
  },
  {
    name: "Surveys",
    path: "/surveys",
    icon: ClipboardList,
  },
  {
    name: "Interviews",
    path: "/interviews",
    icon: Video,
  },
  {
    name: "Insights",
    path: "/insights",
    icon: Lightbulb,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-52 shrink-0 bg-white lg:block">

      <div className="flex h-full flex-col px-3 py-6">

        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 px-2">

          <img
            src="/synuser-logo.png"
            alt="SynUser logo"
            className="h-9 w-9 shrink-0 object-contain"
          />

          <span className="text-lg font-bold text-[#262633]">
            Synthetic User
          </span>

        </div>

        {/* Workspace */}
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[#8A9299]">
          Workspace
        </p>

        {/* Navigation */}
        <nav className="space-y-1">

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                    isActive
                      ? "bg-[#E7F3F2] text-[#0F8E77]"
                      : "text-[#626975] hover:bg-[#F5F8F8] hover:text-[#262633]"
                  }`
                }
              >
                <Icon
                  className="h-[19px] w-[19px] shrink-0"
                  strokeWidth={1.8}
                />

                <span>{item.name}</span>
              </NavLink>
            );
          })}

        </nav>

      </div>
    </aside>
  );
}

export default Sidebar;