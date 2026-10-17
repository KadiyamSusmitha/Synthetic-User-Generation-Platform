import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Ellipsis,
  Eye,
  FileText,
  FolderKanban,
  Lightbulb,
  Loader2,
  MessageSquareMore,
  Pencil,
  Play,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import {
  createExperiment,
  getExperiments,
  deleteExperiment,
  startExperiment,
  completeExperiment,
} from "../api/experiments";

/* =========================================================
   Date / Time Helpers
========================================================= */

function parseBackendDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  let normalizedValue = String(dateValue);

  /*
   Backend currently returns UTC datetime without timezone
   information, for example:

   2026-09-10T17:49:53

   Add Z so JavaScript correctly interprets it as UTC.
   If the backend later returns an explicit timezone, we
   leave it unchanged.
  */
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

function formatUpdatedTime(updatedAt, now = new Date()) {
  const updatedDate = parseBackendDate(updatedAt);

  if (!updatedDate) {
    return "-";
  }

  const differenceInSeconds = Math.floor(
    (now.getTime() - updatedDate.getTime()) / 1000,
  );

  /*
   If the browser and backend differ by a few seconds,
   don't display a negative value.
  */
  if (differenceInSeconds < 0) {
    return "Just now";
  }

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes}m ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours}h ago`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);

  if (differenceInDays < 7) {
    return `${differenceInDays}d ago`;
  }

  const differenceInWeeks = Math.floor(differenceInDays / 7);

  if (differenceInWeeks < 5) {
    return `${differenceInWeeks}w ago`;
  }

  return updatedDate.toLocaleDateString();
}

/* =========================================================
   Status Styling
========================================================= */

function getStatusClasses(status) {
  switch (status) {
    case "In Progress":
      return "bg-[#EAF7FF] text-[#3193C8] px-3 py-1.5 text-[12px]";

    case "Completed":
      return "bg-[#E7F6F2] text-[#0F8E77] px-3 py-1.5 text-[12px]";

    case "Draft":
    default:
      return "bg-[#FFF2DF] text-[#E58A20] px-3 py-1.5 text-[12px]";
  }
}

/* =========================================================
   Experiments Page
========================================================= */

function Experiments() {
  const navigate = useNavigate();

  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreatingExperiment, setIsCreatingExperiment] = useState(false);

  const [creating, setCreating] = useState(false);

  /*
   Used only to refresh relative Updated times while the
   page is open.

   This does NOT make API requests.
  */
  const [currentTime, setCurrentTime] = useState(new Date());

  const [openActionMenu, setOpenActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    targetAudience: "",
    researchGoal: "",
    additionalNotes: "",
  });

  /* =======================================================
     Refresh Relative Time
  ======================================================= */

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  /* =======================================================
     Load Experiments
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadExperiments() {
      try {
        const data = await getExperiments();

        if (isMounted) {
          setExperiments(data);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.status === 401) {
          localStorage.removeItem("synuserAccessToken");
          localStorage.removeItem("synuserUser");
          localStorage.removeItem("synuserLoggedIn");

          navigate("/", {
            replace: true,
          });

          return;
        }

        toast.error(error.message || "Failed to load experiments.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExperiments();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  /* =======================================================
     Create Experiment
  ======================================================= */

  function openCreateExperiment() {
    setFormData({
      name: "",
      targetAudience: "",
      researchGoal: "",
      additionalNotes: "",
    });

    setIsCreatingExperiment(true);
  }

  function closeCreateExperiment() {
    setIsCreatingExperiment(false);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleCreateExperiment(event) {
    event.preventDefault();

    const name = formData.name.trim();
    const targetAudience = formData.targetAudience.trim();
    const researchGoal = formData.researchGoal.trim();
    const additionalNotes = formData.additionalNotes.trim();

    if (!name) {
      toast.error("Please enter an experiment name.");
      return;
    }

    if (!targetAudience) {
      toast.error("Please enter the target audience.");
      return;
    }

    if (!researchGoal) {
      toast.error("Please enter the research goal.");
      return;
    }

    if (creating) {
      return;
    }

    try {
      setCreating(true);

      const description = [
        `Research Goal: ${researchGoal}`,
        additionalNotes ? `Additional Notes: ${additionalNotes}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const createdExperiment = await createExperiment(
        name,
        targetAudience,
        description,
      );

      setExperiments((previousExperiments) => [
        createdExperiment,
        ...previousExperiments,
      ]);

      toast.success("Experiment created successfully.");

      setFormData({
        name: "",
        targetAudience: "",
        researchGoal: "",
        additionalNotes: "",
      });

      setIsCreatingExperiment(false);
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");
        localStorage.removeItem("synuserUser");
        localStorage.removeItem("synuserLoggedIn");

        navigate("/", {
          replace: true,
        });

        return;
      }

      toast.error(
        error.message || "Failed to create experiment. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  /* =======================================================
     Action Menu
  ======================================================= */

  /* =======================================================
   Action Menu
======================================================= */

  function toggleActionMenu(experimentId, event) {
    const buttonRect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 144;
    const menuHeight = 176;
    const menuGap = 8;
    const viewportPadding = 8;

    let left = buttonRect.right - menuWidth;

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuWidth - viewportPadding;
    }

    let top = buttonRect.bottom + menuGap;

    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = buttonRect.top - menuHeight - menuGap;
    }

    setOpenActionMenu((currentMenu) => {
      if (currentMenu?.experimentId === experimentId) {
        return null;
      }

      return {
        experimentId,
        top,
        left,
      };
    });
  }

  function handleViewExperiment(experimentId) {
    setOpenActionMenu(null);

    navigate(`/experiments/${experimentId}`);
  }

  function handleEditExperiment(experimentId) {
    setOpenActionMenu(null);

    navigate(`/experiments/${experimentId}/edit`);
  }

  async function handleStartExperiment(experimentId) {
    setOpenActionMenu(null);

    try {
      const updatedExperiment = await startExperiment(experimentId);

      setExperiments((currentExperiments) =>
        currentExperiments.map((experiment) =>
          experiment.id === experimentId ? updatedExperiment : experiment,
        ),
      );

      toast.success("Experiment started successfully.");
    } catch (error) {
      if (error.status === 401) {
        toast.error("Your session has expired. Please login again.");

        navigate("/");
        return;
      }

      toast.error(error.message || "Failed to start experiment.");
    }
  }

  async function handleCompleteExperiment(experimentId) {
    setOpenActionMenu(null);

    try {
      const updatedExperiment = await completeExperiment(experimentId);

      setExperiments((currentExperiments) =>
        currentExperiments.map((experiment) =>
          experiment.id === experimentId ? updatedExperiment : experiment,
        ),
      );

      toast.success("Experiment completed successfully.");
    } catch (error) {
      if (error.status === 401) {
        toast.error("Your session has expired. Please login again.");

        navigate("/");
        return;
      }

      toast.error(error.message || "Failed to complete experiment.");
    }
  }

  async function handleDeleteExperiment(experimentId) {
    setOpenActionMenu(null);

    const confirmed = window.confirm(
      "Are you sure you want to delete this experiment?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteExperiment(experimentId);

      setExperiments((currentExperiments) =>
        currentExperiments.filter(
          (experiment) => experiment.id !== experimentId,
        ),
      );

      toast.success("Experiment deleted successfully.");
    } catch (error) {
      if (error.status === 401) {
        toast.error("Your session has expired. Please login again.");
        navigate("/");
        return;
      }

      toast.error(error.message || "Failed to delete experiment.");
    }
  }

  /* =======================================================
     Create Experiment Screen
  ======================================================= */

  if (isCreatingExperiment) {
    return (
      <DashboardLayout>
        {/* Create Experiment Header */}
        <section className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#262633]">
              Create New Experiment
            </h1>

            <p className="mt-1 text-sm text-[#626975]">
              Fill in the details to start your research.
            </p>
          </div>

          <button
            type="button"
            onClick={closeCreateExperiment}
            className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-[#6B747B] transition hover:text-[#0F8E77]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to Experiments
          </button>
        </section>

        {/* Create Experiment Card */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr]">
            {/* Left - Form */}
            <div className="border-b border-[#E8EEED] p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <form onSubmit={handleCreateExperiment} className="max-w-md">
                {/* Experiment Name */}
                <div className="mb-3">
                  <label
                    htmlFor="experiment-name"
                    className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                  >
                    Experiment Name
                  </label>

                  <input
                    id="experiment-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Food Delivery App Study"
                    className="h-8 w-full resize-none rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* Target Audience */}
                <div className="mb-3">
                  <label
                    htmlFor="target-audience"
                    className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                  >
                    Target Audience
                  </label>

                  <input
                    id="target-audience"
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleFormChange}
                    placeholder="e.g. College Students in Urban Areas"
                    className="h-8 w-full resize-none rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* Research Goal */}
                <div className="mb-3">
                  <label
                    htmlFor="research-goal"
                    className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                  >
                    Research Goal
                  </label>

                  <textarea
                    id="research-goal"
                    name="researchGoal"
                    value={formData.researchGoal}
                    onChange={handleFormChange}
                    placeholder="What do you want to learn?"
                    rows={1}
                    className="h-8 w-full resize-none rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* Additional Notes */}
                <div className="mb-4">
                  <label
                    htmlFor="additional-notes"
                    className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                  >
                    Additional Notes
                    <span className="ml-1 font-normal text-[#8A9299]">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="additional-notes"
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleFormChange}
                    placeholder="Anything else we should know?"
                    rows={1}
                    className="h-8 w-full resize-none rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* Create Button */}
                <button
                  type="submit"
                  disabled={creating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0C7A66] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={2}
                      />
                      Creating...
                    </>
                  ) : (
                    "Create Experiment"
                  )}
                </button>
              </form>
            </div>

            {/* Right - What Happens Next */}
            <div className="bg-[#F8FAFA] p-4 sm:p-5">
              <div className="max-w-md">
                <h2 className="text-base font-bold text-[#262633]">
                  What happens next?
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#7A838B]">
                  Your experiment will guide the next stages of your research.
                </p>

                {/* Step 1 */}
                <div className="mt-4 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F3F2]">
                    <MessageSquareMore
                      className="h-4.5 w-4.5 text-[#5D7185]"
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#262633]">
                      Generate Personas
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-[#7A838B]">
                      AI will create realistic user personas based on your
                      experiment.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="mt-4 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7]">
                    <UserRound
                      className="h-4.5 w-4.5 text-[#5D7185]"
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#262633]">
                      Run Surveys / Interviews
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-[#7A838B]">
                      Collect insights from your synthetic users.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="mt-4 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F3F2]">
                    <Lightbulb
                      className="h-4.5 w-4.5 text-[#0F8E77]"
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#262633]">
                      Get AI Insights
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-[#7A838B]">
                      Understand patterns, themes, and important findings.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="mt-4 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F3F2]">
                    <FileText
                      className="h-4.5 w-4.5 text-[#0F8E77]"
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#262633]">
                      Generate Report
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-[#7A838B]">
                      Export a professional research report with your findings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  /* =======================================================
     Experiments List Screen
  ======================================================= */

  return (
    <DashboardLayout>
      {/* Page Header */}
      <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#262633] sm:text-3xl">
            Experiments
          </h1>

          <p className="mt-1.5 text-sm text-[#626975]">
            Manage and track all your research experiments.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateExperiment}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F8E77] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0C7A66] hover:shadow-md"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New Experiment
        </button>
      </section>

      {/* Experiments Table */}
      <section className="overflow-visible rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed">
            <colgroup>
              <col className="w-[31%]" />
              <col className="w-[20%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[17%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E8EEED]">
                <th className="px-5 py-4 text-left text-[14px] font-bold text-[#4F5A61]">
                  Name
                </th>

                <th className="px-4 py-4 text-left text-[14px] font-bold text-[#4F5A61]">
                  Target Audience
                </th>

                <th className="px-4 py-4 text-left text-[14px] font-bold text-[#4F5A61]">
                  Personas
                </th>

                <th className="px-5 py-4 pl-6 text-left text-[14px] font-bold text-[#4F5A61]">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-[14px] font-bold text-[#4F5A61]">
                  Updated
                </th>

                <th className="w-12 px-3 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Loading State */}
              {loading && (
                <tr>
                  <td colSpan="6" className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2
                        className="h-6 w-6 animate-spin text-[#0F8E77]"
                        strokeWidth={2}
                      />

                      <p className="mt-3 text-sm text-[#7A838B]">
                        Loading experiments...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {!loading && experiments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F3F2]">
                        <FolderKanban
                          className="h-6 w-6 text-[#0F8E77]"
                          strokeWidth={1.8}
                        />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-[#262633]">
                        No experiments yet
                      </h3>

                      <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#8A9299]">
                        Create your first experiment to start generating
                        synthetic users and conducting research.
                      </p>

                      <button
                        type="button"
                        onClick={openCreateExperiment}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#DCE8E6] bg-white px-4 py-2 text-xs font-medium text-[#0F8E77] transition hover:bg-[#F4FAF9]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        Create Your First Experiment
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Dynamic Experiment Rows */}
              {!loading &&
                experiments.map((experiment) => (
                  <tr
                    key={experiment.id}
                    className="border-b border-[#EEF2F1] last:border-b-0 transition hover:bg-[#FAFCFC]"
                  >
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="max-w-[210px]">
                        <p className="truncate text-sm font-semibold text-[#262633]">
                          {experiment.name}
                        </p>
                      </div>
                    </td>

                    {/* Target Audience */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-[#626975]">
                        {experiment.target_audience || "-"}
                      </span>
                    </td>

                    {/* Personas */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-[#626975]">
                        {experiment.persona_count}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                          experiment.status,
                        )}`}
                      >
                        {experiment.status}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-[#626975]">
                        {formatUpdatedTime(experiment.updated_at, currentTime)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-4 text-center">
                      <button
                        type="button"
                        aria-label={`Actions for ${experiment.name}`}
                        aria-expanded={openActionMenu === experiment.id}
                        onClick={(event) =>
                          toggleActionMenu(experiment.id, event)
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#7A838B] transition hover:bg-[#F0F5F4] hover:text-[#262633]"
                      >
                        <Ellipsis className="h-4 w-4" strokeWidth={2} />
                      </button>

                      {/* Action Menu */}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {openActionMenu &&
        createPortal(
          <div
            className="fixed z-[100] w-44 overflow-hidden rounded-xl border border-[#E3EBE9] bg-white py-1 text-left shadow-lg"
            style={{
              top: `${openActionMenu.top}px`,
              left: `${openActionMenu.left}px`,
            }}
          >
            <button
              type="button"
              onClick={() => handleViewExperiment(openActionMenu.experimentId)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#3D454C] transition hover:bg-[#F4FAF9] hover:text-[#0F8E77]"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              View
            </button>

            <button
              type="button"
              onClick={() => handleEditExperiment(openActionMenu.experimentId)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#3D454C] transition hover:bg-[#F4FAF9] hover:text-[#0F8E77]"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit
            </button>

            {(() => {
              const selectedExperiment = experiments.find(
                (experiment) => experiment.id === openActionMenu.experimentId,
              );

              if (selectedExperiment?.status === "Draft") {
                return (
                  <button
                    type="button"
                    onClick={() => handleStartExperiment(selectedExperiment.id)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#3D454C] transition hover:bg-[#F4FAF9] hover:text-[#0F8E77]"
                  >
                    <Play className="h-3.5 w-3.5" strokeWidth={2} />
                    Start Experiment
                  </button>
                );
              }

              if (selectedExperiment?.status === "In Progress") {
                return (
                  <button
                    type="button"
                    onClick={() =>
                      handleCompleteExperiment(selectedExperiment.id)
                    }
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#3D454C] transition hover:bg-[#F4FAF9] hover:text-[#0F8E77]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Complete Experiment
                  </button>
                );
              }

              return null;
            })()}

            <button
              type="button"
              onClick={() =>
                handleDeleteExperiment(openActionMenu.experimentId)
              }
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#D44C4C] transition hover:bg-[#FFF5F5]"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </DashboardLayout>
  );
}

export default Experiments;
