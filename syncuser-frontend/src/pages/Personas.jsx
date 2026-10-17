import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FiEdit2,
  FiEye,
  FiFilter,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import PersonaAvatar from "../components/PersonaAvatar";

import { getExperiments } from "../api/experiments";
import {
  deletePersona,
  generatePersonas,
  getPersonasForExperiment,
} from "../api/personas";

/* =========================================================
   Custom Dropdown
========================================================= */

function CustomDropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  width = "w-full",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleSelect(optionValue) {
    onChange(optionValue);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative ${width}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3.5 text-left text-sm outline-none transition ${
          open
            ? "border-[#16866f] ring-2 ring-[#16866f]/10"
            : "border-[#dfe6e3] hover:border-[#b9d8d0]"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#f4f6f5] opacity-70"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-[#3f4945]" : "text-[#9aa39f]"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-[#7f8985] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[#dfe6e3] bg-white p-1.5 shadow-[0_10px_30px_rgba(20,40,35,0.12)]">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const selected =
                String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                    selected
                      ? "bg-[#16866f] text-white"
                      : "text-[#3f4945] hover:bg-[#edf8f5] hover:text-[#16866f]"
                  }`}
                >
                  <span className="truncate">{option.label}</span>

                  {selected && (
                    <span className="ml-2 shrink-0 text-white">✓</span>
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

/* =========================================================
   Persona Card
========================================================= */

function PersonaCard({ persona, onView, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const traits = [...(persona.interests || []), ...(persona.behaviors || [])]
    .filter(Boolean)
    .slice(0, 2);

  function handleCardClick() {
    if (!showMenu) {
      onView();
    }
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  }

  function handleMenuClick(event) {
    event.stopPropagation();
    setShowMenu((current) => !current);
  }

  function handleView(event) {
    event.stopPropagation();
    setShowMenu(false);
    onView();
  }

  function handleEdit(event) {
    event.stopPropagation();
    setShowMenu(false);
    onEdit();
  }

  function handleDelete(event) {
    event.stopPropagation();
    setShowMenu(false);
    onDelete();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group relative w-full cursor-pointer rounded-2xl border border-[#e8eceb] bg-white p-4 text-left shadow-[0_2px_10px_rgba(20,40,35,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#bfe3d9] hover:shadow-[0_8px_24px_rgba(20,40,35,0.10)] focus:outline-none focus:ring-2 focus:ring-[#a9d9ce]"
    >
      {/* Three-dot menu */}
      <button
        type="button"
        onClick={handleMenuClick}
        className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-[#89918f] transition hover:bg-[#f3f7f6] hover:text-[#27302e]"
        aria-label={`Actions for ${persona.name}`}
      >
        <FiMoreVertical size={17} />
      </button>

      {showMenu && (
        <div
          className="absolute right-3 top-10 z-30 w-32 overflow-hidden rounded-xl border border-[#e3e8e6] bg-white py-1 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleView}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[#303735] transition hover:bg-[#f4f8f7]"
          >
            <FiEye size={14} />
            View
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[#303735] transition hover:bg-[#f4f8f7]"
          >
            <FiEdit2 size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Avatar + Persona information */}
      <div className="flex items-center gap-3 pr-7">
        <div className="rounded-full bg-[#e7f7f3] p-1">
          <PersonaAvatar
            personaId={persona.id}
            name={persona.name}
            size="sm"
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-[#202725]">
            {persona.name}
          </h3>

          <p className="mt-1 truncate text-xs font-medium text-[#59635f]">
            {persona.age} years
            {persona.occupation ? `, ${persona.occupation}` : ""}
          </p>

          <p className="mt-1 truncate text-xs text-[#858d8a]">
            {persona.location || "Location not specified"}
          </p>
        </div>
      </div>

      {/* Traits */}
      {traits.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {traits.map((trait, index) => (
            <span
              key={`${trait}-${index}`}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                index === 0
                  ? "bg-[#e8f7f4] text-[#188873]"
                  : "bg-[#f1f3f3] text-[#68716e]"
              }`}
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Combined Persona Filter
========================================================= */

function PersonaFilter({
  experiments,
  experimentId,
  gender,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const hasActiveFilter = Boolean(experimentId || gender);

  const experimentOptions = [
    {
      value: "",
      label: "All Experiments",
    },
    ...experiments.map((experiment) => ({
      value: String(experiment.id),
      label: experiment.name,
    })),
  ];

  const genderOptions = [
    {
      value: "",
      label: "All Genders",
    },
    {
      value: "male",
      label: "Male",
    },
    {
      value: "female",
      label: "Female",
    },
  ];

  function handleClearAll() {
    onChange("", "");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3.5 text-xs font-semibold transition ${
          hasActiveFilter
            ? "border-[#16866f] bg-[#16866f] text-white hover:bg-[#11735f]"
            : "border-[#dfe6e3] bg-white text-[#3f4945] hover:border-[#b9d8d0] hover:text-[#16866f]"
        }`}
      >
        <FiFilter size={14} />

        Filter

        {hasActiveFilter && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[#16866f]">
            {(experimentId ? 1 : 0) + (gender ? 1 : 0)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_12px_32px_rgba(20,40,35,0.12)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-[#26302d]">
              Filter Personas
            </p>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-medium text-[#16866f] transition hover:text-[#11735f]"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#68736f]">
                Experiment
              </label>

              <CustomDropdown
                value={experimentId}
                options={experimentOptions}
                placeholder="All Experiments"
                onChange={(value) => onChange(value, gender)}
                width="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#68736f]">
                Gender
              </label>

              <CustomDropdown
                value={gender}
                options={genderOptions}
                placeholder="All Genders"
                onChange={(value) => onChange(experimentId, value)}
                width="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Personas Page
========================================================= */

function Personas() {
  const navigate = useNavigate();

  const [experimentGroups, setExperimentGroups] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterExperimentId, setFilterExperimentId] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [personaCount, setPersonaCount] = useState("");
  const [instructions, setInstructions] = useState("");
  const [creating, setCreating] = useState(false);

  const [deletingPersona, setDeletingPersona] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadPersonaData() {
    try {
      setLoading(true);
      setError("");

      const experimentData = await getExperiments();

      const sortedExperiments = [...experimentData].sort(
        (first, second) => second.id - first.id,
      );

      setExperiments(sortedExperiments);

      const groups = await Promise.all(
        sortedExperiments.map(async (experiment) => {
          try {
            const personas = await getPersonasForExperiment(experiment.id);

            return {
              experiment,
              personas,
            };
          } catch (error) {
            console.error(
              `Failed to load personas for experiment ${experiment.id}:`,
              error,
            );

            return {
              experiment,
              personas: [],
            };
          }
        }),
      );

      setExperimentGroups(
        groups.filter((group) => group.personas.length > 0),
      );
    } catch (err) {
      console.error("Failed to load persona data:", err);
      setError(err.message || "Failed to load persona data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialPersonaData() {
      try {
        setLoading(true);
        setError("");

        const experimentData = await getExperiments();

        const sortedExperiments = [...experimentData].sort(
          (first, second) => second.id - first.id,
        );

        if (ignore) {
          return;
        }

        setExperiments(sortedExperiments);

        const groups = await Promise.all(
          sortedExperiments.map(async (experiment) => {
            try {
              const personas = await getPersonasForExperiment(experiment.id);

              return {
                experiment,
                personas,
              };
            } catch (error) {
              console.error(
                `Failed to load personas for experiment ${experiment.id}:`,
                error,
              );

              return {
                experiment,
                personas: [],
              };
            }
          }),
        );

        if (ignore) {
          return;
        }

        setExperimentGroups(
          groups.filter((group) => group.personas.length > 0),
        );
      } catch (err) {
        if (ignore) {
          return;
        }

        console.error("Failed to load persona data:", err);

        setError(err.message || "Failed to load persona data.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialPersonaData();

    return () => {
      ignore = true;
    };
  }, []);

  const hasPersonas = experimentGroups.length > 0;

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return experimentGroups
      .filter((group) => {
        if (!filterExperimentId) {
          return true;
        }

        return group.experiment.id === Number(filterExperimentId);
      })
      .map((group) => {
        const matchingPersonas = group.personas.filter((persona) => {
          const matchesGender =
            !filterGender ||
            (persona.gender || "").toLowerCase() ===
              filterGender.toLowerCase();

          if (!matchesGender) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchableText = [
            persona.name,
            persona.description,
            persona.occupation,
            persona.location,
            ...(persona.interests || []),
            ...(persona.goals || []),
            ...(persona.needs || []),
            ...(persona.behaviors || []),
            ...(persona.pain_points || []),
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(normalizedSearch);
        });

        return {
          ...group,
          personas: matchingPersonas,
        };
      })
      .filter((group) => group.personas.length > 0);
  }, [
    experimentGroups,
    searchTerm,
    filterExperimentId,
    filterGender,
  ]);

  function openCreateModal() {
    setSelectedExperimentId("");
    setPersonaCount("");
    setInstructions("");
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (creating) {
      return;
    }

    setShowCreateModal(false);
  }

  async function handleCreatePersonas(event) {
    event.preventDefault();

    if (!selectedExperimentId) {
      toast.error("Please select an experiment.");
      return;
    }

    if (!personaCount) {
      toast.error("Please select the number of personas.");
      return;
    }

    const count = Number(personaCount);

    if (!Number.isInteger(count) || count < 1 || count > 10) {
      toast.error("Persona count must be between 1 and 10.");
      return;
    }

    try {
      setCreating(true);

      await generatePersonas(
        Number(selectedExperimentId),
        count,
        instructions.trim(),
      );

      setShowCreateModal(false);

      await loadPersonaData();

      toast.success(
        `${count} ${
          count === 1 ? "persona" : "personas"
        } generated successfully.`,
      );
    } catch (err) {
      console.error("Failed to generate personas:", err);

      const status = err?.status;

      let message;

      if (status === 429) {
        message =
          "AI service is temporarily busy. Please try again later.";
      } else if (status === 503) {
        message =
          "AI service is temporarily unavailable. Please try again later.";
      } else if (status === 502) {
        message =
          "AI service could not process the request. Please try again.";
      } else if (status === 422) {
        message =
          err.message || "Invalid persona generation request.";
      } else if (status === 401) {
        message =
          "Your session has expired. Please log in again.";
      } else {
        message =
          err.message ||
          "Unable to generate personas. Please try again.";
      }

      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePersona() {
    if (!deletingPersona) {
      return;
    }

    try {
      setDeleting(true);

      await deletePersona(deletingPersona.id);

      const deletedPersonaName = deletingPersona.name;

      setDeletingPersona(null);

      await loadPersonaData();

      toast.success(
        `"${deletedPersonaName}" deleted successfully.`,
      );
    } catch (err) {
      console.error("Failed to delete persona:", err);

      toast.error(
        err.message || "Failed to delete persona.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-7">
        {/* Page heading */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#202725]">
              Generated Personas
            </h1>

            <p className="mt-1.5 text-sm text-[#737d79]">
              AI-generated personas for your experiments.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {hasPersonas && (
              <>
                {/* Search */}
                <div className="relative">
                  <FiSearch
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#909995]"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search personas..."
                    className="h-10 w-full rounded-lg border border-[#dfe6e3] bg-white pl-9 pr-3 text-[13px] text-[#26302d] outline-none transition focus:border-[#16866f] sm:w-48"
                  />
                </div>

                {/* Combined Filter */}
                <PersonaFilter
                  experiments={experiments}
                  experimentId={filterExperimentId}
                  gender={filterGender}
                  onChange={(experimentId, gender) => {
                    setFilterExperimentId(experimentId);
                    setFilterGender(gender);
                  }}
                />
              </>
            )}

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#16866f] px-4 text-[13.5px] font-semibold text-white transition hover:bg-[#11735f]"
            >
              <FiPlus size={15} />

              {hasPersonas
                ? "Generate More"
                : "Create Persona"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-[#e7ecea] bg-white py-16 text-center text-sm text-[#707a76]">
            Loading personas...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty initial state */}
        {!loading && !error && !hasPersonas && (
          <div className="rounded-2xl border border-dashed border-[#cfdad6] bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f7f3] text-[#16866f]">
              <FiPlus size={22} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[#26302d]">
              No personas yet
            </h2>

            <p className="mx-auto mt-1.5 max-w-md text-sm text-[#7a8480]">
              Generate AI-powered personas from one of your
              experiments to begin your research.
            </p>
          </div>
        )}

        {/* Persona Groups */}
        {!loading &&
          !error &&
          hasPersonas &&
          filteredGroups.length > 0 && (
            <div className="space-y-8">
              {filteredGroups.map((group) => (
                <section key={group.experiment.id}>
                  {/* Experiment heading */}
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#303936]">
                        {group.experiment.name}
                      </h2>

                      <p className="mt-1 text-[13.5px] text-[#87918d]">
                        {group.personas.length}{" "}
                        {group.personas.length === 1
                          ? "persona"
                          : "personas"}
                      </p>
                    </div>
                  </div>

                  {/* Persona cards */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.personas.map((persona) => (
                      <PersonaCard
                        key={persona.id}
                        persona={persona}
                        onView={() =>
                          navigate(`/personas/${persona.id}`)
                        }
                        onEdit={() =>
                          navigate(
                            `/personas/${persona.id}?edit=true`,
                          )
                        }
                        onDelete={() =>
                          setDeletingPersona(persona)
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

        {/* Search / Filter empty */}
        {!loading &&
          !error &&
          hasPersonas &&
          filteredGroups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d9e1de] bg-white py-14 text-center">
              <FiSearch
                size={24}
                className="mx-auto text-[#a2aaa7]"
              />

              <p className="mt-3 text-sm font-semibold text-[#303936]">
                No personas found
              </p>

              <p className="mt-1 text-xs text-[#7d8783]">
                Try changing your search or filter.
              </p>
            </div>
          )}
      </div>

      {/* =====================================================
          Create Persona Modal
      ===================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md overflow-visible rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#edf1ef] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#26302d]">
                  Generate Personas
                </h2>

                <p className="mt-1 text-xs text-[#77817d]">
                  Choose an experiment and define the generation
                  settings.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-lg p-2 text-[#7d8783] transition hover:bg-[#f2f5f4] hover:text-[#26302d] disabled:opacity-50"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreatePersonas}
              className="space-y-4 px-5 py-5"
            >
              {/* Experiment */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#26302d]">
                  Select Experiment
                  <span className="ml-1 text-[#d45d5d]">
                    *
                  </span>
                </label>

                <CustomDropdown
                  value={selectedExperimentId}
                  options={experiments.map((experiment) => ({
                    value: String(experiment.id),
                    label: experiment.name,
                  }))}
                  placeholder="Select an experiment"
                  onChange={setSelectedExperimentId}
                  disabled={creating}
                />
              </div>

              {/* Number of Personas */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#26302d]">
                  Number of Personas
                  <span className="ml-1 text-[#d45d5d]">
                    *
                  </span>
                </label>

                <CustomDropdown
                  value={personaCount}
                  options={Array.from(
                    { length: 10 },
                    (_, index) => ({
                      value: String(index + 1),
                      label: String(index + 1),
                    }),
                  )}
                  placeholder="Select number of personas"
                  onChange={setPersonaCount}
                  disabled={creating}
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#26302d]">
                  Persona Focus / Instructions
                  <span className="ml-1 font-normal text-[#929b98]">
                    (Optional)
                  </span>
                </label>

                <textarea
                  value={instructions}
                  onChange={(event) =>
                    setInstructions(event.target.value)
                  }
                  disabled={creating}
                  rows={3}
                  maxLength={500}
                  placeholder="Example: Focus on mobile-first users."
                  className="w-full resize-none rounded-lg border border-[#dfe6e3] px-3.5 py-2.5 text-sm text-[#3f4945] outline-none placeholder:text-[#a0a8a5] transition focus:border-[#16866f] focus:ring-2 focus:ring-[#16866f]/10 disabled:bg-[#f4f6f5]"
                />

                <p className="mt-1 text-right text-[11px] text-[#8c9692]">
                  {instructions.length}/500
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-lg border border-[#dfe6e3] px-4 py-2.5 text-sm font-medium text-[#66716d] transition hover:bg-[#f4f6f5] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-[#16866f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11735f] disabled:opacity-60"
                >
                  {creating
                    ? "Generating..."
                    : "Generate Personas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          Delete Persona Modal
      ===================================================== */}
      {deletingPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[#26302d]">
              Delete Persona?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#68736f]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#26302d]">
                {deletingPersona.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPersona(null)}
                disabled={deleting}
                className="rounded-lg border border-[#dfe6e3] px-4 py-2.5 text-sm font-medium text-[#68736f] transition hover:bg-[#f4f6f5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeletePersona}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                <FiTrash2 size={15} />

                {deleting
                  ? "Deleting..."
                  : "Delete Persona"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Personas;