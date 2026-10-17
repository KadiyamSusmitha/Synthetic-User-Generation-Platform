import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareMore,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { getExperiment, updateExperiment } from "../api/experiments";

/* =========================================================
   Description Helpers
========================================================= */

function parseDescription(description) {
  if (!description) {
    return {
      researchGoal: "",
      additionalNotes: "",
    };
  }

  const researchGoalPrefix = "Research Goal:";
  const additionalNotesPrefix = "Additional Notes:";

  let researchGoal = "";
  let additionalNotes = "";

  const researchGoalIndex = description.indexOf(researchGoalPrefix);

  const additionalNotesIndex = description.indexOf(additionalNotesPrefix);

  if (researchGoalIndex !== -1) {
    const researchGoalStart = researchGoalIndex + researchGoalPrefix.length;

    const researchGoalEnd =
      additionalNotesIndex !== -1 ? additionalNotesIndex : description.length;

    researchGoal = description.slice(researchGoalStart, researchGoalEnd).trim();
  }

  if (additionalNotesIndex !== -1) {
    additionalNotes = description
      .slice(additionalNotesIndex + additionalNotesPrefix.length)
      .trim();
  }

  return {
    researchGoal,
    additionalNotes,
  };
}

/* =========================================================
   Edit Experiment Page
========================================================= */

function EditExperiment() {
  const navigate = useNavigate();
  const { experimentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    targetAudience: "",
    researchGoal: "",
    additionalNotes: "",
  });

  /* =======================================================
     Load Experiment
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadExperiment() {
      try {
        const data = await getExperiment(experimentId);

        if (!isMounted) {
          return;
        }

        const descriptionData = parseDescription(data.description);

        setFormData({
          name: data.name || "",
          targetAudience: data.target_audience || "",
          researchGoal: descriptionData.researchGoal,
          additionalNotes: descriptionData.additionalNotes,
        });
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

        if (error.status === 404) {
          toast.error("Experiment not found.");

          navigate("/experiments", {
            replace: true,
          });

          return;
        }

        toast.error(error.message || "Failed to load experiment.");
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

  /* =======================================================
     Form Change
  ======================================================= */

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  /* =======================================================
     Save Changes
  ======================================================= */

  async function handleSaveChanges(event) {
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

    if (saving) {
      return;
    }

    const description = [
      `Research Goal: ${researchGoal}`,
      additionalNotes ? `Additional Notes: ${additionalNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      setSaving(true);

      await updateExperiment(
        Number(experimentId),
        name,
        targetAudience,
        description,
      );

      toast.success("Experiment updated successfully.");

      navigate("/experiments");
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
        error.message || "Failed to update experiment. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     Loading Screen
  ======================================================= */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2
              className="h-6 w-6 animate-spin text-[#0F8E77]"
              strokeWidth={2}
            />

            <p className="mt-3 text-sm text-[#7A838B]">Loading experiment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =======================================================
     Edit Screen
  ======================================================= */

  return (
    <DashboardLayout>
      {/* Header */}
      <section className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#262633]">
            Edit Experiment
          </h1>

          <p className="mt-1 text-sm text-[#626975]">
            Update the details of your research experiment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/experiments")}
          className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-[#6B747B] transition hover:text-[#0F8E77]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to Experiments
        </button>
      </section>

      {/* Edit Card */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr]">
          {/* Left - Form */}
          <div className="border-b border-[#E8EEED] p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <form onSubmit={handleSaveChanges} className="max-w-md">
              {/* Experiment Name */}
              <div className="mb-3">
                <label
                  htmlFor="edit-experiment-name"
                  className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                >
                  Experiment Name
                </label>

                <input
                  id="edit-experiment-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Food Delivery App Study"
                  className="h-8 w-full rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                />
              </div>

              {/* Target Audience */}
              <div className="mb-3">
                <label
                  htmlFor="edit-target-audience"
                  className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                >
                  Target Audience
                </label>

                <input
                  id="edit-target-audience"
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleFormChange}
                  placeholder="e.g. College Students in Urban Areas"
                  className="h-8 w-full rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                />
              </div>

              {/* Research Goal */}
              <div className="mb-3">
                <label
                  htmlFor="edit-research-goal"
                  className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                >
                  Research Goal
                </label>

                <textarea
                  id="edit-research-goal"
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
                  htmlFor="edit-additional-notes"
                  className="mb-1.5 block text-[14px] font-semibold text-[#3D454C]"
                >
                  Additional Notes
                  <span className="ml-1 font-normal text-[#8A9299]">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="edit-additional-notes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleFormChange}
                  placeholder="Anything else we should know?"
                  rows={1}
                  className="h-8 w-full resize-none rounded-lg border border-[#DCE5E3] bg-white px-3 py-1 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A8AD] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0C7A66] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>

          {/* Right - What Happens Next */}
          <div className="bg-[#F8FAFA] p-4 sm:p-5">
            <div className="max-w-md">
              <h2 className="text-base font-bold text-[#262633]">
                Experiment Workflow
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#7A838B]">
                Your experiment guides the next stages of your research.
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

export default EditExperiment;
