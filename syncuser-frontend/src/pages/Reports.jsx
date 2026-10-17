import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Filter,
  LoaderCircle,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const reportTypeOptions = [
  {
    value: "",
    label: "Select Report Type",
    description: "",
  },
  {
    value: "experiment_summary",
    label: "Experiment Summary",
    description:
      "Experiment setup, personas, surveys, questions, and response coverage.",
  },
  {
    value: "persona_analysis",
    label: "Persona Analysis",
    description:
      "Generated personas, demographics, goals, needs, and pain points.",
  },
  {
    value: "survey_results",
    label: "Survey Results",
    description: "Survey questions and synthetic response results.",
  },
  {
    value: "insights",
    label: "Insights",
    description: "Research findings, response patterns, and key observations.",
  },
];

const modalDateRangeOptions = [
  {
    value: "",
    label: "Select Date Range",
  },
  {
    value: "all",
    label: "All Time",
  },
  {
    value: "today",
    label: "Today",
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
    label: "Last 3 Months",
  },
  {
    value: "month",
    label: "This Month",
  },
  {
    value: "custom",
    label: "Custom Range",
  },
];

const exportFormatOptions = [
  {
    value: "",
    label: "Select Export Format",
  },
  {
    value: "pdf",
    label: "PDF",
  },
  {
    value: "csv",
    label: "CSV",
  },
];

const filterFormatOptions = [
  {
    value: "all",
    label: "All Formats",
  },
  {
    value: "pdf",
    label: "PDF",
  },
  {
    value: "csv",
    label: "CSV",
  },
];

const filterDurationOptions = [
  {
    value: "all",
    label: "All Time",
  },
  {
    value: "today",
    label: "Today",
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
    label: "Last 3 Months",
  },
  {
    value: "month",
    label: "This Month",
  },
];

function getToken() {
  return localStorage.getItem("synuserAccessToken");
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response;
}

function getReportTypeLabel(type) {
  const option = reportTypeOptions.find((item) => item.value === type);

  return option?.label || "Research Report";
}

function getExportFormatLabel(format) {
  if (String(format).toLowerCase() === "csv") {
    return "CSV";
  }

  return "PDF";
}

function getReportExtension(report) {
  const directFormat = String(report?.export_format || "").toLowerCase();

  if (directFormat === "pdf" || directFormat === "csv") {
    return directFormat;
  }

  const fileName = String(report?.file_name || "").toLowerCase();

  if (fileName.endsWith(".csv")) {
    return "csv";
  }

  const filePath = String(report?.file_path || "").toLowerCase();

  if (filePath.endsWith(".csv")) {
    return "csv";
  }

  return "pdf";
}

/*
 * Backend timestamps are stored in UTC.
 *
 * If a timestamp has no timezone suffix, treat it as UTC.
 */
function parseReportDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  let value = String(dateValue).trim();

  if (value && !/[zZ]$/.test(value) && !/[+-]\d{2}:\d{2}$/.test(value)) {
    value = `${value}Z`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatReportDate(dateValue) {
  const date = parseReportDate(dateValue);

  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayInputValue() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYesterdayInputValue() {
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear();

  const month = String(yesterday.getMonth() + 1).padStart(2, "0");

  const day = String(yesterday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Converts a local calendar date to the beginning of that day.
 */
function startOfLocalDay(date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

/*
 * Converts a local calendar date to the end of that day.
 */
function endOfLocalDay(date) {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
}

/*
 * Returns the start of the current month in local time.
 */
function startOfCurrentMonth(now) {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

/*
 * Returns a date N calendar months before the supplied date.
 *
 * Example:
 * October 5 -> July 5 for 3 months.
 */
function subtractCalendarMonths(date, months) {
  const result = new Date(date);

  result.setDate(1);

  result.setMonth(result.getMonth() - months);

  const targetMonth = result.getMonth();

  const originalDay = date.getDate();

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    targetMonth + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDayOfTargetMonth));

  result.setHours(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );

  return result;
}

/*
 * Returns the exact date boundaries used by the report generator.
 *
 * IMPORTANT:
 * These boundaries represent the user's local calendar.
 * They are converted to ISO/UTC only when sent to the backend.
 */
function buildDateRange(range, customStartDate = "", customEndDate = "") {
  if (!range) {
    throw new Error("Please select a date range.");
  }

  const now = new Date();

  /*
   * ALL TIME
   *
   * No date filtering.
   */
  if (range === "all") {
    return {
      start_date: null,
      end_date: null,
    };
  }

  /*
   * TODAY
   *
   * From local midnight through the end of today.
   */
  if (range === "today") {
    const start = startOfLocalDay(now);
    const end = endOfLocalDay(now);

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  /*
   * LAST 7 DAYS
   *
   * Today + previous 6 calendar days.
   *
   * Example:
   * October 5 => September 29 through October 5.
   */
  if (range === "7") {
    const end = endOfLocalDay(now);

    const start = startOfLocalDay(now);

    start.setDate(start.getDate() - 6);

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  /*
   * LAST 30 DAYS
   *
   * Today + previous 29 calendar days.
   */
  if (range === "30") {
    const end = endOfLocalDay(now);

    const start = startOfLocalDay(now);

    start.setDate(start.getDate() - 29);

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  /*
   * LAST 3 MONTHS
   *
   * Rolling three-calendar-month period ending today.
   *
   * Example:
   * October 5 => July 5 through October 5.
   */
  if (range === "90") {
    const end = endOfLocalDay(now);

    const start = startOfLocalDay(subtractCalendarMonths(now, 3));

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  /*
   * THIS MONTH
   *
   * First day of the CURRENT calendar month
   * through the END of today.
   *
   * Example:
   * October 5, 2026
   *
   * start = October 1, 2026 00:00 local
   * end   = October 5, 2026 23:59:59.999 local
   *
   * Therefore September data MUST NOT be included.
   */
  if (range === "month") {
    const start = startOfCurrentMonth(now);

    const end = endOfLocalDay(now);

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  /*
   * CUSTOM RANGE
   */
  if (range === "custom") {
    if (!customStartDate || !customEndDate) {
      throw new Error("Please select both start date and end date.");
    }

    const start = new Date(`${customStartDate}T00:00:00`);

    const end = new Date(`${customEndDate}T23:59:59.999`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Please enter valid custom dates.");
    }

    if (customEndDate > getTodayInputValue()) {
      throw new Error("End date cannot be later than today.");
    }

    if (customStartDate === customEndDate) {
      throw new Error("Start date and end date cannot be the same.");
    }

    if (start > end) {
      throw new Error("Start date must be before the end date.");
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  throw new Error("Please select a valid date range.");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function CustomDropdown({
  id,
  value,
  options,
  onChange,
  placeholder,
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => option.value && option.value === value,
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-9 w-full items-center justify-between rounded-lg border bg-white px-3 text-[11px] font-medium transition ${
          disabled
            ? "cursor-not-allowed border-[#E5E9EA] bg-[#F8FAFA] text-[#A0A7AD]"
            : open
              ? "border-[#0F8E77] text-[#56616A] ring-2 ring-[#0F8E77]/10"
              : "border-[#DCE5E3] text-[#56616A] shadow-sm hover:border-[#0F8E77]"
        }`}
      >
        <span
          className={
            selectedOption
              ? "truncate text-xs font-medium text-[#56616A]"
              : "truncate text-xs text-[#8A939D]"
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        {open ? (
          <ChevronUp size={15} className="shrink-0 text-[#77828A]" />
        ) : (
          <ChevronDown size={15} className="shrink-0 text-[#77828A]" />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-[100] w-full min-w-[180px] overflow-hidden rounded-xl border border-[#E2E7E6] bg-white p-1 shadow-[0_14px_35px_rgba(38,38,51,0.14)]"
        >
          {options.map((option) => {
            const selected = option.value !== "" && option.value === value;

            return (
              <button
                key={`${id}-${option.value || "placeholder"}`}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-medium transition ${
                  selected
                    ? "bg-[#0F8E77] font-bold text-white"
                    : option.value === ""
                      ? "text-[#8A939D] hover:bg-[#F1F8F6]"
                      : "text-[#56616A] hover:bg-[#F1F8F6]"
                }`}
              >
                <span className="truncate">{option.label}</span>

                {selected && (
                  <Check
                    size={15}
                    strokeWidth={3}
                    className="ml-2 shrink-0 text-white"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionMenu({ report, onView, onDelete }) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`Actions for ${report.name}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE7E4] bg-white text-[#69747B] transition hover:bg-[#F4FBF9] hover:text-[#0F8E77]"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+7px)] z-[50] w-36 overflow-hidden rounded-xl border border-[#E2E7E6] bg-white p-1.5 shadow-[0_14px_35px_rgba(38,38,51,0.14)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView(report);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#4E5961] transition hover:bg-[#F1F8F6] hover:text-[#0F8E77]"
          >
            <Eye size={15} />
            View
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(report);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#B6464B] transition hover:bg-[#FFF4F4]"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);

  const [experiments, setExperiments] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedFilterFormat, setSelectedFilterFormat] = useState("all");

  const [selectedFilterDuration, setSelectedFilterDuration] = useState("all");

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const [generationError, setGenerationError] = useState("");

  const [selectedReportType, setSelectedReportType] = useState("");

  const [selectedExperimentId, setSelectedExperimentId] = useState("");

  const [selectedDateRange, setSelectedDateRange] = useState("");

  const [customStartDate, setCustomStartDate] = useState("");

  const [customEndDate, setCustomEndDate] = useState("");

  const [reportName, setReportName] = useState("");

  const [reportNameEdited, setReportNameEdited] = useState(false);

  const [selectedExportFormat, setSelectedExportFormat] = useState("");

  const [reportToDelete, setReportToDelete] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const selectedExperiment = useMemo(
    () =>
      experiments.find(
        (experiment) => String(experiment.id) === String(selectedExperimentId),
      ),
    [experiments, selectedExperimentId],
  );

  const suggestedReportName = useMemo(() => {
    if (!selectedReportType) {
      return "";
    }

    const typeLabel = getReportTypeLabel(selectedReportType);

    if (selectedExperiment) {
      return `${typeLabel} - ${selectedExperiment.name}`;
    }

    return typeLabel;
  }, [selectedReportType, selectedExperiment]);

  const todayInputValue = getTodayInputValue();

  const yesterdayInputValue = getYesterdayInputValue();

  const customDateError = useMemo(() => {
    if (selectedDateRange !== "custom") {
      return "";
    }

    if (!customStartDate || !customEndDate) {
      return "Please select both start date and end date.";
    }

    if (customStartDate > yesterdayInputValue) {
      return "Start date cannot be later than yesterday.";
    }

    if (customEndDate > todayInputValue) {
      return "End date cannot be later than today.";
    }

    if (customStartDate === customEndDate) {
      return "Start date and end date cannot be the same.";
    }

    if (customStartDate > customEndDate) {
      return "Start date must be before the end date.";
    }

    return "";
  }, [
    selectedDateRange,
    customStartDate,
    customEndDate,
    todayInputValue,
    yesterdayInputValue,
  ]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        if (!isGenerating) {
          setIsModalOpen(false);
        }
      }
    }

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen, isGenerating]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiRequest("/api/experiments/"),
      apiRequest(`/api/reports/?_=${Date.now()}`),
    ])
      .then(async ([experimentsResponse, reportsResponse]) => {
        const [experimentsData, reportsData] = await Promise.all([
          experimentsResponse.json(),
          reportsResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        setExperiments(Array.isArray(experimentsData) ? experimentsData : []);

        setReports(Array.isArray(reportsData) ? reportsData : []);

        setIsLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setIsLoading(false);

        toast.error(error.message || "Unable to load reports.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadReports() {
    const response = await apiRequest(`/api/reports/?_=${Date.now()}`);

    const data = await response.json();

    setReports(Array.isArray(data) ? data : []);
  }

  /*
   * Applies the same calendar-based duration semantics
   * to the Available Reports list.
   */
  const filteredReports = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const now = new Date();

    let rangeStart = null;
    let rangeEnd = null;

    if (selectedFilterDuration === "today") {
      rangeStart = startOfLocalDay(now);
      rangeEnd = endOfLocalDay(now);
    }

    if (selectedFilterDuration === "7") {
      rangeStart = startOfLocalDay(now);
      rangeStart.setDate(rangeStart.getDate() - 6);

      rangeEnd = endOfLocalDay(now);
    }

    if (selectedFilterDuration === "30") {
      rangeStart = startOfLocalDay(now);
      rangeStart.setDate(rangeStart.getDate() - 29);

      rangeEnd = endOfLocalDay(now);
    }

    if (selectedFilterDuration === "90") {
      rangeStart = startOfLocalDay(subtractCalendarMonths(now, 3));

      rangeEnd = endOfLocalDay(now);
    }

    if (selectedFilterDuration === "month") {
      rangeStart = startOfCurrentMonth(now);
      rangeEnd = endOfLocalDay(now);
    }

    return reports.filter((report) => {
      const reportDate = parseReportDate(report.created_at);

      const matchesSearch =
        !search ||
        [report.name, report.report_type, report.experiment_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);

      const reportFormat = getReportExtension(report);

      const matchesFormat =
        selectedFilterFormat === "all" || reportFormat === selectedFilterFormat;

      const matchesDuration =
        !rangeStart ||
        !rangeEnd ||
        (reportDate &&
          !Number.isNaN(reportDate.getTime()) &&
          reportDate >= rangeStart &&
          reportDate <= rangeEnd);

      return matchesSearch && matchesFormat && matchesDuration;
    });
  }, [reports, searchTerm, selectedFilterFormat, selectedFilterDuration]);

  function resetGenerationForm() {
    setSelectedReportType("");
    setSelectedExperimentId("");
    setSelectedDateRange("");
    setCustomStartDate("");
    setCustomEndDate("");
    setReportName("");
    setReportNameEdited(false);
    setSelectedExportFormat("");
    setGenerationError("");
  }

  function openGenerateModal() {
    resetGenerationForm();
    setIsModalOpen(true);
  }

  function closeGenerateModal() {
    if (isGenerating) {
      return;
    }

    setIsModalOpen(false);
    resetGenerationForm();
  }

  /*
   * Generates the exact backend date range.
   *
   * The important point is that the selected duration
   * is converted from the user's LOCAL calendar to UTC
   * only when sent to the backend.
   */
  function getDateRangeValues() {
    if (!selectedDateRange) {
      throw new Error("Please select a date range.");
    }

    return buildDateRange(selectedDateRange, customStartDate, customEndDate);
  }

  async function handleGenerateReport(event) {
    event.preventDefault();

    setGenerationError("");

    if (!selectedReportType) {
      toast.error("Please select a report type.");

      return;
    }

    if (!selectedExperimentId) {
      toast.error("Please select an experiment.");

      return;
    }

    if (!selectedDateRange) {
      toast.error("Please select a date range.");

      return;
    }

    if (!reportName.trim()) {
      toast.error("Please enter a report name.");

      return;
    }

    if (!selectedExportFormat) {
      toast.error("Please select an export format.");

      return;
    }

    let dateRange;

    try {
      dateRange = getDateRangeValues();
    } catch (error) {
      setGenerationError(error.message);

      toast.error(error.message || "Please enter valid date values.");

      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiRequest("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experiment_id: Number(selectedExperimentId),
          report_type: selectedReportType,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          report_name: reportName.trim(),
          export_format: selectedExportFormat,
        }),
      });

      const generatedReport = await response.json();

      await loadReports();

      setIsModalOpen(false);

      resetGenerationForm();

      toast.success(
        `"${generatedReport.name}" was generated successfully as ${getExportFormatLabel(
          generatedReport.export_format,
        )}.`,
      );
    } catch (error) {
      toast.error(error.message || "Report generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(report) {
    try {
      const response = await apiRequest(`/api/reports/${report.id}/download`);

      const blob = await response.blob();

      const objectUrl = window.URL.createObjectURL(blob);

      const extension = getReportExtension(report);

      const fileName =
        report.file_name || `${report.name || "research_report"}.${extension}`;

      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Unable to download the report.");
    }
  }

  async function handleView(report) {
    const viewWindow = window.open("about:blank", "_blank");

    if (!viewWindow) {
      toast.error(
        "The browser blocked the report tab. Please allow pop-ups for this site.",
      );

      return;
    }

    try {
      const format = getReportExtension(report);

      const response = await apiRequest(`/api/reports/${report.id}/view`);

      /*
       * PDF
       */
      if (format === "pdf") {
        const blob = await response.blob();

        const objectUrl = window.URL.createObjectURL(blob);

        viewWindow.location.href = objectUrl;

        window.setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 60000);

        return;
      }

      /*
       * CSV
       */
      const csvText = await response.text();

      const safeTitle = escapeHtml(report.name || "CSV Report");

      const safeCsv = escapeHtml(csvText);

      viewWindow.document.open();

      viewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>${safeTitle}</title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                background: #f6f9f8;
                color: #30343a;
                font-family:
                  Inter,
                  ui-sans-serif,
                  system-ui,
                  -apple-system,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  sans-serif;
              }

              .page {
                min-height: 100vh;
                padding: 28px;
              }

              .card {
                width: 100%;
                min-height: calc(100vh - 56px);
                background: #ffffff;
                border: 1px solid #e2e7e6;
                border-radius: 18px;
                box-shadow:
                  0 18px 50px rgba(38, 38, 51, 0.10);
                overflow: hidden;
                display: flex;
                flex-direction: column;
              }

              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                padding: 18px 22px;
                border-bottom: 1px solid #eef1f3;
              }

              .title-area {
                min-width: 0;
              }

              .title {
                margin: 0;
                font-size: 17px;
                font-weight: 700;
                color: #262633;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .subtitle {
                margin: 4px 0 0;
                font-size: 11px;
                color: #8a939d;
              }

              .close-button {
                flex-shrink: 0;
                border: 1px solid #dce7e4;
                background: #ffffff;
                color: #0f8e77;
                border-radius: 9px;
                padding: 8px 14px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
              }

              .close-button:hover {
                background: #f2fbf9;
                border-color: #0f8e77;
              }

              .content {
                flex: 1;
                overflow: auto;
                padding: 22px;
              }

              .csv {
                margin: 0;
                padding: 18px;
                min-width: max-content;
                background: #fbfcfc;
                border: 1px solid #e7ebef;
                border-radius: 12px;
                color: #3a4147;
                font-family:
                  Consolas,
                  "Courier New",
                  monospace;
                font-size: 12px;
                line-height: 1.65;
                white-space: pre;
              }

              @media (max-width: 640px) {
                .page {
                  padding: 12px;
                }

                .card {
                  min-height: calc(100vh - 24px);
                  border-radius: 14px;
                }

                .header {
                  padding: 14px;
                }

                .content {
                  padding: 14px;
                }

                .title {
                  font-size: 14px;
                }
              }
            </style>
          </head>

          <body>
            <div class="page">
              <div class="card">
                <div class="header">
                  <div class="title-area">
                    <h1 class="title">
                      ${safeTitle}
                    </h1>

                    <p class="subtitle">
                      CSV report preview
                    </p>
                  </div>

                  <button
                    type="button"
                    class="close-button"
                    onclick="window.close()"
                  >
                    Close
                  </button>
                </div>

                <div class="content">
                  <pre class="csv">${safeCsv}</pre>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);

      viewWindow.document.close();
    } catch (error) {
      viewWindow.close();

      toast.error(error.message || "Unable to view the report.");
    }
  }

  function requestDeleteReport(report) {
    setReportToDelete(report);
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setReportToDelete(null);
  }

  async function handleDeleteReport() {
    if (!reportToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiRequest(`/api/reports/${reportToDelete.id}`, {
        method: "DELETE",
      });

      setReports((currentReports) =>
        currentReports.filter((report) => report.id !== reportToDelete.id),
      );

      toast.success(`"${reportToDelete.name}" was deleted successfully.`);

      setReportToDelete(null);
    } catch (error) {
      toast.error(error.message || "Unable to delete the report.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#262633]">Reports</h1>

            <p className="mt-1 text-sm text-[#626975]">
              Generate and download detailed reports from your research data.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
            {/* Search */}
            <div className="flex h-10 w-[190px] items-center rounded-xl border border-[#E2E7EA] bg-white px-3 shadow-sm">
              <Search size={15} className="mr-2 shrink-0 text-[#8C969E]" />

              <input
                id="report-search"
                name="report-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reports..."
                className="w-full bg-transparent text-xs text-[#262633] outline-none placeholder:text-[#9AA1A8]"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((current) => !current)}
                className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                  isFilterOpen ||
                  selectedFilterFormat !== "all" ||
                  selectedFilterDuration !== "all"
                    ? "border-[#0F8E77] bg-[#F2FBF9] text-[#0F8E77]"
                    : "border-[#E2E7EA] bg-white text-[#56616A] hover:border-[#0F8E77] hover:text-[#0F8E77]"
                }`}
              >
                <Filter size={15} />
                Filter
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[55] w-[340px] rounded-2xl border border-[#E2E7E6] bg-white p-4 shadow-[0_20px_55px_rgba(38,38,51,0.16)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#30363B]">
                      Filter Reports
                    </h2>

                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8A939D] hover:bg-[#F3F6F5]"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Export Formats */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7676]">
                      Export Formats
                    </label>

                    <CustomDropdown
                      id="report-filter-format"
                      value={selectedFilterFormat}
                      options={filterFormatOptions}
                      onChange={setSelectedFilterFormat}
                      placeholder="All Formats"
                    />
                  </div>

                  {/* Duration */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7676]">
                      Duration
                    </label>

                    <CustomDropdown
                      id="report-filter-duration"
                      value={selectedFilterDuration}
                      options={filterDurationOptions}
                      onChange={setSelectedFilterDuration}
                      placeholder="All Time"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate */}
            <button
              type="button"
              onClick={openGenerateModal}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-[#0F8E77] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0C7965] active:scale-[0.98]"
            >
              <Plus size={15} strokeWidth={2.5} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Available Reports */}
        <section className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#262633]">
                Available Reports
              </h2>

              <p className="mt-1 text-xs text-[#8A939D]">
                Generated research reports saved for your account.
              </p>
            </div>

            <span className="rounded-full bg-[#EAF8F5] px-2.5 py-1 text-[10px] font-semibold text-[#0F8E77]">
              {filteredReports.length}{" "}
              {filteredReports.length === 1 ? "Report" : "Reports"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <LoaderCircle size={26} className="animate-spin text-[#0F8E77]" />
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="divide-y divide-[#EEF1F3]">
              {filteredReports.map((report) => {
                const format = getReportExtension(report);

                return (
                  <div
                    key={report.id}
                    className="flex flex-col gap-4 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF8F5]">
                        <FileText size={18} className="text-[#0F8E77]" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[#30343A]">
                          {report.name}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-[#8A939D]">
                          {report.experiment_name || "Research experiment"} •{" "}
                          {getReportTypeLabel(report.report_type)}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#A0A7AD]">
                          Generated {formatReportDate(report.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          format === "csv"
                            ? "border-[#B7DDD5] bg-[#F2FBF9] text-[#0F8E77]"
                            : "border-[#F0C9CB] bg-[#FFF4F4] text-[#C75A60]"
                        }`}
                      >
                        {getExportFormatLabel(format)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDownload(report)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE7E4] bg-white px-3 text-xs font-medium text-[#0F8E77] transition hover:bg-[#F4FBF9]"
                      >
                        <Download size={14} />
                        Download
                      </button>

                      <ActionMenu
                        report={report}
                        onView={handleView}
                        onDelete={requestDeleteReport}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[210px] items-center justify-center rounded-xl border border-dashed border-[#DDE3E8] bg-[#FAFBFC] text-center">
              <div>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F4F3]">
                  <FileText size={19} className="text-[#8A939D]" />
                </div>

                <p className="mt-3 text-sm font-medium text-[#3A4147]">
                  No reports found
                </p>

                <p className="mt-1 text-xs text-[#8A939D]">
                  Generate a report or change your search and filter options.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Generate Report Modal */}
        {isModalOpen &&
          createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-[#172321]/45 px-4 py-6 backdrop-blur-[2px]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeGenerateModal();
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="generate-report-title"
                className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-[#E2E8E6] bg-white shadow-[0_25px_70px_rgba(38,38,51,0.22)]"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-[#EEF1F3] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF8F5]">
                      <Sparkles size={19} className="text-[#0F8E77]" />
                    </div>

                    <div>
                      <h2
                        id="generate-report-title"
                        className="text-lg font-bold text-[#262633]"
                      >
                        Generate Report
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-[#7A848C]">
                        Select the research data, date range, and export format
                        for your report.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeGenerateModal}
                    disabled={isGenerating}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A939D] transition hover:bg-[#F3F6F5] hover:text-[#3A4147] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleGenerateReport}
                  className="space-y-5 px-6 py-6"
                >
                  {/* Report Type */}
                  <div>
                    <label
                      htmlFor="report-type"
                      className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                    >
                      Report Type
                    </label>

                    <CustomDropdown
                      id="report-type"
                      value={selectedReportType}
                      options={reportTypeOptions}
                      onChange={(value) => {
                        setSelectedReportType(value);

                        if (!reportNameEdited) {
                          const experiment = experiments.find(
                            (item) =>
                              String(item.id) === String(selectedExperimentId),
                          );

                          const typeLabel = getReportTypeLabel(value);

                          setReportName(
                            value
                              ? experiment
                                ? `${typeLabel} - ${experiment.name}`
                                : typeLabel
                              : "",
                          );
                        }
                      }}
                      placeholder="Select Report Type"
                    />

                    {selectedReportType && (
                      <p className="mt-2 text-[11px] text-[#8A939D]">
                        {
                          reportTypeOptions.find(
                            (item) => item.value === selectedReportType,
                          )?.description
                        }
                      </p>
                    )}
                  </div>

                  {/* Experiment */}
                  <div>
                    <label
                      htmlFor="report-experiment"
                      className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                    >
                      Experiment
                    </label>

                    <CustomDropdown
                      id="report-experiment"
                      value={selectedExperimentId}
                      options={[
                        {
                          value: "",
                          label: "Select Experiment",
                        },
                        ...experiments.map((experiment) => ({
                          value: String(experiment.id),
                          label: experiment.name,
                        })),
                      ]}
                      onChange={(value) => {
                        setSelectedExperimentId(value);

                        if (!reportNameEdited) {
                          const experiment = experiments.find(
                            (item) => String(item.id) === String(value),
                          );

                          const typeLabel =
                            getReportTypeLabel(selectedReportType);

                          setReportName(
                            value && selectedReportType
                              ? `${typeLabel} - ${experiment?.name || ""}`
                              : selectedReportType
                                ? typeLabel
                                : "",
                          );
                        }
                      }}
                      placeholder="Select Experiment"
                    />

                    <p className="mt-2 text-[11px] text-[#8A939D]">
                      Reports are generated for one experiment at a time so
                      every report has a clear research scope.
                    </p>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label
                      htmlFor="report-date-range"
                      className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                    >
                      Date Range
                    </label>

                    <CustomDropdown
                      id="report-date-range"
                      value={selectedDateRange}
                      options={modalDateRangeOptions}
                      onChange={setSelectedDateRange}
                      placeholder="Select Date Range"
                    />
                  </div>

                  {/* Custom Dates */}
                  {selectedDateRange === "custom" && (
                    <div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="report-start-date"
                            className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                          >
                            Start Date
                          </label>

                          <input
                            id="report-start-date"
                            type="date"
                            value={customStartDate}
                            max={yesterdayInputValue}
                            onChange={(event) =>
                              setCustomStartDate(event.target.value)
                            }
                            className={`h-9 w-full rounded-lg border bg-white px-3 text-[12px] text-[#56616A] outline-none transition focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10 ${
                              customDateError
                                ? "border-[#E8B8BB]"
                                : "border-[#DCE5E3]"
                            }`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="report-end-date"
                            className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                          >
                            End Date
                          </label>

                          <input
                            id="report-end-date"
                            type="date"
                            value={customEndDate}
                            max={todayInputValue}
                            onChange={(event) =>
                              setCustomEndDate(event.target.value)
                            }
                            className={`h-9 w-full rounded-lg border bg-white px-3 text-[12px] text-[#56616A] outline-none transition focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10 ${
                              customDateError
                                ? "border-[#E8B8BB]"
                                : "border-[#DCE5E3]"
                            }`}
                          />
                        </div>
                      </div>

                      {customDateError && (
                        <div className="mt-2 flex items-start gap-2 text-[11px] text-[#B6464B]">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />

                          <span>{customDateError}</span>
                        </div>
                      )}

                      <p className="mt-2 text-[11px] text-[#8A939D]">
                        Start date can be selected up to yesterday. End date can
                        be selected up to today.
                      </p>
                    </div>
                  )}

                  {/* Report Name */}
                  <div>
                    <label
                      htmlFor="report-name"
                      className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                    >
                      Report Name
                    </label>

                    <input
                      id="report-name"
                      name="report-name"
                      type="text"
                      maxLength={150}
                      value={reportName}
                      onChange={(event) => {
                        setReportName(event.target.value);

                        setReportNameEdited(true);
                      }}
                      placeholder={suggestedReportName || "Enter Report Name"}
                      className="h-9 w-full rounded-lg border border-[#DCE5E3] bg-white px-3 text-xs font-medium text-[#56616A] placeholder:text-[#8A939D] outline-none transition focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                    />

                    <p className="mt-2 text-[11px] text-[#8A939D]">
                      Keep the suggested name or customize it.
                    </p>
                  </div>

                  {/* Export Format */}
                  <div>
                    <label
                      htmlFor="report-export-format"
                      className="mb-1.5 block text-sm font-semibold text-[#3A4147]"
                    >
                      Export Format
                    </label>

                    <CustomDropdown
                      id="report-export-format"
                      value={selectedExportFormat}
                      options={exportFormatOptions}
                      onChange={setSelectedExportFormat}
                      placeholder="Select Export Format"
                    />

                    <p className="mt-2 text-[11px] text-[#8A939D]">
                      The generated file will be downloaded in this selected
                      format.
                    </p>
                  </div>

                  {/* Validation Error */}
                  {generationError && (
                    <div className="flex items-start gap-2 rounded-xl border border-[#F2C6C8] bg-[#FFF8F8] px-3 py-2.5 text-xs text-[#B6464B]">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />

                      <span>{generationError}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-col-reverse gap-2 border-t border-[#EEF1F3] pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeGenerateModal}
                      disabled={isGenerating}
                      className="h-10 rounded-xl border border-[#DCE5E3] bg-white px-5 text-xs font-semibold text-[#59646C] transition hover:bg-[#F7F9F8] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F8E77] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0C7965] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGenerating ? (
                        <>
                          <LoaderCircle size={15} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          Generate Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}

        {/* Delete Confirmation */}
        {reportToDelete &&
          createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#172321]/45 px-4 backdrop-blur-[2px]">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-[430px] rounded-2xl border border-[#E2E8E6] bg-white p-6 shadow-[0_25px_70px_rgba(38,38,51,0.22)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1F1]">
                  <Trash2 size={19} className="text-[#C65359]" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#262633]">
                  Delete Report?
                </h2>

                <p className="mt-2 text-sm leading-5 text-[#6F797F]">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#3A4147]">
                    "{reportToDelete.name}"
                  </span>
                  ? The generated file will also be removed.
                </p>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="h-10 rounded-xl border border-[#DCE5E3] bg-white px-5 text-xs font-semibold text-[#59646C] hover:bg-[#F7F9F8]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteReport}
                    disabled={isDeleting}
                    className="flex h-10 items-center gap-2 rounded-xl bg-[#C65359] px-5 text-xs font-semibold text-white transition hover:bg-[#AD454B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <>
                        <LoaderCircle size={15} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={15} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </DashboardLayout>
  );
}

export default Reports;
