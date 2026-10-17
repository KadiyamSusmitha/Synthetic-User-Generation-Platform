import { useEffect, useState } from "react";
import {
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  PlusCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import {
  deleteSurvey,
  getSurveyQuestions,
  updateSurvey,
  updateSurveyQuestion,
  createSurveyQuestion,
  deleteSurveyQuestion,
  getSurveys,
  markSurveyReady,
  getSyntheticResponses,
} from "../api/surveys";

import { generateSyntheticResponses } from "../api/syntheticResponses";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const normalizedValue =
    typeof value === "string" && !value.endsWith("Z") && !value.includes("+")
      ? `${value}Z`
      : value;

  const date = new Date(normalizedValue);

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
}

function getStatusClasses(status) {
  switch (status) {
    case "Ready":
      return "bg-[#E7F6F2] text-[#0F8E77]";

    case "In Progress":
      return "bg-[#E7F6F2] text-[#3193C8]";

    case "Completed":
      return "bg-[#E7F6F2] text-[#0F8E77]";

    default:
      return "bg-[#FFF2DF] text-[#E58A20]";
  }
}

const QUESTION_TYPES = [
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "rating", label: "Rating" },
  { value: "yes_no", label: "Yes / No" },
  { value: "likert", label: "Likert Scale" },
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
];

function getQuestionTypeLabel(type) {
  return (
    QUESTION_TYPES.find((item) => item.value === type)?.label ||
    type ||
    "Unknown"
  );
}

function QuestionTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const selectedOption =
    QUESTION_TYPES.find((option) => option.value === value) ||
    QUESTION_TYPES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#262633] outline-none transition hover:border-[#0F8E77] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedOption.label}</span>

        <span
          className={`text-[#8A9099] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[20] mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          {QUESTION_TYPES.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full rounded-md px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? "bg-[#0F8E77] text-white"
                    : "text-[#626975] hover:bg-[#0F8E77] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function requiresOptions(type) {
  return (
    type === "single_choice" || type === "multiple_choice" || type === "likert"
  );
}

function emptyQuestion(order = 0) {
  return {
    id: null,
    question: "",
    question_type: "single_choice",
    options: ["", ""],
    required: false,
    display_order: order,
  };
}

/* ============================================================
   VIEW SURVEY MODAL
============================================================ */

function SurveyViewModal({ survey, questions, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#262633]">Survey Details</h2>

            <p className="mt-0.5 text-xs text-[#8A9099]">Survey #{survey.id}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#626975] hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#F8FAFA] p-4">
              <p className="text-xs text-[#8A9099]">Title</p>

              <p className="mt-1 text-sm font-semibold text-[#262633]">
                {survey.title}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8FAFA] p-4">
              <p className="text-xs text-[#8A9099]">Status</p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                  survey.status,
                )}`}
              >
                {survey.status || "Draft"}
              </span>
            </div>

            <div className="rounded-xl bg-[#F8FAFA] p-4">
              <p className="text-xs text-[#8A9099]">Experiment</p>

              <p className="mt-1 text-sm font-semibold text-[#262633]">
                {survey.experiment_id
                  ? `Experiment #${survey.experiment_id}`
                  : "Not connected"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#262633]">Questions</h3>

              <span className="text-xs text-[#8A9099]">
                {questions.length} question
                {questions.length === 1 ? "" : "s"}
              </span>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-[#8A9099]">
                  No questions have been added to this survey.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question.id || index}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E7F3F2] text-xs font-bold text-[#0F8E77]">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#262633]">
                            {question.question}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-[#626975]">
                              {getQuestionTypeLabel(question.question_type)}
                            </span>

                            {question.required && (
                              <span className="rounded-full bg-[#FFF2DF] px-2.5 py-1 text-[11px] text-[#E58A20]">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {question.options?.length > 0 && (
                      <div className="mt-3 ml-10 space-y-1.5">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="rounded-lg bg-[#F8FAFA] px-3 py-2 text-xs text-[#626975]"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#626975] hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EDIT SURVEY MODAL
============================================================ */

function SurveyEditModal({ survey, initialQuestions, onClose, onSaved }) {
  const [title, setTitle] = useState(survey.title || "");

  const [questions, setQuestions] = useState(
    initialQuestions.map((question, index) => ({
      ...question,
      options:
        Array.isArray(question.options) && question.options.length > 0
          ? [...question.options]
          : requiresOptions(question.question_type)
            ? ["", ""]
            : [],
      display_order: index,
    })),
  );

  const [saving, setSaving] = useState(false);

  const updateQuestion = (index, field, value) => {
    setQuestions((previous) =>
      previous.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              [field]: value,
            }
          : question,
      ),
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        const options = [...(question.options || [])];

        options[optionIndex] = value;

        return {
          ...question,
          options,
        };
      }),
    );
  };

  const addOption = (questionIndex) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: [...(question.options || []), ""],
            }
          : question,
      ),
    );
  };

  const removeOption = (questionIndex, optionIndex) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        const options = (question.options || []).filter(
          (_, currentIndex) => currentIndex !== optionIndex,
        );

        return {
          ...question,
          options,
        };
      }),
    );
  };

  const addQuestion = () => {
    setQuestions((previous) => [...previous, emptyQuestion(previous.length)]);
  };

  const removeQuestion = async (index) => {
    const question = questions[index];

    if (!question.id) {
      setQuestions((previous) =>
        previous.filter((_, currentIndex) => currentIndex !== index),
      );

      return;
    }

    try {
      await deleteSurveyQuestion(survey.id, question.id);

      setQuestions((previous) =>
        previous.filter((_, currentIndex) => currentIndex !== index),
      );

      toast.success("Question deleted successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to delete question.");
    }
  };

  const saveChanges = async () => {
    if (!title.trim()) {
      toast.error("Survey title is required.");
      return;
    }

    for (const question of questions) {
      if (!question.question.trim()) {
        toast.error("Question text cannot be empty.");
        return;
      }

      if (
        requiresOptions(question.question_type) &&
        (!question.options ||
          question.options.filter((option) => option.trim()).length < 2)
      ) {
        toast.error("Choice-based questions must have at least two options.");

        return;
      }
    }

    setSaving(true);

    try {
      await updateSurvey(survey.id, title.trim());

      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];

        const payload = {
          question: question.question.trim(),

          question_type: question.question_type,

          options: requiresOptions(question.question_type)
            ? (question.options || [])
                .map((option) => option.trim())
                .filter(Boolean)
            : [],

          required: question.required,

          display_order: index,
        };

        if (question.id) {
          await updateSurveyQuestion(survey.id, question.id, payload);
        } else {
          await createSurveyQuestion(survey.id, payload);
        }
      }

      toast.success("Survey updated successfully.");

      onSaved();
    } catch (error) {
      toast.error(error.message || "Failed to update survey.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#262633]">Edit Survey</h2>

            <p className="mt-0.5 text-xs text-[#8A9099]">
              Update the survey and its questions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#626975] hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <label className="block text-sm font-semibold text-[#262633]">
            Survey Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#262633] outline-none focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
            placeholder="Enter survey title"
          />

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#262633]">Questions</h3>

            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1.5 rounded-lg bg-[#E7F3F2] px-3 py-2 text-xs font-semibold text-[#0F8E77] hover:bg-[#DDF0ED]"
            >
              <PlusCircle size={15} />
              Add Question
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-[#8A9099]">
                  No questions. Add a question to this survey.
                </p>
              </div>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.id || `new-${index}`}
                  className="rounded-xl border border-gray-100 bg-[#FAFBFB] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8A9099]">
                      Question {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>

                  <textarea
                    value={question.question}
                    onChange={(event) =>
                      updateQuestion(index, "question", event.target.value)
                    }
                    rows={2}
                    className="mt-3 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#262633] outline-none focus:border-[#0F8E77]"
                    placeholder="Enter question"
                  />

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-[#626975]">
                        Question Type
                      </label>

                      <QuestionTypeDropdown
                        value={question.question_type}
                        onChange={(type) => {
                          updateQuestion(index, "question_type", type);

                          if (!requiresOptions(type)) {
                            updateQuestion(index, "options", []);
                          } else if (
                            !question.options ||
                            question.options.length < 2
                          ) {
                            updateQuestion(index, "options", ["", ""]);
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#626975]">
                        <input
                          type="checkbox"
                          checked={Boolean(question.required)}
                          onChange={(event) =>
                            updateQuestion(
                              index,
                              "required",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 accent-[#0F8E77]"
                        />
                        Required question
                      </label>
                    </div>
                  </div>

                  {requiresOptions(question.question_type) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#626975]">
                          Options
                        </label>

                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="text-xs font-semibold text-[#0F8E77] hover:underline"
                        >
                          + Add option
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(event) =>
                                updateOption(
                                  index,
                                  optionIndex,
                                  event.target.value,
                                )
                              }
                              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0F8E77]"
                              placeholder={`Option ${optionIndex + 1}`}
                            />

                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#626975] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0C7A66] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SURVEYS PAGE
============================================================ */

function Surveys() {
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [openMenu, setOpenMenu] = useState(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  const [viewSurvey, setViewSurvey] = useState(null);

  const [viewQuestions, setViewQuestions] = useState([]);

  const [viewLoading, setViewLoading] = useState(false);

  const [editSurvey, setEditSurvey] = useState(null);

  const [editQuestions, setEditQuestions] = useState([]);

  const [editLoading, setEditLoading] = useState(false);

  /* SYNTHETIC RESPONSE GENERATION STATE */
  const [generatingSurveyId, setGeneratingSurveyId] = useState(null);

  const [showSyntheticResponses, setShowSyntheticResponses] = useState(false);
  const [syntheticResponses, setSyntheticResponses] = useState(null);
  const [syntheticResponsesLoading, setSyntheticResponsesLoading] =
    useState(false);
  const [syntheticResponsesError, setSyntheticResponsesError] = useState("");
  useEffect(() => {
    async function loadSurveys() {
      try {
        const data = await getSurveys();

        const normalizedSurveys = Array.isArray(data) ? data : [];

        const sortedSurveys = [...normalizedSurveys].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );

        setSurveys(sortedSurveys);
      } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem("synuserAccessToken");

          localStorage.removeItem("synuserUser");

          localStorage.removeItem("synuserLoggedIn");

          navigate("/");

          return;
        }

        toast.error(error.message || "Failed to load surveys.");
      } finally {
        setLoading(false);
      }
    }

    loadSurveys();
  }, [navigate]);

  const filteredSurveys = surveys.filter((survey) =>
    survey.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (survey) => {
    const confirmed = window.confirm(
      `Delete "${survey.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSurvey(survey.id);

      setSurveys((previous) =>
        previous.filter((item) => item.id !== survey.id),
      );

      setOpenMenu(null);

      toast.success("Survey deleted successfully.");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");

        localStorage.removeItem("synuserUser");

        localStorage.removeItem("synuserLoggedIn");

        navigate("/");

        return;
      }

      toast.error(error.message || "Failed to delete survey.");
    }
  };

  const handleMarkReady = async (survey) => {
    setOpenMenu(null);

    if (survey.status === "Ready") {
      toast.info("Survey is already ready.");

      return;
    }

    try {
      await markSurveyReady(survey.id);

      const refreshedSurveys = await getSurveys();

      const sortedSurveys = [...refreshedSurveys].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );

      setSurveys(sortedSurveys);

      toast.success("Survey marked as ready.");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");

        localStorage.removeItem("synuserUser");

        localStorage.removeItem("synuserLoggedIn");

        navigate("/");

        return;
      }

      if (error.status === 409) {
        toast.info(error.message || "Survey is already ready.");

        return;
      }

      toast.error(error.message || "Failed to mark survey as ready.");
    }
  };

  const handleView = async (survey) => {
    setOpenMenu(null);

    setViewLoading(true);

    setViewSurvey(survey);

    setViewQuestions([]);

    try {
      const questions = await getSurveyQuestions(survey.id);

      setViewQuestions(Array.isArray(questions) ? questions : []);
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");

        localStorage.removeItem("synuserUser");

        localStorage.removeItem("synuserLoggedIn");

        navigate("/");

        return;
      }

      toast.error(error.message || "Failed to load survey details.");

      setViewSurvey(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEdit = async (survey) => {
    setOpenMenu(null);

    setEditLoading(true);

    setEditSurvey(survey);

    setEditQuestions([]);

    try {
      const questions = await getSurveyQuestions(survey.id);

      setEditQuestions(Array.isArray(questions) ? questions : []);
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");

        localStorage.removeItem("synuserUser");

        localStorage.removeItem("synuserLoggedIn");

        navigate("/");

        return;
      }

      toast.error(error.message || "Failed to load survey for editing.");

      setEditSurvey(null);
    } finally {
      setEditLoading(false);
    }
  };

  /* SYNTHETIC RESPONSE GENERATION HANDLER */
  const handleGenerateSyntheticResponses = async (survey) => {
    setOpenMenu(null);

    if (survey.status !== "Ready") {
      toast.error(
        "Synthetic responses can only be generated for ready surveys.",
      );
      return;
    }

    if (!survey.experiment_id) {
      toast.error(
        "Synthetic responses can only be generated for surveys linked to an experiment.",
      );

      return;
    }

    if (generatingSurveyId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Generate synthetic responses for "${survey.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setGeneratingSurveyId(survey.id);

    try {
      const result = await generateSyntheticResponses(survey.id);

      toast.success(
        `${result.generated_response_count} synthetic responses generated successfully.`,
      );
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");

        localStorage.removeItem("synuserUser");

        localStorage.removeItem("synuserLoggedIn");

        navigate("/");

        return;
      }

      toast.error(error.message || "Failed to generate synthetic responses.");
    } finally {
      setGeneratingSurveyId(null);
    }
  };

  const handleViewSyntheticResponses = async (surveyId) => {
    try {
      setSyntheticResponsesLoading(true);
      setSyntheticResponsesError("");
      setShowSyntheticResponses(true);

      const data = await getSyntheticResponses(surveyId);

      setSyntheticResponses(data);
    } catch (error) {
      setSyntheticResponsesError(
        error.message || "Failed to load synthetic responses.",
      );
    } finally {
      setSyntheticResponsesLoading(false);
    }
  };

  const refreshSurveys = async () => {
    try {
      const data = await getSurveys();

      const normalizedSurveys = Array.isArray(data) ? data : [];

      const sortedSurveys = normalizedSurveys.length
        ? [...normalizedSurveys].sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          )
        : [];

      setSurveys(sortedSurveys);
    } catch (error) {
      toast.error(error.message || "Failed to refresh surveys.");
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#262633] sm:text-3xl">
            Surveys
          </h1>

          <p className="mt-1 text-sm text-[#626975]">
            Create, manage, and generate AI research responses.
          </p>
        </div>

        {/* SEARCH + NEW SURVEY */}
        <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:items-center">
          <div className="relative w-full sm:w-52">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9FA7]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search surveys..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-[#262633] outline-none shadow-sm placeholder:text-[#A7ACB4] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate("/surveys/new")}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0C7A66]"
          >
            <Plus size={18} />
            New Survey
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]">
        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Loader2 size={27} className="animate-spin text-[#0F8E77]" />
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F3F2] text-[#0F8E77]">
              {search ? <Search size={22} /> : <ClipboardList size={22} />}
            </div>

            <h3 className="mt-4 text-base font-bold text-[#262633]">
              {search ? "No surveys found" : "No surveys yet"}
            </h3>

            <p className="mt-1.5 max-w-md text-sm leading-6 text-[#626975]">
              {search
                ? "Try a different search term."
                : "Create your first survey to start collecting research responses."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => navigate("/surveys/new")}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0C7A66]"
              >
                <Plus size={17} />
                Create Survey
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFBFB]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#7A808A]">
                    Survey
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#7A808A]">
                    Experiment
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#7A808A]">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#7A808A]">
                    Updated
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#7A808A]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSurveys.map((survey) => (
                  <tr
                    key={survey.id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-[#FCFDFD]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F3F2] text-[#0F8E77]">
                          <FileText size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#262633]">
                            {survey.title}
                          </p>

                          <p className="mt-0.5 text-xs text-[#9A9FA7]">
                            Survey #{survey.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#626975]">
                      {survey.experiment_id
                        ? `Experiment #${survey.experiment_id}`
                        : "Not connected"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                          survey.status,
                        )}`}
                      >
                        {survey.status || "Draft"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#626975]">
                      {formatDate(survey.updated_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            const rect =
                              event.currentTarget.getBoundingClientRect();

                            const menuHeight =
                              survey.status === "Ready" && survey.experiment_id
                                ? 216
                                : 168;

                            const spaceBelow = window.innerHeight - rect.bottom;

                            const shouldOpenAbove =
                              spaceBelow < menuHeight + 12;

                            setMenuPosition({
                              top: shouldOpenAbove
                                ? rect.top - 6
                                : rect.bottom + 6,

                              left: Math.max(8, rect.right - 192),

                              placement: shouldOpenAbove ? "top" : "bottom",
                            });

                            setOpenMenu(
                              openMenu === survey.id ? null : survey.id,
                            );
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                          aria-label={`Actions for ${survey.title}`}
                        >
                          <MoreVertical size={17} />
                        </button>

                        {openMenu === survey.id &&
                          createPortal(
                            <div
                              className="fixed z-[200] w-48 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.08]"
                              style={{
                                top: menuPosition.top,

                                left: menuPosition.left,

                                transform:
                                  menuPosition.placement === "top"
                                    ? "translateY(-100%)"
                                    : "none",
                              }}
                            >
                              {/* VIEW */}
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                                onClick={() => handleView(survey)}
                              >
                                <Eye size={16} />
                                View
                              </button>

                              {/* EDIT */}
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                                onClick={() => handleEdit(survey)}
                              >
                                <Edit3 size={16} />
                                Edit
                              </button>

                              {/* MARK AS READY - DRAFT ONLY */}
                              {survey.status !== "Ready" && (
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                                  onClick={() => handleMarkReady(survey)}
                                >
                                  <ClipboardList size={16} />
                                  Mark as Ready
                                </button>
                              )}

                              {/* GENERATE SYNTHETIC RESPONSES - READY ONLY */}
                              {survey.status === "Ready" &&
                                survey.experiment_id && (
                                  <button
                                    type="button"
                                    disabled={generatingSurveyId === survey.id}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77] disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() =>
                                      handleGenerateSyntheticResponses(survey)
                                    }
                                  >
                                    {generatingSurveyId === survey.id ? (
                                      <Loader2
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <ClipboardList size={20} />
                                    )}
                                    {generatingSurveyId === survey.id
                                      ? "Generating..."
                                      : "Generate Synthetic Responses"}
                                  </button>
                                )}

                              {/* VIEW GENERATED RESPONSES - READY ONLY */}
                              {survey.status === "Ready" &&
                                survey.experiment_id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenu(null);
                                      handleViewSyntheticResponses(survey.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#626975] transition hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                                  >
                                    <Eye size={18} />
                                    View Generated Responses
                                  </button>
                                )}

                              {/* DELETE */}
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                                onClick={() => handleDelete(survey)}
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>,

                            document.body,
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewSurvey && (
        <>
          {viewLoading ? (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
              <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-xl">
                <Loader2 size={20} className="animate-spin text-[#0F8E77]" />

                <span className="text-sm text-[#626975]">
                  Loading survey...
                </span>
              </div>
            </div>
          ) : (
            <SurveyViewModal
              survey={viewSurvey}
              questions={viewQuestions}
              onClose={() => setViewSurvey(null)}
            />
          )}
        </>
      )}

      {/* EDIT MODAL */}
      {editSurvey && (
        <>
          {editLoading ? (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
              <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-xl">
                <Loader2 size={20} className="animate-spin text-[#0F8E77]" />

                <span className="text-sm text-[#626975]">
                  Loading survey...
                </span>
              </div>
            </div>
          ) : (
            <SurveyEditModal
              survey={editSurvey}
              initialQuestions={editQuestions}
              onClose={() => setEditSurvey(null)}
              onSaved={async () => {
                setEditSurvey(null);

                await refreshSurveys();
              }}
            />
          )}
        </>
      )}

      {showSyntheticResponses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generated Synthetic Responses
                </h2>

                {syntheticResponses && (
                  <p className="mt-1 text-sm text-gray-500">
                    {syntheticResponses.survey_title}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSyntheticResponses(false);
                  setSyntheticResponses(null);
                  setSyntheticResponsesError("");
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
              {syntheticResponsesLoading && (
                <div className="flex min-h-[250px] items-center justify-center">
                  <div className="text-sm text-gray-500">
                    Loading generated responses...
                  </div>
                </div>
              )}

              {!syntheticResponsesLoading && syntheticResponsesError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {syntheticResponsesError}
                </div>
              )}

              {!syntheticResponsesLoading &&
                !syntheticResponsesError &&
                syntheticResponses &&
                syntheticResponses.generated_response_count === 0 && (
                  <div className="flex min-h-[250px] items-center justify-center">
                    <div className="text-center">
                      <p className="text-base font-medium text-gray-900">
                        No generated responses yet
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Generate synthetic responses first.
                      </p>
                    </div>
                  </div>
                )}

              {!syntheticResponsesLoading &&
                !syntheticResponsesError &&
                syntheticResponses &&
                syntheticResponses.generated_response_count > 0 && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Experiment</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {syntheticResponses.experiment_name}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Personas</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {syntheticResponses.generated_response_count}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Questions</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {syntheticResponses.question_count}
                        </p>
                      </div>
                    </div>

                    {/* Responses */}
                    <div className="space-y-5">
                      {syntheticResponses.responses.map((response) => (
                        <div
                          key={response.id}
                          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">
                                {response.persona_name || "Unknown Persona"}
                              </h3>

                              <p className="mt-1 text-xs text-gray-500">
                                Persona ID: {response.persona_id}
                              </p>
                            </div>

                            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                              Synthetic
                            </span>
                          </div>

                          <div className="space-y-4">
                            {syntheticResponses.questions.map((question) => (
                              <div
                                key={question.id}
                                className="rounded-xl bg-gray-50 p-4"
                              >
                                <p className="text-sm font-medium text-gray-900">
                                  {question.display_order + 1}.{" "}
                                  {question.question}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-gray-700">
                                  {Array.isArray(
                                    response.response_data?.answers?.[
                                      String(question.id)
                                    ],
                                  )
                                    ? response.response_data.answers[
                                        String(question.id)
                                      ].join(", ")
                                    : String(
                                        response.response_data?.answers?.[
                                          String(question.id)
                                        ] ?? "No answer",
                                      )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Surveys;
