import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  HelpCircle,
  Info,
  Plus,
  Save,
  Trash2,
  Edit3,
  Eye,
  Clock3,
  ClipboardList,
  Target,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { getExperiments } from "../api/experiments";
import {
  createSurvey,
  createSurveyQuestion,
  markSurveyReady,
} from "../api/surveys";

const QUESTION_TYPES = [
  {
    value: "single_choice",
    label: "Single Choice",
    description: "Synthetic persona selects one option.",
  },
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    description: "Synthetic persona can select multiple options.",
  },
  {
    value: "rating",
    label: "Rating Scale",
    description: "Synthetic persona gives a numerical rating.",
  },
  {
    value: "yes_no",
    label: "Yes / No",
    description: "Simple yes or no question for the synthetic persona.",
  },
  {
    value: "likert",
    label: "Likert Scale",
    description: "Measure agreement or opinion from the synthetic persona.",
  },
  {
    value: "short_text",
    label: "Short Answer",
    description: "Short written response from the synthetic persona.",
  },
  {
    value: "long_text",
    label: "Long Answer",
    description: "Detailed written response from the synthetic persona.",
  },
];

const createEmptyQuestion = (order = 0) => ({
  localId: `question-${Date.now()}-${Math.random()}`,
  question: "",
  question_type: "single_choice",
  options: ["", ""],
  required: true,
  display_order: order,
});

function CreateSurvey() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [experimentId, setExperimentId] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("5");

  const [experiments, setExperiments] = useState([]);
  const [loadingExperiments, setLoadingExperiments] = useState(true);

  const [questions, setQuestions] = useState([]);

  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const [questionDraft, setQuestionDraft] = useState(createEmptyQuestion());

  const [saving, setSaving] = useState(false);

  const [surveyId, setSurveyId] = useState(null);

  // ----------------------------------------------------------
  // EXPERIMENT DROPDOWN
  // ----------------------------------------------------------

  const [experimentDropdownOpen, setExperimentDropdownOpen] =
    useState(false);

  const experimentDropdownRef = useRef(null);

  // ----------------------------------------------------------
  // LOAD EXPERIMENTS
  // ----------------------------------------------------------

  useEffect(() => {
    async function loadExperiments() {
      try {
        const data = await getExperiments();
        setExperiments(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem("synuserAccessToken");
          localStorage.removeItem("synuserUser");
          localStorage.removeItem("synuserLoggedIn");

          navigate("/");
          return;
        }

        toast.error(error.message || "Failed to load experiments.");
      } finally {
        setLoadingExperiments(false);
      }
    }

    loadExperiments();
  }, [navigate]);

  // ----------------------------------------------------------
  // CLOSE EXPERIMENT DROPDOWN WHEN CLICKING OUTSIDE
  // ----------------------------------------------------------

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        experimentDropdownRef.current &&
        !experimentDropdownRef.current.contains(event.target)
      ) {
        setExperimentDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ----------------------------------------------------------
  // SELECTED EXPERIMENT
  // ----------------------------------------------------------

  const selectedExperiment = useMemo(
    () =>
      experiments.find(
        (experiment) => String(experiment.id) === String(experimentId),
      ),
    [experiments, experimentId],
  );

  // ----------------------------------------------------------
  // SELECTED EXPERIMENT LABEL
  // ----------------------------------------------------------

  const selectedExperimentLabel = selectedExperiment
    ? selectedExperiment.name
    : "No experiment selected";

  // ----------------------------------------------------------
  // EXPERIMENT SELECTION
  // ----------------------------------------------------------

  const handleExperimentSelect = (value) => {
    setExperimentId(value);
    setExperimentDropdownOpen(false);
  };

  // ----------------------------------------------------------
  // QUESTION HELPERS
  // ----------------------------------------------------------

  const needsOptions = ["single_choice", "multiple_choice"].includes(
    questionDraft.question_type,
  );

  const updateQuestionDraft = (field, value) => {
    setQuestionDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateOption = (index, value) => {
    setQuestionDraft((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }));
  };

  const addOption = () => {
    setQuestionDraft((previous) => ({
      ...previous,
      options: [...previous.options, ""],
    }));
  };

  const removeOption = (index) => {
    setQuestionDraft((previous) => ({
      ...previous,
      options: previous.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
  };

  const openAddQuestion = () => {
    setEditingQuestionId(null);

    setQuestionDraft(createEmptyQuestion(questions.length));

    setShowQuestionForm(true);
  };

  const openEditQuestion = (question) => {
    setEditingQuestionId(question.localId);

    setQuestionDraft({
      ...question,
      options: [...question.options],
    });

    setShowQuestionForm(true);
  };

  const duplicateQuestion = (question) => {
    const duplicated = {
      ...question,
      localId: `question-${Date.now()}-${Math.random()}`,
      question: `${question.question} (Copy)`,
      display_order: questions.length,
      options: [...question.options],
    };

    setQuestions((previous) => [...previous, duplicated]);

    toast.success("Question duplicated.");
  };

  const deleteQuestion = (localId) => {
    setQuestions((previous) =>
      previous.filter((question) => question.localId !== localId),
    );

    toast.success("Question deleted.");
  };

  const saveQuestion = () => {
    const cleanedQuestion = questionDraft.question.trim();

    if (!cleanedQuestion) {
      toast.error("Please enter a question.");
      return;
    }

    let cleanedOptions = questionDraft.options
      .map((option) => option.trim())
      .filter(Boolean);

    if (needsOptions && cleanedOptions.length < 2) {
      toast.error("Please provide at least two options.");
      return;
    }

    if (!needsOptions) {
      cleanedOptions = [];
    }

    const updatedQuestion = {
      ...questionDraft,
      question: cleanedQuestion,
      options: cleanedOptions,
    };

    if (editingQuestionId) {
      setQuestions((previous) =>
        previous.map((question) =>
          question.localId === editingQuestionId ? updatedQuestion : question,
        ),
      );

      toast.success("Question updated.");
    } else {
      setQuestions((previous) => [
        ...previous,
        {
          ...updatedQuestion,
          display_order: previous.length,
        },
      ]);

      toast.success("Question added.");
    }

    setShowQuestionForm(false);
    setEditingQuestionId(null);
  };

  // ----------------------------------------------------------
  // STEP VALIDATION
  // ----------------------------------------------------------

  const validateDetails = () => {
    if (!title.trim()) {
      toast.error("Please enter a survey title.");
      return false;
    }

    if (title.trim().length < 3) {
      toast.error("Survey title must be at least 3 characters.");
      return false;
    }

    if (!description.trim()) {
      toast.error("Please enter the research objective.");
      return false;
    }

    if (!targetAudience.trim()) {
      toast.error("Please enter the target audience.");
      return false;
    }

    return true;
  };

  const goToQuestions = () => {
    if (!validateDetails()) {
      return;
    }

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToPreview = () => {
    if (questions.length === 0) {
      toast.error("Please add at least one question.");
      return;
    }

    setStep(3);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------------------------------
  // SAVE DRAFT
  // ----------------------------------------------------------

  const saveDraft = async () => {
    if (!validateDetails()) {
      setStep(1);
      return;
    }

    if (questions.length === 0) {
      toast.error("Add at least one question before saving the draft.");
      setStep(2);
      return;
    }

    setSaving(true);

    try {
      let currentSurveyId = surveyId;

      if (!currentSurveyId) {
        const survey = await createSurvey(
          title.trim(),
          experimentId ? Number(experimentId) : null,
        );

        currentSurveyId = survey.id;
        setSurveyId(survey.id);
      }

      // Save all questions so Draft surveys retain their questions.
      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];

        await createSurveyQuestion(currentSurveyId, {
          question: question.question.trim(),
          question_type: question.question_type,
          options: question.options,
          required: question.required,
          display_order: index,
        });
      }

      toast.success("Survey draft saved.");

      navigate("/surveys");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");
        localStorage.removeItem("synuserUser");
        localStorage.removeItem("synuserLoggedIn");

        navigate("/");
        return;
      }

      toast.error(error.message || "Failed to save survey.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // MARK AS READY
  // ----------------------------------------------------------

  const markSurveyReadyHandler = async () => {
    if (!validateDetails()) {
      setStep(1);
      return;
    }

    if (questions.length === 0) {
      toast.error(
        "Add at least one question before marking the survey as ready.",
      );
      setStep(2);
      return;
    }

    setSaving(true);

    try {
      let currentSurveyId = surveyId;

      // 1. Create the survey if it does not exist yet.
      if (!currentSurveyId) {
        const survey = await createSurvey(
          title.trim(),
          experimentId ? Number(experimentId) : null,
        );

        currentSurveyId = survey.id;
        setSurveyId(survey.id);
      }

      // 2. Save all questions.
      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];

        await createSurveyQuestion(currentSurveyId, {
          question: question.question,
          question_type: question.question_type,
          options: question.options,
          required: question.required,
          display_order: index,
        });
      }

      // 3. Mark the survey as ready.
      await markSurveyReady(currentSurveyId);

      toast.success("Survey marked as ready.");

      navigate("/surveys");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("synuserAccessToken");
        localStorage.removeItem("synuserUser");
        localStorage.removeItem("synuserLoggedIn");

        navigate("/");
        return;
      }

      toast.error(error.message || "Failed to mark survey as ready.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-7 flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate("/surveys")}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#626975] transition hover:border-[#0F8E77] hover:text-[#0F8E77]"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-[#262633] sm:text-3xl">
              Create New Survey
            </h1>

            <p className="mt-1.5 text-sm text-[#626975]">
              Build a research survey to collect meaningful responses from your
              target audience.
            </p>
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div className="mb-7 rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/[0.03] sm:px-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((item, index) => {
              const completed = step > item;
              const active = step === item;

              const labels = [
                "Survey Details",
                "Add Questions",
                "Preview & Mark as Ready",
              ];

              return (
                <div key={item} className="flex flex-1 items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        completed || active
                          ? "bg-[#0F8E77] text-white"
                          : "bg-gray-100 text-[#8A9099]"
                      }`}
                    >
                      {completed ? <Check size={17} /> : item}
                    </div>

                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-semibold ${
                          active || completed
                            ? "text-[#262633]"
                            : "text-[#8A9099]"
                        }`}
                      >
                        {labels[index]}
                      </p>

                      <p className="text-xs text-[#9A9FA7]">Step {item}</p>
                    </div>
                  </div>

                  {index < 2 && (
                    <div
                      className={`mx-3 h-px flex-1 sm:mx-6 ${
                        step > item ? "bg-[#0F8E77]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================= */}
        {/* STEP 1 — SURVEY DETAILS */}
        {/* ================================================= */}

        {step === 1 && (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]">
            <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F3F2] text-[#0F8E77]">
                  <ClipboardList size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#262633]">
                    Survey Details
                  </h2>

                  <p className="mt-1 text-sm text-[#626975]">
                    Tell us about the survey you want to create.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-7 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                {/* TITLE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#363944]">
                    Survey Title
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Mobile Banking User Experience Survey"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#262633] outline-none transition placeholder:text-[#A7ACB4] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#363944]">
                    Research Objective
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What do you want to learn from your synthetic personas?"
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#262633] outline-none transition placeholder:text-[#A7ACB4] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* EXPERIMENT */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#363944]">
                    Connect to Experiment
                  </label>

                  <div
                    ref={experimentDropdownRef}
                    className="relative"
                  >
                    {/* DROPDOWN TRIGGER */}
                    <button
                      type="button"
                      disabled={loadingExperiments}
                      onClick={() =>
                        setExperimentDropdownOpen(
                          (previous) => !previous,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-left text-sm outline-none transition ${
                        experimentDropdownOpen
                          ? "border-[#0F8E77] ring-2 ring-[#0F8E77]/10"
                          : "border-gray-200 hover:border-[#0F8E77]/60"
                      } ${
                        loadingExperiments
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={
                          experimentId
                            ? "font-medium text-[#4A5059]"
                            : "text-[#626975]"
                        }
                      >
                        {loadingExperiments
                          ? "Loading experiments..."
                          : selectedExperimentLabel}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#8A9099] transition-transform duration-200 ${
                          experimentDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* DROPDOWN MENU */}
                    {experimentDropdownOpen && !loadingExperiments && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-2 shadow-[0_12px_35px_rgba(0,0,0,0.10)]">
                        {/* NO EXPERIMENT OPTION */}
                        <button
                          type="button"
                          onClick={() => handleExperimentSelect("")}
                          className={`flex w-full items-center justify-between rounded-[14px] px-4 py-3.5 text-left text-sm font-semibold transition ${
                            experimentId === ""
                              ? "bg-[#178F7A] text-white"
                              : "text-[#4A5059] hover:bg-[#F4F8F7]"
                          }`}
                        >
                          <span>No experiment selected</span>

                          {experimentId === "" && (
                            <Check size={18} strokeWidth={2.5} />
                          )}
                        </button>

                        {/* EXPERIMENT OPTIONS */}
                        {experiments.map((experiment) => {
                          const isSelected =
                            String(experimentId) ===
                            String(experiment.id);

                          return (
                            <button
                              key={experiment.id}
                              type="button"
                              onClick={() =>
                                handleExperimentSelect(
                                  String(experiment.id),
                                )
                              }
                              className={`flex w-full items-center justify-between rounded-[14px] px-4 py-3.5 text-left text-sm font-medium transition ${
                                isSelected
                                  ? "bg-[#178F7A] font-semibold text-white"
                                  : "text-[#4A5059] hover:bg-[#F4F8F7]"
                              }`}
                            >
                              <span>{experiment.name}</span>

                              {isSelected && (
                                <Check
                                  size={18}
                                  strokeWidth={2.5}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* TARGET AUDIENCE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#363944]">
                    Target Audience
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(event) =>
                      setTargetAudience(event.target.value)
                    }
                    placeholder="e.g. College students aged 18–25"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#262633] outline-none transition placeholder:text-[#A7ACB4] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                  />
                </div>

                {/* TIME */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#363944]">
                    Estimated Completion Time
                  </label>

                  <div className="relative">
                    <Clock3
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9099]"
                    />

                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={estimatedTime}
                      onChange={(event) =>
                        setEstimatedTime(event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-16 text-sm text-[#262633] outline-none transition focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8A9099]">
                      minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT INFORMATION CARD */}
              <div className="h-fit rounded-2xl bg-[#F7FAFA] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Info size={17} className="text-[#0F8E77]" />

                  <h3 className="text-sm font-bold text-[#262633]">
                    Survey setup
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-[#363944]">
                      1. Define your objective
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#7A808A]">
                      Clearly describe what you want to learn from your
                      respondents.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-[#363944]">
                      2. Add questions
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#7A808A]">
                      Create questions that directly support your research
                      objective.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-[#363944]">
                      3. Preview and mark as ready
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#7A808A]">
                      Review the survey before marking it as ready for
                      synthetic responses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5 sm:px-8">
              <button
                type="button"
                onClick={() => navigate("/surveys")}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#626975] transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={goToQuestions}
                className="flex items-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0C7A66]"
              >
                Continue
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* STEP 2 — QUESTIONS */}
        {/* ================================================= */}

        {step === 2 && (
          <div>
            <div className="mb-5 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.03] sm:px-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-[#262633]">
                    Add Questions
                  </h2>

                  <p className="mt-1 text-sm text-[#626975]">
                    Build your survey with clear and focused research
                    questions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddQuestion}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0C7A66]"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              </div>
            </div>

            {/* QUESTION LIST */}
            {questions.length === 0 ? (
              <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/[0.03]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F3F2] text-[#0F8E77]">
                  <HelpCircle size={26} />
                </div>

                <h3 className="mt-5 text-base font-bold text-[#262633]">
                  No questions yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#626975]">
                  Start building your survey by adding your first question.
                </p>

                <button
                  type="button"
                  onClick={openAddQuestion}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0C7A66]"
                >
                  <Plus size={17} />
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.localId}
                    className="rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]"
                  >
                    <div className="flex items-start gap-3 p-5 sm:p-6">
                      <div className="hidden pt-1 text-[#B0B5BD] sm:block">
                        <GripVertical size={19} />
                      </div>

                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F3F2] text-xs font-bold text-[#0F8E77]">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F1F3F4] px-2.5 py-1 text-xs font-medium text-[#626975]">
                              {
                                QUESTION_TYPES.find(
                                  (type) =>
                                    type.value === question.question_type,
                                )?.label
                              }
                            </span>

                            {question.required && (
                              <span className="rounded-full bg-[#FFF2DF] px-2.5 py-1 text-xs font-medium text-[#E58A20]">
                                Required
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm font-semibold leading-6 text-[#262633]">
                            {question.question}
                          </p>

                          {question.options.length > 0 && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={`${question.localId}-${optionIndex}`}
                                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-[#FAFBFB] px-3 py-2.5"
                                >
                                  <div
                                    className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                                      question.question_type ===
                                      "multiple_choice"
                                        ? "rounded-[4px]"
                                        : ""
                                    } border-[#B8BDC5]`}
                                  />

                                  <span className="text-xs text-[#626975]">
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditQuestion(question)}
                          title="Edit"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#626975] hover:bg-[#E7F3F2] hover:text-[#0F8E77]"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicateQuestion(question)}
                          title="Duplicate"
                          className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#626975] hover:bg-[#E7F3F2] hover:text-[#0F8E77] sm:flex"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteQuestion(question.localId)}
                          title="Delete"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#626975] hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP FOOTER */}
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.03] sm:px-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#626975] hover:bg-gray-50"
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <button
                type="button"
                onClick={goToPreview}
                className="flex items-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0C7A66]"
              >
                Preview Survey
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* STEP 3 — PREVIEW */}
        {/* ================================================= */}

        {step === 3 && (
          <div>
            <div className="mb-5 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.03] sm:px-8">
              <div>
                <h2 className="text-lg font-bold text-[#262633]">
                  Preview & Mark as Ready
                </h2>

                <p className="mt-1 text-sm text-[#626975]">
                  Review how your survey will be answered by synthetic
                  personas.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              {/* RESPONDENT PREVIEW */}
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]">
                <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#626975]">
                    <Eye size={17} />
                    Respondent Preview
                  </div>
                </div>

                <div className="px-6 py-7 sm:px-10">
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#262633]">
                      {title}
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[#626975]">
                      {description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3F2] px-3 py-1.5 text-xs font-medium text-[#0F8E77]">
                        <Clock3 size={13} />
                        {estimatedTime || "5"} minutes
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F3F4] px-3 py-1.5 text-xs font-medium text-[#626975]">
                        <ClipboardList size={13} />
                        {questions.length} questions
                      </span>
                    </div>
                  </div>

                  <div className="space-y-7">
                    {questions.map((question, index) => (
                      <div
                        key={question.localId}
                        className="border-b border-gray-100 pb-7 last:border-b-0"
                      >
                        <div className="flex gap-3">
                          <span className="text-sm font-bold text-[#0F8E77]">
                            {index + 1}.
                          </span>

                          <div className="flex-1">
                            <p className="text-sm font-semibold leading-6 text-[#262633]">
                              {question.question}

                              {question.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </p>

                            {question.question_type === "single_choice" && (
                              <div className="mt-3 space-y-2">
                                {question.options.map((option, i) => (
                                  <label
                                    key={i}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3"
                                  >
                                    <input type="radio" disabled />
                                    <span className="text-sm text-[#626975]">
                                      {option}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {question.question_type === "multiple_choice" && (
                              <div className="mt-3 space-y-2">
                                {question.options.map((option, i) => (
                                  <label
                                    key={i}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3"
                                  >
                                    <input type="checkbox" disabled />
                                    <span className="text-sm text-[#626975]">
                                      {option}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {question.question_type === "rating" && (
                              <div className="mt-3 flex gap-2">
                                {[1, 2, 3, 4, 5].map((number) => (
                                  <div
                                    key={number}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-sm text-[#626975]"
                                  >
                                    {number}
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.question_type === "yes_no" && (
                              <div className="mt-3 flex gap-3">
                                {["Yes", "No"].map((answer) => (
                                  <div
                                    key={answer}
                                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm text-[#626975]"
                                  >
                                    {answer}
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.question_type === "likert" && (
                              <div className="mt-3 grid grid-cols-5 gap-2">
                                {[
                                  "Strongly Disagree",
                                  "Disagree",
                                  "Neutral",
                                  "Agree",
                                  "Strongly Agree",
                                ].map((answer) => (
                                  <div
                                    key={answer}
                                    className="rounded-lg border border-gray-200 px-2 py-3 text-center text-xs text-[#626975]"
                                  >
                                    {answer}
                                  </div>
                                ))}
                              </div>
                            )}

                            {["short_text", "long_text"].includes(
                              question.question_type,
                            ) && (
                              <div
                                className={`mt-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#A7ACB4] ${
                                  question.question_type === "long_text"
                                    ? "h-28"
                                    : ""
                                }`}
                              >
                                Your answer...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MARK AS READY SUMMARY */}
              <div className="h-fit space-y-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
                  <h3 className="text-sm font-bold text-[#262633]">
                    Survey Summary
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7A808A]">
                        Questions
                      </span>

                      <span className="text-sm font-semibold text-[#262633]">
                        {questions.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7A808A]">
                        Estimated time
                      </span>

                      <span className="text-sm font-semibold text-[#262633]">
                        {estimatedTime || "5"} min
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7A808A]">Status</span>

                      <span className="rounded-full bg-[#FFF2DF] px-2.5 py-1 text-xs font-medium text-[#E58A20]">
                        Draft
                      </span>
                    </div>
                  </div>
                </div>

                {selectedExperiment && (
                  <div className="rounded-2xl bg-[#E7F3F2] p-5">
                    <div className="flex gap-3">
                      <Target
                        size={18}
                        className="mt-0.5 shrink-0 text-[#0F8E77]"
                      />

                      <div>
                        <p className="text-xs font-semibold text-[#0F8E77]">
                          Connected Experiment
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#262633]">
                          {selectedExperiment.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-[#F7FAFA] p-5">
                  <div className="flex gap-3">
                    <Info
                      size={17}
                      className="mt-0.5 shrink-0 text-[#0F8E77]"
                    />

                    <p className="text-xs leading-5 text-[#626975]">
                      Once marked as ready, this survey can be used to
                      generate synthetic responses from the personas in the
                      connected experiment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-6 flex flex-col-reverse gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#626975] hover:bg-gray-50"
              >
                <ArrowLeft size={17} />
                Back to Questions
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveDraft}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#626975] transition hover:border-[#0F8E77] hover:text-[#0F8E77] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={markSurveyReadyHandler}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0C7A66] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={17} />
                  {saving ? "Saving..." : "Mark as Ready"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================== */}
      {/* QUESTION MODAL */}
      {/* =================================================== */}

      {showQuestionForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#262633]">
                  {editingQuestionId ? "Edit Question" : "Add Question"}
                </h2>

                <p className="mt-1 text-xs text-[#626975]">
                  Create a clear question for your synthetic personas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#626975] hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-5 px-6 py-6">
              {/* QUESTION */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#363944]">
                  Question
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  rows={3}
                  value={questionDraft.question}
                  onChange={(event) =>
                    updateQuestionDraft("question", event.target.value)
                  }
                  placeholder="e.g. How satisfied are you with our product?"
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#262633] outline-none placeholder:text-[#A7ACB4] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
                />
              </div>

              {/* TYPE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#363944]">
                  Question Type
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        updateQuestionDraft(
                          "question_type",
                          type.value,
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        questionDraft.question_type === type.value
                          ? "border-[#0F8E77] bg-[#E7F3F2]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          questionDraft.question_type === type.value
                            ? "text-[#0F8E77]"
                            : "text-[#363944]"
                        }`}
                      >
                        {type.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#8A9099]">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* OPTIONS */}
              {needsOptions && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#363944]">
                      Answer Options
                    </label>

                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0F8E77] hover:text-[#0C7A66]"
                    >
                      <Plus size={14} />
                      Add option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {questionDraft.options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`h-4 w-4 shrink-0 border border-[#B8BDC5] ${
                            questionDraft.question_type ===
                            "multiple_choice"
                              ? "rounded-[4px]"
                              : "rounded-full"
                          }`}
                        />

                        <input
                          type="text"
                          value={option}
                          onChange={(event) =>
                            updateOption(index, event.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none placeholder:text-[#A7ACB4] focus:border-[#0F8E77]"
                        />

                        {questionDraft.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8A9099] hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REQUIRED */}
              <div className="flex items-center justify-between rounded-xl bg-[#F7FAFA] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#363944]">
                    Required question
                  </p>

                  <p className="mt-0.5 text-xs text-[#8A9099]">
                    Synthetic personas must answer this question.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateQuestionDraft(
                      "required",
                      !questionDraft.required,
                    )
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    questionDraft.required
                      ? "bg-[#0F8E77]"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      questionDraft.required ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#626975] hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveQuestion}
                className="flex items-center gap-2 rounded-xl bg-[#0F8E77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0C7A66]"
              >
                <Check size={17} />
                {editingQuestionId
                  ? "Update Question"
                  : "Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CreateSurvey;