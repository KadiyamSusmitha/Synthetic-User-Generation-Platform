import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  Target,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { getExperiment } from "../api/experiments";

function parseBackendDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  let normalizedValue = String(dateValue);

  if (
    !normalizedValue.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(normalizedValue)
  ) {
    normalizedValue = `${normalizedValue}Z`;
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function formatDateTime(dateValue) {
  const date = parseBackendDate(dateValue);

  if (!date) {
    return "-";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClasses(status) {
  switch (status) {
    case "In Progress":
      return "bg-[#E7F6F2] text-[#0F8E77]";

    case "Completed":
      return "bg-[#E7F6F2] text-[#0F8E77]";

    case "Draft":
    default:
      return "bg-[#FFF2DF] text-[#E58A20]";
  }
}

function getExperimentDetails(description) {
  if (!description) {
    return {
      researchGoal: "",
      additionalNotes: "",
    };
  }

  const sections = description.split("\n\n");

  let researchGoal = "";
  let additionalNotes = "";

  sections.forEach((section) => {
    if (section.startsWith("Research Goal:")) {
      researchGoal = section
        .replace("Research Goal:", "")
        .trim();
    }

    if (section.startsWith("Additional Notes:")) {
      additionalNotes = section
        .replace("Additional Notes:", "")
        .trim();
    }
  });

  if (!researchGoal && !additionalNotes) {
    researchGoal = description.trim();
  }

  return {
    researchGoal,
    additionalNotes,
  };
}

function ExperimentDetails() {
  const { experimentId } = useParams();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadExperiment() {
      try {
        const data = await getExperiment(
          experimentId
        );

        if (isMounted) {
          setExperiment(data);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.status === 401) {
          localStorage.removeItem(
            "synuserAccessToken"
          );
          localStorage.removeItem("synuserUser");
          localStorage.removeItem(
            "synuserLoggedIn"
          );

          navigate("/", {
            replace: true,
          });

          return;
        }

        if (error.status === 404) {
          toast.error(
            "Experiment not found."
          );

          navigate("/experiments", {
            replace: true,
          });

          return;
        }

        toast.error(
          error.message ||
            "Failed to load experiment."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExperiment();

    return () => {
      isMounted = false;
    };
  }, [experimentId, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2
              className="h-7 w-7 animate-spin text-[#0F8E77]"
              strokeWidth={2}
            />

            <p className="mt-3 text-sm text-[#7A838B]">
              Loading experiment...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!experiment) {
    return null;
  }

  const {
    researchGoal,
    additionalNotes,
  } = getExperimentDetails(
    experiment.description
  );

  return (
    <DashboardLayout>
      {/* Page Header */}
      <section className="mb-6">
        <button
          type="button"
          onClick={() =>
            navigate("/experiments")
          }
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B747B] transition hover:text-[#0F8E77]"
        >
          <ArrowLeft
            className="h-4 w-4"
            strokeWidth={2}
          />
          Back to Experiments
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#262633] sm:text-3xl">
              {experiment.name}
            </h1>

            <p className="mt-1.5 text-sm text-[#626975]">
              Experiment details and research information.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
              experiment.status
            )}`}
          >
            {experiment.status}
          </span>
        </div>
      </section>

      {/* Overview */}
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Target Audience */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F3F2]">
              <Target
                className="h-4.5 w-4.5 text-[#0F8E77]"
                strokeWidth={2}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#8A9299]">
                Target Audience
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#262633]">
                {experiment.target_audience ||
                  "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Personas */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2F7]">
              <Users
                className="h-4.5 w-4.5 text-[#5D7185]"
                strokeWidth={2}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#8A9299]">
                Personas
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#262633]">
                {experiment.persona_count}
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F3F2]">
              <CalendarDays
                className="h-4.5 w-4.5 text-[#0F8E77]"
                strokeWidth={2}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#8A9299]">
                Last Updated
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#262633]">
                {formatDateTime(
                  experiment.updated_at
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experiment Information */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="border-b border-[#E8EEED] px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText
              className="h-4 w-4 text-[#0F8E77]"
              strokeWidth={2}
            />

            <h2 className="text-base font-bold text-[#262633]">
              Experiment Information
            </h2>
          </div>
        </div>

        <div className="space-y-6 p-5">
          {/* Experiment Name */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Experiment Name
            </p>

            <p className="mt-1.5 text-sm font-semibold text-[#262633]">
              {experiment.name}
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Target Audience
            </p>

            <p className="mt-1.5 text-sm font-semibold text-[#3D454C]">
              {experiment.target_audience ||
                "-"}
            </p>
          </div>

          {/* Research Goal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Research Goal
            </p>

            <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#3D454C]">
              {researchGoal || "-"}
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Additional Notes
            </p>

            <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#3D454C]">
              {additionalNotes || "-"}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Status
            </p>

            <span
              className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                experiment.status
              )}`}
            >
              {experiment.status}
            </span>
          </div>

          {/* Created */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Created
            </p>

            <p className="mt-1.5 text-sm font-semibold text-[#3D454C]">
              {formatDateTime(
                experiment.created_at
              )}
            </p>
          </div>

          {/* Updated */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A9299]">
              Last Updated
            </p>

            <p className="mt-1.5 text-sm font-semibold text-[#3D454C]">
              {formatDateTime(
                experiment.updated_at
              )}
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default ExperimentDetails;