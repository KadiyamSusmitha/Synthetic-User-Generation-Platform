import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";

const API_BASE_URL = "http://127.0.0.1:8000";

function Dropdown({ value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ||
    options[0];

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-[40px] w-full items-center justify-between rounded-[12px] border bg-white px-3 text-left text-[14px] font-medium text-[#4F5A61] outline-none transition ${
          open
            ? "border-[#0F8E77] ring-2 ring-[#0F8E77]/10"
            : "border-[#DCE5E3] hover:border-[#0F8E77]"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="whitespace-nowrap">
          {selectedOption?.label || "Select"}
        </span>

        <svg
          className={`h-5 w-5 text-[#7A838B] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[56px] z-[100] w-full overflow-hidden rounded-[12px] border border-[#E1E8E6] bg-white p-1 shadow-[0_10px_24px_rgba(38,38,51,0.12)]">
          <div role="listbox" className="max-h-52 overflow-y-auto">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-[40px] w-full items-center justify-between rounded-[9px] px-3 text-left text-[14px] font-medium transition ${
                    isSelected
                      ? "bg-[#0F8E77] text-white"
                      : "text-[#4F5A61] hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                  }`}
                >
                  <span className="whitespace-nowrap">{option.label}</span>

                  {isSelected && (
                    <svg
                      className="h-5 w-5 shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M4.5 10.5L8 14L15.5 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getTrendItems(analytics) {
  if (!analytics?.trends?.data) {
    return [];
  }

  return Array.isArray(analytics.trends.data) ? analytics.trends.data : [];
}

function getTrendDate(item) {
  return item?.date || null;
}

function getTrendCount(item) {
  if (typeof item?.synthetic === "number") {
    return item.synthetic;
  }

  if (typeof item?.total === "number") {
    return item.total;
  }

  return 0;
}

function isWithinDuration(dateValue, duration) {
  if (duration === "all") {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const cutoff = new Date(now);

  if (duration === "7") {
    cutoff.setDate(now.getDate() - 7);
  }

  if (duration === "30") {
    cutoff.setDate(now.getDate() - 30);
  }

  if (duration === "90") {
    cutoff.setDate(now.getDate() - 90);
  }

  return date >= cutoff && date <= now;
}

function mergeAnalytics(results) {
  const validResults = results.filter(Boolean);

  if (!validResults.length) {
    return null;
  }

  const syntheticResponses = validResults.reduce(
    (total, item) => total + (Number(item.summary?.synthetic_responses) || 0),
    0,
  );

  const questionAnalytics = validResults.flatMap(
    (item) => item.question_analytics || [],
  );

  const personaPatterns = validResults.flatMap(
    (item) => item.persona_patterns || [],
  );

  const commonAnswers = validResults.flatMap(
    (item) => item.common_answers || [],
  );

  const trendItems = validResults.flatMap((item) => getTrendItems(item));

  const metricsList = validResults
    .map((item) => item.overview_metrics)
    .filter(Boolean);

  const totalResponses = metricsList.reduce(
    (total, metrics) => total + (Number(metrics.total_responses) || 0),
    0,
  );

  const totalSatisfactionWeight = metricsList.reduce((total, metrics) => {
    const score = Number(metrics.satisfaction_score);
    const count = Number(metrics.satisfaction_valid_answer_count);

    if (
      metrics.satisfaction_score == null ||
      !Number.isFinite(score) ||
      !Number.isFinite(count) ||
      count <= 0
    ) {
      return total;
    }

    return total + score * count;
  }, 0);

  const satisfactionValidAnswerCount = metricsList.reduce((total, metrics) => {
    const score = Number(metrics.satisfaction_score);
    const count = Number(metrics.satisfaction_valid_answer_count);

    if (
      metrics.satisfaction_score == null ||
      !Number.isFinite(score) ||
      !Number.isFinite(count) ||
      count <= 0
    ) {
      return total;
    }

    return total + count;
  }, 0);

  const overviewMetrics = {
    total_responses: totalResponses,

    engagement_rate: null,

    key_themes: null,

    satisfaction_score:
      satisfactionValidAnswerCount > 0
        ? Number(
            (totalSatisfactionWeight / satisfactionValidAnswerCount).toFixed(2),
          )
        : null,

    satisfaction_valid_answer_count: satisfactionValidAnswerCount,

    total_responses_change: null,
    engagement_rate_change: null,
    key_themes_change: null,
    satisfaction_score_change: null,
  };

  // Calculate the overall engagement rate for All Experiments.
  if (validResults.length === 1) {
    overviewMetrics.engagement_rate =
      metricsList[0]?.engagement_rate ?? null;
  } else {
    const totalParticipatingPersonas = metricsList.reduce(
      (total, metrics) =>
        total + (Number(metrics.participating_personas) || 0),
      0,
    );

    const totalExperimentPersonas = metricsList.reduce(
      (total, metrics) =>
        total + (Number(metrics.total_personas) || 0),
      0,
    );

    overviewMetrics.engagement_rate =
      totalExperimentPersonas > 0
        ? Number(
            (
              (totalParticipatingPersonas / totalExperimentPersonas) *
              100
            ).toFixed(2),
          )
        : 0;
  }

  return {
    ...validResults[0],

    summary: {
      ...validResults[0].summary,
      synthetic_responses: syntheticResponses,
      total_responses: syntheticResponses,
    },

    overview_metrics: overviewMetrics,

    question_analytics: questionAnalytics,

    persona_patterns: personaPatterns,

    common_answers: commonAnswers,

    trends: {
      granularity: "day",
      data: trendItems,
    },
  };
}

function mergeSentimentAnalytics(results) {
  const totals = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  results.forEach((result) => {
    if (!result?.distribution) {
      return;
    }

    result.distribution.forEach((item) => {
      const sentiment = String(item.sentiment || "").toLowerCase();

      if (Object.prototype.hasOwnProperty.call(totals, sentiment)) {
        totals[sentiment] += Number(item.count) || 0;
      }
    });
  });

  const totalResponses = totals.positive + totals.neutral + totals.negative;

  const sentiments = ["positive", "neutral", "negative"];

  return {
    total_responses: totalResponses,

    distribution: sentiments.map((sentiment) => ({
      sentiment,
      count: totals[sentiment],

      percentage:
        totalResponses > 0
          ? Number(((totals[sentiment] / totalResponses) * 100).toFixed(2))
          : 0,
    })),
  };
}

function formatPercentage(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatScore(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)}/10`;
}

function formatChange(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return `${value >= 0 ? "+" : ""}${
    Number.isInteger(value) ? value : value.toFixed(1)
  }%`;
}

function MetricIcon({ type }) {
  if (type === "responses") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "engagement") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M4 17l5-5 4 3 7-8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M16 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "themes") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 18.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OverviewMetricCard({ icon, label, value, change, description }) {
  const formattedChange = formatChange(change);

  return (
    <div className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F3F2] text-[#0F8E77]">
          <MetricIcon type={icon} />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-[#626975]">{label}</p>

      <p className="mt-2 text-2xl font-bold text-[#262633]">{value}</p>

      <div className="mt-3 flex min-h-[20px] items-center gap-1.5">
        {formattedChange ? (
          <>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#0F8E77]">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M10 15V5M6 9l4-4 4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {formattedChange}
            </span>

            <span className="text-xs text-[#8A939D]">from previous period</span>
          </>
        ) : (
          <span className="text-xs text-[#8A939D]">{description}</span>
        )}
      </div>
    </div>
  );
}

function Insights() {
  const [experiments, setExperiments] = useState([]);

  const [selectedExperimentId, setSelectedExperimentId] = useState("");

  const [selectedDuration, setSelectedDuration] = useState("all");

  const [analytics, setAnalytics] = useState(null);

  const [sentimentAnalytics, setSentimentAnalytics] = useState(null);
  const [themeAnalytics, setThemeAnalytics] = useState(null);
  const [loadingThemes, setLoadingThemes] = useState(false);

  const [insightAnalytics, setInsightAnalytics] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [loadingExperiments, setLoadingExperiments] = useState(true);

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [engagementAnalytics, setEngagementAnalytics] = useState(null);
  const [loadingEngagement, setLoadingEngagement] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExperiments() {
      setLoadingExperiments(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("synuserAccessToken");

        if (!accessToken) {
          throw new Error("Authentication token not found.");
        }

        const response = await fetch(`${API_BASE_URL}/api/experiments/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load experiments.");
        }

        setExperiments(Array.isArray(data) ? data : []);

        /*
         * Do not automatically select the first experiment.
         * The user should be able to see:
         * Select Experiment
         * All Experiments
         * Experiments
         */
        setSelectedExperimentId("");
        setAnalytics(null);
        setSentimentAnalytics(null);
      } catch (err) {
        setSelectedExperimentId("");
        setAnalytics(null);
        setSentimentAnalytics(null);
        setThemeAnalytics(null);
        setInsightAnalytics(null);
        setEngagementAnalytics(null);
        setError(err.message || "Failed to load experiments.");
      } finally {
        setLoadingExperiments(false);
      }
    }

    loadExperiments();
  }, []);

  function handleExperimentChange(value) {
    setSelectedExperimentId(value);
    setAnalytics(null);
    setSentimentAnalytics(null);
    setThemeAnalytics(null);
    setInsightAnalytics(null);
    setEngagementAnalytics(null);
    setError("");
  }

  useEffect(() => {
    if (!selectedExperimentId) {
      return;
    }

    let isActive = true;

    async function loadAnalytics() {
      setLoadingAnalytics(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("synuserAccessToken");

        if (!accessToken) {
          throw new Error("Authentication token not found.");
        }

        if (selectedExperimentId === "all") {
          const responses = await Promise.all(
            experiments.map(async (experiment) => {
              const response = await fetch(
                `${API_BASE_URL}/api/analytics/${experiment.id}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.detail ||
                    `Failed to load analytics for ${experiment.name}.`,
                );
              }

              return data;
            }),
          );

          if (isActive) {
            setAnalytics(mergeAnalytics(responses));
          }

          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/${selectedExperimentId}?duration=${selectedDuration}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load analytics.");
        }

        if (isActive) {
          setAnalytics(data);
        }
      } catch (err) {
        if (isActive) {
          setAnalytics(null);
          setError(err.message || "Failed to load analytics.");
        }
      } finally {
        if (isActive) {
          setLoadingAnalytics(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isActive = false;
    };
  }, [selectedExperimentId, selectedDuration, experiments]);

  useEffect(() => {
    if (!selectedExperimentId) {
      return;
    }

    let isActive = true;

    async function loadSentiment() {
      setLoadingSentiment(true);

      try {
        const accessToken = localStorage.getItem("synuserAccessToken");

        if (!accessToken) {
          throw new Error("Authentication token not found.");
        }

        if (selectedExperimentId === "all") {
          if (experiments.length === 0) {
            if (isActive) {
              setSentimentAnalytics({
                total_responses: 0,
                distribution: [
                  {
                    sentiment: "positive",
                    count: 0,
                    percentage: 0,
                  },
                  {
                    sentiment: "neutral",
                    count: 0,
                    percentage: 0,
                  },
                  {
                    sentiment: "negative",
                    count: 0,
                    percentage: 0,
                  },
                ],
              });
            }

            return;
          }

          const responses = await Promise.all(
            experiments.map(async (experiment) => {
              const response = await fetch(
                `${API_BASE_URL}/api/analytics/${experiment.id}/sentiment`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.detail ||
                    `Failed to load sentiment for ${experiment.name}.`,
                );
              }

              return data;
            }),
          );

          if (isActive) {
            setSentimentAnalytics(mergeSentimentAnalytics(responses));
          }

          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/${selectedExperimentId}/sentiment`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load sentiment analytics.");
        }

        if (isActive) {
          setSentimentAnalytics(data);
        }
      } catch (err) {
        console.error("Sentiment analytics error:", err);

        /*
         * Sentiment is an independent Insights section.
         * If sentiment fails, keep the normal analytics
         * page working instead of replacing the main
         * analytics error with a sentiment error.
         */
        if (isActive) {
          setSentimentAnalytics(null);
        }
      } finally {
        if (isActive) {
          setLoadingSentiment(false);
        }
      }
    }

    loadSentiment();

    return () => {
      isActive = false;
    };
  }, [selectedExperimentId, experiments]);

  useEffect(() => {
    if (!selectedExperimentId) {
      return;
    }

    let isActive = true;

    async function fetchThemes() {
      setLoadingThemes(true);

      try {
        const token = localStorage.getItem("synuserAccessToken");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const fetchExperimentThemes = async (experimentId) => {
          const response = await fetch(
            `${API_BASE_URL}/api/analytics/${experimentId}/themes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || "Failed to fetch theme analytics.");
          }

          return data;
        };

        if (selectedExperimentId !== "all") {
          const data = await fetchExperimentThemes(selectedExperimentId);

          if (isActive) {
            setThemeAnalytics(data);
          }

          return;
        }

        const results = await Promise.all(
          experiments.map((experiment) => fetchExperimentThemes(experiment.id)),
        );

        const totalResponses = results.reduce(
          (total, result) => total + (Number(result.total_responses) || 0),
          0,
        );

        const combinedThemes = new Map();

        results.forEach((result) => {
          (result.themes || []).forEach((item) => {
            const name = String(item.theme || "").trim();

            if (!name) {
              return;
            }

            const key = name.toLocaleLowerCase();
            const current = combinedThemes.get(key);

            if (current) {
              current.count += Number(item.count) || 0;
            } else {
              combinedThemes.set(key, {
                theme: name,
                count: Number(item.count) || 0,
              });
            }
          });
        });

        const themes = Array.from(combinedThemes.values())
          .map((item) => ({
            ...item,
            percentage:
              totalResponses > 0
                ? Number(((item.count / totalResponses) * 100).toFixed(2))
                : 0,
          }))
          .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme))
          .slice(0, 5);

        if (isActive) {
          setThemeAnalytics({
            total_responses: totalResponses,
            themes,
          });
        }
      } catch (error) {
        console.error("Failed to load theme analytics:", error);

        if (isActive) {
          setThemeAnalytics(null);
        }
      } finally {
        if (isActive) {
          setLoadingThemes(false);
        }
      }
    }

    fetchThemes();

    return () => {
      isActive = false;
    };
  }, [selectedExperimentId, experiments]);

  useEffect(() => {
    if (!selectedExperimentId) {
      return;
    }

    let isActive = true;

    async function fetchInsights() {
      setLoadingInsights(true);

      const token = localStorage.getItem("synuserAccessToken");

      try {
        if (selectedExperimentId === "all") {
          if (experiments.length === 0) {
            if (isActive) {
              setInsightAnalytics({
                total_responses: 0,
                insights: [],
              });
            }

            return;
          }

          const responses = await Promise.all(
            experiments.map(async (experiment) => {
              const response = await fetch(
                `${API_BASE_URL}/api/analytics/${experiment.id}/insights`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.detail ||
                    `Failed to load insights for ${experiment.name}.`,
                );
              }

              return data;
            }),
          );

          const mergedInsights = responses.flatMap(
            (item) => item?.insights || [],
          );

          if (isActive) {
            setInsightAnalytics({
              total_responses: responses.reduce(
                (total, item) => total + (Number(item?.total_responses) || 0),
                0,
              ),
              insights: mergedInsights.slice(0, 5),
            });
          }

          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/${selectedExperimentId}/insights`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to fetch insight analytics.");
        }

        if (isActive) {
          setInsightAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load insight analytics:", error);

        if (isActive) {
          setInsightAnalytics(null);
        }
      } finally {
        if (isActive) {
          setLoadingInsights(false);
        }
      }
    }

    fetchInsights();

    return () => {
      isActive = false;
    };
  }, [selectedExperimentId, experiments]);

  useEffect(() => {
    if (!selectedExperimentId) {
      return;
    }

    let isActive = true;

    async function loadEngagementTrend() {
      setLoadingEngagement(true);

      try {
        const token = localStorage.getItem("synuserAccessToken");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const fetchExperimentTrend = async (experimentId) => {
          const response = await fetch(
            `${API_BASE_URL}/api/analytics/${experimentId}/engagement-trend`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || "Failed to load engagement trend.");
          }

          return data;
        };

        if (selectedExperimentId !== "all") {
          const data = await fetchExperimentTrend(selectedExperimentId);

          if (isActive) {
            setEngagementAnalytics(data);
          }

          return;
        }

        const results = await Promise.all(
          experiments.map((experiment) => fetchExperimentTrend(experiment.id)),
        );

        const dailyTotals = new Map();

        results.forEach((result) => {
          (result.trend || []).forEach((item) => {
            if (!item.date) {
              return;
            }

            const current = dailyTotals.get(item.date) || {
              date: item.date,
              positive: 0,
              neutral: 0,
              negative: 0,
            };

            current.positive += Number(item.positive) || 0;
            current.neutral += Number(item.neutral) || 0;
            current.negative += Number(item.negative) || 0;

            dailyTotals.set(item.date, current);
          });
        });

        const trend = Array.from(dailyTotals.values()).sort((a, b) =>
          a.date.localeCompare(b.date),
        );

        const totalResponses = trend.reduce(
          (total, item) => total + item.positive + item.neutral + item.negative,
          0,
        );

        if (isActive) {
          setEngagementAnalytics({
            total_responses: totalResponses,
            trend,
          });
        }
      } catch (error) {
        console.error("Failed to load engagement trend:", error);

        if (isActive) {
          setEngagementAnalytics(null);
        }
      } finally {
        if (isActive) {
          setLoadingEngagement(false);
        }
      }
    }

    loadEngagementTrend();

    return () => {
      isActive = false;
    };
  }, [selectedExperimentId, experiments]);

  const trendItems = getTrendItems(analytics);

  const filteredTrendItems = trendItems.filter((item) =>
    isWithinDuration(getTrendDate(item), selectedDuration),
  );

  const durationResponseCount = filteredTrendItems.reduce(
    (total, item) => total + getTrendCount(item),
    0,
  );

  const totalResponses =
    selectedDuration === "all"
      ? (analytics?.summary?.total_responses ?? 0)
      : durationResponseCount;

  const syntheticResponses =
    selectedDuration === "all"
      ? (analytics?.summary?.synthetic_responses ?? 0)
      : durationResponseCount;

  const questionCount = analytics?.question_analytics?.length ?? 0;

  const participatingPersonaCount =
    analytics?.persona_patterns?.length ?? analytics?.summary?.personas ?? 0;

  const overviewMetrics = analytics?.overview_metrics;

  const overviewTotalResponses =
    selectedDuration === "all"
      ? (overviewMetrics?.total_responses ?? totalResponses)
      : totalResponses;

  const overviewEngagementRate = overviewMetrics?.engagement_rate ?? null;

  const overviewKeyThemes =
    selectedExperimentId === "all"
      ? (themeAnalytics?.themes?.length ?? overviewMetrics?.key_themes ?? null)
      : (overviewMetrics?.key_themes ?? themeAnalytics?.themes?.length ?? null);

  const overviewSatisfactionScore = overviewMetrics?.satisfaction_score ?? null;

  const selectedExperiment = experiments.find(
    (experiment) => String(experiment.id) === String(selectedExperimentId),
  );

  const experimentOptions = [
    {
      value: "",
      label: "Select Experiment",
    },
    {
      value: "all",
      label: "All Experiments",
    },
    ...experiments.map((experiment) => ({
      value: String(experiment.id),
      label: experiment.name,
    })),
  ];

  const durationOptions = [
    {
      value: "all",
      label: "All Time",
    },
    {
      value: "7",
      label: "Last 7 Days",
    },
    {
      value: "30",
      label: "Last 30 Days",
    },
    {
      value: "90",
      label: "Last 90 Days",
    },
  ];

  const positiveSentiment = sentimentAnalytics?.distribution?.find(
    (item) => String(item.sentiment).toLowerCase() === "positive",
  ) || {
    count: 0,
    percentage: 0,
  };

  const neutralSentiment = sentimentAnalytics?.distribution?.find(
    (item) => String(item.sentiment).toLowerCase() === "neutral",
  ) || {
    count: 0,
    percentage: 0,
  };

  const negativeSentiment = sentimentAnalytics?.distribution?.find(
    (item) => String(item.sentiment).toLowerCase() === "negative",
  ) || {
    count: 0,
    percentage: 0,
  };

  const positivePercentage = Number(positiveSentiment.percentage || 0);

  const neutralPercentage = Number(neutralSentiment.percentage || 0);

  const negativePercentage = Number(negativeSentiment.percentage || 0);

  const sentimentTotalResponses =
    Number(sentimentAnalytics?.total_responses) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header + Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#262633]">
              Insights Overview
            </h1>

            <p className="mt-1 text-sm text-[#626975]">
              Explore insights generated from your research.
            </p>
          </div>

          <div className="flex w-full flex-col justify-end gap-3 sm:flex-row sm:items-end sm:justify-end lg:w-auto lg:shrink-0">
            <div className="w-full sm:w-58">
              <Dropdown
                value={selectedExperimentId}
                options={experimentOptions}
                onChange={handleExperimentChange}
                disabled={loadingExperiments}
              />
            </div>

            <div className="w-full sm:w-[140px]">
              <Dropdown
                value={selectedDuration}
                options={durationOptions}
                onChange={setSelectedDuration}
                disabled={loadingAnalytics}
              />
            </div>
          </div>
        </div>

        {/* Selected Experiment */}
        {selectedExperiment && (
          <div className="rounded-xl border border-[#DDEFE9] bg-[#F7FCFA] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#25A88A]">
              Selected Experiment
            </p>

            <p className="mt-1 text-sm font-semibold text-[#262633]">
              {selectedExperiment.name}
            </p>
          </div>
        )}

        {selectedExperimentId === "all" && (
          <div className="rounded-xl border border-[#DDEFE9] bg-[#F7FCFA] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#25A88A]">
              Experiment Scope
            </p>

            <p className="mt-1 text-sm font-semibold text-[#262633]">
              All Experiments
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[#F5D0D0] bg-[#FFF6F6] px-4 py-3">
            <p className="text-sm text-[#C94A4A]">{error}</p>
          </div>
        )}

        {/* No Experiment Selected */}
        {!loadingExperiments && selectedExperimentId === "" && (
          <div className="rounded-2xl border border-[#E7EBEF] bg-white px-5 py-8 text-center shadow-sm">
            <p className="text-sm font-medium text-[#626975]">
              Select an experiment to view its insights.
            </p>

            <p className="mt-1 text-xs text-[#8A939D]">
              You can also choose All Experiments.
            </p>
          </div>
        )}

        {/* Loading */}
        {loadingAnalytics && (
          <div className="rounded-xl border border-[#E7EBEF] bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-[#626975]">Loading analytics...</p>
          </div>
        )}

        {/* Overview Cards */}
        {analytics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewMetricCard
              icon="responses"
              label="Total Responses"
              value={overviewTotalResponses}
              change={overviewMetrics?.total_responses_change}
              description="AI-generated synthetic responses"
            />

            <OverviewMetricCard
              icon="engagement"
              label="Engagement Rate"
              value={formatPercentage(overviewEngagementRate)}
              change={overviewMetrics?.engagement_rate_change}
              description="Synthetic persona participation"
            />

            <OverviewMetricCard
              icon="themes"
              label="Key Themes"
              value={
                typeof overviewKeyThemes === "number" ? overviewKeyThemes : "—"
              }
              change={overviewMetrics?.key_themes_change}
              description="Identified themes across Ready surveys"
            />

            <OverviewMetricCard
              icon="satisfaction"
              label="Satisfaction Score"
              value={formatScore(overviewSatisfactionScore)}
              change={overviewMetrics?.satisfaction_score_change}
              description="Calculated from rating responses"
            />
          </div>
        )}

        {/* Research Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 gap-5">
            <section className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#262633]">
                Research Analytics
              </h2>

              <p className="mt-1 text-xs text-[#8A939D]">
                Synthetic research data currently available for this experiment.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[#F7FAF9] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#626975]">
                      Synthetic Responses
                    </p>

                    <p className="mt-0.5 text-xs text-[#8A939D]">
                      AI-generated responses
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-[#262633]">
                    {syntheticResponses}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#F7FAF9] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#626975]">
                      Personas Analyzed
                    </p>

                    <p className="mt-0.5 text-xs text-[#8A939D]">
                      Participating synthetic personas
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-[#262633]">
                    {participatingPersonaCount}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#F7FAF9] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#626975]">
                      Questions Analyzed
                    </p>

                    <p className="mt-0.5 text-xs text-[#8A939D]">
                      Survey questions
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-[#262633]">
                    {questionCount}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Sentiment + Top Themes */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Sentiment Overview */}
          <section className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#262633]">
                Sentiment Overview
              </h2>

              <p className="mt-1 text-sm text-[#7D858D]">
                Overall sentiment across AI-generated responses.
              </p>
            </div>

            {loadingSentiment ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <div className="text-sm text-[#7D858D]">
                  Loading sentiment analysis...
                </div>
              </div>
            ) : sentimentTotalResponses > 0 ? (
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                <div className="flex flex-1 justify-center">
                  <div className="relative h-56 w-56">
                    <div
                      className="h-full w-full rounded-full"
                      style={{
                        background: `conic-gradient(
                          #0F8E77 0% ${positivePercentage}%,
                          #9AA1A8 ${positivePercentage}% ${
                            positivePercentage + neutralPercentage
                          }%,
                          #D95C5C ${
                            positivePercentage + neutralPercentage
                          }% 100%
                        )`,
                      }}
                    />

                    <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-bold text-[#262633]">
                        {sentimentTotalResponses}
                      </span>

                      <span className="mt-1 text-xs text-[#7D858D]">
                        Responses
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-5">
                  {/* Positive */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-[#0F8E77]" />

                      <span className="text-sm font-medium text-[#262633]">
                        Positive
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#262633]">
                        {positivePercentage}%
                      </span>

                      <span className="ml-2 text-xs text-[#8A9299]">
                        ({positiveSentiment.count})
                      </span>
                    </div>
                  </div>

                  {/* Neutral */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-[#9AA1A8]" />

                      <span className="text-sm font-medium text-[#262633]">
                        Neutral
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#262633]">
                        {neutralPercentage}%
                      </span>

                      <span className="ml-2 text-xs text-[#8A9299]">
                        ({neutralSentiment.count})
                      </span>
                    </div>
                  </div>

                  {/* Negative */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-[#D95C5C]" />

                      <span className="text-sm font-medium text-[#262633]">
                        Negative
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#262633]">
                        {negativePercentage}%
                      </span>

                      <span className="ml-2 text-xs text-[#8A9299]">
                        ({negativeSentiment.count})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-[#DDE3E8] bg-[#FAFBFC]">
                <div className="text-center">
                  <p className="text-sm font-medium text-[#59616A]">
                    No sentiment data available
                  </p>

                  <p className="mt-1 text-xs text-[#8A9299]">
                    Generate synthetic responses to see sentiment analysis.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Top Themes */}
          <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-[#262633]">
                Top Themes
              </h3>

              <p className="mt-1 text-xs text-[#8A9298]">
                Recurring themes identified from synthetic responses.
              </p>
            </div>

            {loadingThemes ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <p className="text-sm text-[#8A9298]">Analyzing themes...</p>
              </div>
            ) : themeAnalytics?.themes?.length ? (
              <div className="space-y-5">
                {themeAnalytics.themes.map((item) => (
                  <div key={item.theme}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-[#3A4147]">
                        {item.theme}
                      </span>

                      <span className="text-sm font-semibold text-[#262633]">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F0]">
                      <div
                        className="h-full rounded-full bg-[#0F8E77]"
                        style={{
                          width: `${Math.min(
                            Math.max(item.percentage, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center text-center">
                <div>
                  <p className="text-sm font-medium text-[#3A4147]">
                    Themes are currently unavailable.
                  </p>

                  <p className="mt-1 text-xs text-[#8A9298]">
                    AI theme analysis could not be completed right now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Insights + Engagement Trend */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Key Insights */}
          <section className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#262633]">
              Key Insights
            </h2>

            <p className="mt-1 text-xs text-[#8A939D]">
              AI-generated findings from synthetic research responses.
            </p>

            {loadingInsights ? (
              <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-xl bg-[#F7FAF9]">
                <p className="text-sm text-[#8A939D]">
                  Analyzing research insights...
                </p>
              </div>
            ) : insightAnalytics?.insights?.length ? (
              <div className="mt-5 space-y-3">
                {insightAnalytics.insights.map((item, index) => (
                  <div
                    key={`${item.insight}-${index}`}
                    className="flex gap-3 rounded-xl bg-[#F7FAF9] p-4"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E7F3F2] text-[#0F8E77]">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <p className="text-sm leading-6 text-[#626975]">
                      {item.insight}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[#DDE3E8] bg-[#FAFBFC] text-center">
                <div>
                  <p className="text-sm font-medium text-[#3A4147]">
                    Insights are currently unavailable.
                  </p>

                  <p className="mt-1 text-xs text-[#8A9298]">
                    AI insight analysis could not be completed right now.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Engagement Trend */}
          <section className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#262633]">
              Engagement Trend
            </h2>

            <p className="mt-1 text-xs text-[#8A939D]">
              Positive and negative sentiment trends across synthetic research
              responses.
            </p>

            {loadingEngagement ? (
              <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-xl bg-[#F7FAF9]">
                <p className="text-sm text-[#8A939D]">
                  Loading engagement trend...
                </p>
              </div>
            ) : engagementAnalytics?.trend?.length ? (
              <div className="mt-5 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={engagementAnalytics.trend}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E7EBEF"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 11,
                        fill: "#8A939D",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                        fill: "#8A939D",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E7EBEF",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="positive"
                      name="Positive"
                      stroke="#0F8E77"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="negative"
                      name="Negative"
                      stroke="#E56B6F"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-[#DDE3E8] bg-[#FAFBFC] text-center">
                <div>
                  <p className="text-sm font-medium text-[#3A4147]">
                    Engagement trend is currently unavailable.
                  </p>

                  <p className="mt-1 text-xs text-[#8A9298]">
                    Synthetic response trend data is not available for this
                    experiment.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Insights;
