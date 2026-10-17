import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, FileText, FolderKanban, Users } from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { getDashboard } from "../api/dashboard";

function getGreeting() {
  const currentTime = new Date();

  const indiaTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  }).format(currentTime);

  const hour = Number(indiaTime);

  if (hour < 12) {
    return {
      text: "Good morning",
      emoji: "🌅",
    };
  }

  if (hour < 16.5) {
    return {
      text: "Good afternoon",
      emoji: "☀️",
    };
  }

  return {
    text: "Good evening",
    emoji: "🌙",
  };
}

function parseBackendDate(value) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    typeof value === "string" && !value.endsWith("Z") ? `${value}Z` : value;

  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatUpdatedTime(value) {
  const updatedDate = parseBackendDate(value);

  if (!updatedDate) {
    return "Unknown";
  }

  const now = new Date();
  const differenceInSeconds = Math.floor(
    (now.getTime() - updatedDate.getTime()) / 1000,
  );

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours} ${differenceInHours === 1 ? "hr" : "hrs"} ago`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);

  if (differenceInDays < 7) {
    return `${differenceInDays} ${differenceInDays === 1 ? "day" : "days"} ago`;
  }

  const differenceInWeeks = Math.floor(differenceInDays / 7);

  if (differenceInWeeks < 4) {
    return `${differenceInWeeks} ${
      differenceInWeeks === 1 ? "week" : "weeks"
    } ago`;
  }

  return updatedDate.toLocaleDateString("en-IN");
}

function ResponseLineChart({ surveys = [], interviews = [] }) {
  const height = 340;
  const left = 48;
  const right = 24;
  const top = 24;
  const bottom = 48;
  const pointSpacing = 72;

  const dates = surveys.map((item) => item.date);

  // Keep the chart wide enough to scroll horizontally.
  const width = Math.max(
    600,
    left + right + Math.max(dates.length - 1, 0) * pointSpacing,
  );

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const interviewByDate = new Map(
    interviews.map((item) => [item.date, item.count]),
  );

  const alignedInterviews = dates.map((date) => ({
    date,
    count: interviewByDate.get(date) ?? 0,
  }));

  const maxValue = Math.max(
    0,
    ...surveys.map((item) => Number(item.count) || 0),
    ...alignedInterviews.map((item) => Number(item.count) || 0),
  );

  // Choose readable Y-axis intervals.
  const rawStep = Math.max(maxValue / 5, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalizedStep = rawStep / magnitude;

  const tickStep =
    (normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 5
          ? 5
          : 10) * magnitude;

  const scaleMax = Math.max(
    tickStep * 5,
    Math.ceil(maxValue / tickStep) * tickStep,
  );

  const chartStart = left - 12;

  const x = (index) =>
    dates.length > 1
      ? chartStart + (index / (dates.length - 1)) * plotWidth
      : chartStart + plotWidth / 2;

  const y = (value) => top + plotHeight - (value / scaleMax) * plotHeight;

  const makePoints = (items) =>
    items.map((item, index) => `${x(index)},${y(item.count)}`).join(" ");

  const ticks = [];
  for (let value = 0; value <= scaleMax; value += tickStep) {
    ticks.push(value);
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end gap-5 text-xs text-[#626975]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#3B9DF8]" />
          Surveys
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#20A779]" />
          Interviews
        </span>
      </div>

      <div className="flex w-full">
        {/* Fixed Y-axis */}
        <div className="z-10 shrink-0 bg-white overflow-visible">
          <svg
            width={left}
            height={height}
            viewBox={`0 0 ${left} ${height}`}
            className="block"
            aria-hidden="true"
          >
            {ticks.map((value) => (
              <g key={value}>
                <text
                  x={left - 10}
                  y={y(value) + 4}
                  fontSize="12"
                  fill="#626975"
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Scrollable chart area */}
        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden pl-0">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Historical daily survey responses and completed interviews"
            className="block"
          >
            {ticks.map((value) => (
              <line
                key={value}
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
                stroke="#E8EEF0"
                strokeWidth="1"
              />
            ))}

            {surveys.length > 1 && (
              <polyline
                points={makePoints(surveys)}
                fill="none"
                stroke="#3B9DF8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {alignedInterviews.length > 1 && (
              <polyline
                points={makePoints(alignedInterviews)}
                fill="none"
                stroke="#20A779"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {surveys.map((item, index) => (
              <g key={item.date}>
                <circle cx={x(index)} cy={y(item.count)} r="4" fill="#3B9DF8">
                  <title>
                    {`${item.date}: ${item.count} survey responses`}
                  </title>
                </circle>

                <circle
                  cx={x(index)}
                  cy={y(alignedInterviews[index].count)}
                  r="4"
                  fill="#20A779"
                >
                  <title>
                    {`${item.date}: ${alignedInterviews[index].count} completed interviews`}
                  </title>
                </circle>

                <text
                  x={x(index) + (index === 0 ? 18 : 0)}
                  y={height - 18}
                  fontSize="11"
                  fill="#626975"
                  textAnchor="middle"
                >
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "short" },
                  )}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("synuserUser");

  let username = "Researcher";

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      if (user.username) {
        username = user.username;
      }
    } catch {
      username = "Researcher";
    }
  }

  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    const loadDashboard = async (showLoading = false) => {
      if (requestInProgress) {
        return;
      }

      requestInProgress = true;

      try {
        if (showLoading && isMounted) {
          setLoading(true);
          setError("");
        }

        const data = await getDashboard();

        if (isMounted) {
          setDashboardData(data);
          setError("");
        }
      } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem("synuserAccessToken");
          localStorage.removeItem("synuserUser");
          localStorage.removeItem("synuserLoggedIn");

          if (isMounted) {
            navigate("/", { replace: true });
          }

          return;
        }

        // Keep previously loaded dashboard data visible if
        // an automatic background refresh temporarily fails.
        if (isMounted && showLoading) {
          setError(error.message || "Failed to load dashboard.");
        }
      } finally {
        requestInProgress = false;

        if (isMounted && showLoading) {
          setLoading(false);
        }
      }
    };

    // Load the dashboard immediately when the page opens.
    loadDashboard(true);

    // Refresh data every 10 seconds while the tab is visible.
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDashboard(false);
      }
    }, 10000);

    // Refresh immediately when the user returns to this tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboard(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;

      clearInterval(refreshInterval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);

  const { text: greeting, emoji } = getGreeting();

  const stats = [
    {
      label: "Total Experiments",
      value: dashboardData?.statistics?.total_experiments ?? 0,
      icon: FolderKanban,
      iconBackground: "bg-[#E7F3F2]",
      iconColor: "text-[#0F8E77]",
    },
    {
      label: "Personas Generated",
      value: dashboardData?.statistics?.personas_generated ?? 0,
      icon: Users,
      iconBackground: "bg-[#FFF3E8]",
      iconColor: "text-[#E68E52]",
    },
    {
      label: "Surveys Conducted",
      value: dashboardData?.statistics?.surveys_conducted ?? 0,
      icon: Activity,
      iconBackground: "bg-[#EAF3FF]",
      iconColor: "text-[#3B82F6]",
    },
    {
      label: "Reports Generated",
      value: dashboardData?.statistics?.reports_generated ?? 0,
      icon: FileText,
      iconBackground: "bg-[#F0EAFE]",
      iconColor: "text-[#7C3AED]",
    },
  ];

  const recentExperiments = dashboardData?.recent_experiments || [];

  const responseChart = dashboardData?.response_chart || [];
  const interviewChart = dashboardData?.interview_chart || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-[#626975]">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome */}
      <section className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#262633] sm:text-3xl">
          <div className="flex items-center">
            <span>
              {greeting}
              {emoji}, {dashboardData?.username || username}! 👋
            </span>
          </div>
        </h1>

        <p className="mt-1.5 text-sm text-[#626975]">
          Here's what's happening with your research.
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBackground}`}
                >
                  <Icon
                    className={`h-5 w-5 ${stat.iconColor}`}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="text-2xl font-bold text-[#262633]">
                    {stat.value}
                  </p>

                  <p className="mt-0.5 text-xs text-[#626975]">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Lower Dashboard */}
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* Recent Experiments */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#262633]">
              Recent Experiments
            </h2>

            <p className="mt-1 text-xs text-[#8A9299]">
              Your latest research activity
            </p>
          </div>

          <div className="max-h-[340px] space-y-2 overflow-y-auto overscroll-contain pr-2">
            {recentExperiments.length === 0 ? (
              <div className="rounded-xl bg-[#F8FAFA] px-4 py-8 text-center">
                <p className="text-sm text-[#8A9299]">No experiments yet.</p>
              </div>
            ) : (
              recentExperiments.map((experiment) => (
                <div
                  key={experiment.id}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-[#F8FAFA]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#262633]">
                      {experiment.name}
                    </p>

                    <p className="mt-1 text-xs text-[#8A9299]">
                      Updated {formatUpdatedTime(experiment.updated_at)}
                    </p>
                  </div>

                  <span
                    className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      experiment.status === "In Progress"
                        ? "bg-[#EAF7FF] text-[#3193C8]"
                        : experiment.status === "Completed"
                          ? "bg-[#E7F6F1] text-[#0F8E77]"
                          : "bg-[#FFF2DF] text-[#E58A20]"
                    }`}
                  >
                    {experiment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Responses Overview */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#262633]">
              Responses Overview
            </h2>

            <p className="mt-1 text-xs text-[#8A9299]">
              Survey and interview responses
            </p>
          </div>

          <ResponseLineChart
            surveys={responseChart}
            interviews={interviewChart}
          />
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;
