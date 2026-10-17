import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEdit2,
  FiMapPin,
  FiSave,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../components/DashboardLayout";
import PersonaAvatar from "../components/PersonaAvatar";
import { deletePersona, getPersona, updatePersona } from "../api/personas";

const tabs = [
  "Overview",
  "Demographics",
  "Goals & Needs",
  "Pain Points",
  "Behavior",
];

function PersonaDetail() {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isEditMode = searchParams.get("edit") === "true";

  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    description: "",
    age: "",
    occupation: "",
    location: "",
    goals: "",
    pain_points: "",
    behaviors: "",
    interests: "",
    needs: "",
  });

  useEffect(() => {
    let ignore = false;

    async function loadPersona() {
      try {
        setLoading(true);
        setError("");

        const data = await getPersona(personaId);

        if (ignore) {
          return;
        }

        setPersona(data);

        setFormData({
          name: data.name || "",
          gender: data.gender || "male",
          description: data.description || "",
          age: data.age ?? "",
          occupation: data.occupation || "",
          location: data.location || "",
          goals: (data.goals || []).join("\n"),
          pain_points: (data.pain_points || []).join("\n"),
          behaviors: (data.behaviors || []).join("\n"),
          interests: (data.interests || []).join("\n"),
          needs: (data.needs || []).join("\n"),
        });
      } catch (err) {
        if (ignore) {
          return;
        }

        console.error("Failed to load persona:", err);

        setError(err.message || "Failed to load persona.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPersona();

    return () => {
      ignore = true;
    };
  }, [personaId]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function convertLinesToArray(value) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "Name is required.";
    }

    if (!formData.description.trim()) {
      return "Description is required.";
    }

    if (!formData.age || Number(formData.age) < 1) {
      return "Age must be at least 1.";
    }

    if (!formData.occupation.trim()) {
      return "Occupation is required.";
    }

    if (!formData.location.trim()) {
      return "Location is required.";
    }

    const goals = convertLinesToArray(formData.goals);
    const painPoints = convertLinesToArray(formData.pain_points);
    const behaviors = convertLinesToArray(formData.behaviors);
    const interests = convertLinesToArray(formData.interests);
    const needs = convertLinesToArray(formData.needs);

    const listFields = [
      { name: "Goals", value: goals },
      { name: "Pain Points", value: painPoints },
      { name: "Behaviors", value: behaviors },
      { name: "Interests", value: interests },
      { name: "Needs", value: needs },
    ];

    for (const field of listFields) {
      if (field.value.length < 3) {
        return `${field.name} must contain at least 3 items.`;
      }

      if (field.value.length > 5) {
        return `${field.name} can contain at most 5 items.`;
      }
    }

    return "";
  }

  async function handleSave(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      gender: formData.gender,
      description: formData.description.trim(),
      age: Number(formData.age),
      occupation: formData.occupation.trim(),
      location: formData.location.trim(),
      goals: convertLinesToArray(formData.goals),
      pain_points: convertLinesToArray(formData.pain_points),
      behaviors: convertLinesToArray(formData.behaviors),
      interests: convertLinesToArray(formData.interests),
      needs: convertLinesToArray(formData.needs),
    };

    try {
      setSaving(true);

      const updatedPersona = await updatePersona(personaId, payload);

      setPersona(updatedPersona);

      setFormData({
        name: updatedPersona.name || "",
        gender: updatedPersona.gender || "male",
        description: updatedPersona.description || "",
        age: updatedPersona.age ?? "",
        occupation: updatedPersona.occupation || "",
        location: updatedPersona.location || "",
        goals: (updatedPersona.goals || []).join("\n"),
        pain_points: (updatedPersona.pain_points || []).join("\n"),
        behaviors: (updatedPersona.behaviors || []).join("\n"),
        interests: (updatedPersona.interests || []).join("\n"),
        needs: (updatedPersona.needs || []).join("\n"),
      });

      toast.success("Persona updated successfully.");

      setSearchParams({});
    } catch (err) {
      console.error("Failed to update persona:", err);

      toast.error(err.message || "Failed to update persona.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);

      await deletePersona(personaId);

      toast.success("Persona deleted successfully.");

      navigate("/personas");
    } catch (err) {
      console.error("Failed to delete persona:", err);

      toast.error(err.message || "Failed to delete persona.");

      setDeleting(false);
    }
  }

  function handleCancelEdit() {
    if (persona) {
      setFormData({
        name: persona.name || "",
        gender: persona.gender || "male",
        description: persona.description || "",
        age: persona.age ?? "",
        occupation: persona.occupation || "",
        location: persona.location || "",
        goals: (persona.goals || []).join("\n"),
        pain_points: (persona.pain_points || []).join("\n"),
        behaviors: (persona.behaviors || []).join("\n"),
        interests: (persona.interests || []).join("\n"),
        needs: (persona.needs || []).join("\n"),
      });
    }

    setSearchParams({});
  }

  function openEditMode() {
    setSearchParams({ edit: "true" });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-[#e7ecea] bg-white py-16 text-center text-sm text-[#68736f]">
          Loading persona...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !persona) {
    return (
      <DashboardLayout>
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => navigate("/personas")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#16866f] transition hover:text-[#11735f]"
          >
            <FiArrowLeft size={16} />
            Back to Personas
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error || "Persona not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/personas")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#16866f] transition hover:text-[#11735f]"
        >
          <FiArrowLeft size={15} />
          Back to Personas
        </button>

        {/* ========================= */}
        {/* EDIT MODE                  */}
        {/* ========================= */}
        {isEditMode ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Edit profile header */}
            <div className="rounded-2xl border border-[#e6ece9] bg-white p-6 shadow-[0_2px_12px_rgba(20,40,35,0.05)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="rounded-full bg-[#e7f7f3] p-1">
                  <PersonaAvatar
                    personaId={persona.id}
                    name={persona.name}
                    size="lg"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#16866f]">
                    Edit Persona
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-[#202725]">
                    {persona.name}
                  </h1>

                  <p className="mt-1 text-sm text-[#737d79]">
                    Update the persona information below.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic details */}
            <div className="rounded-2xl border border-[#e6ece9] bg-white p-6 shadow-[0_2px_12px_rgba(20,40,35,0.05)]">
              <SectionHeading
                title="Basic Information"
                description="Update the core profile information."
              />

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  disabled={saving}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#303936]">
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-[#dfe6e3] bg-white px-4 py-2.5 text-sm text-[#303936] outline-none focus:border-[#16866f]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <FormInput
                  label="Age"
                  name="age"
                  type="number"
                  min="1"
                  value={formData.age}
                  onChange={handleFormChange}
                  disabled={saving}
                />

                <FormInput
                  label="Occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleFormChange}
                  disabled={saving}
                />

                <div className="md:col-span-2">
                  <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#303936]">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    disabled={saving}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-[#dfe6e3] px-4 py-3 text-sm text-[#303936] outline-none focus:border-[#16866f] disabled:bg-[#f5f7f6]"
                  />
                </div>
              </div>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ListEditField
                label="Goals"
                name="goals"
                value={formData.goals}
                onChange={handleFormChange}
                disabled={saving}
              />

              <ListEditField
                label="Needs"
                name="needs"
                value={formData.needs}
                onChange={handleFormChange}
                disabled={saving}
              />

              <ListEditField
                label="Pain Points"
                name="pain_points"
                value={formData.pain_points}
                onChange={handleFormChange}
                disabled={saving}
              />

              <ListEditField
                label="Behaviors"
                name="behaviors"
                value={formData.behaviors}
                onChange={handleFormChange}
                disabled={saving}
              />

              <ListEditField
                label="Interests"
                name="interests"
                value={formData.interests}
                onChange={handleFormChange}
                disabled={saving}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-[#dfe6e3] bg-white px-4 py-2.5 text-sm font-medium text-[#68736f] transition hover:bg-[#f4f6f5] disabled:opacity-50"
              >
                <FiX size={15} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16866f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11735f] disabled:opacity-60"
              >
                <FiSave size={15} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* ========================= */
          /* VIEW MODE                  */
          /* ========================= */
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* LEFT PROFILE COLUMN */}
            <aside className="rounded-2xl border border-[#e6ece9] bg-white p-5 shadow-[0_2px_12px_rgba(20,40,35,0.05)]">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-[#e5f7f3] p-1.5">
                  <PersonaAvatar
                    personaId={persona.id}
                    name={persona.name}
                    size="xl"
                  />
                </div>

                <h1 className="mt-4 text-xl font-bold text-[#202725]">
                  {persona.name}
                </h1>

                <p className="mt-1 text-sm text-[#606b67]">
                  {persona.age} years, {persona.occupation}
                </p>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#7d8783]">
                  <FiMapPin size={13} />
                  {persona.location}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 rounded-xl bg-[#edf8f5] p-4">
                <p className="text-xs font-semibold text-[#16866f]">
                  Persona Summary
                </p>

                <p className="mt-2 text-xs leading-5 text-[#56645f]">
                  {persona.description}
                </p>
              </div>

              {/* Personality */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-[#303936]">
                  Personality
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(persona.interests || [])
                    .slice(0, 4)
                    .map((interest, index) => (
                      <span
                        key={`${interest}-${index}`}
                        className="rounded-full bg-[#f1f4f3] px-2.5 py-1 text-[10px] font-semibold text-[#5f6b67]"
                      >
                        {interest}
                      </span>
                    ))}
                </div>
              </div>

              {/* Lifestyle / Needs */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-[#303936]">
                  Lifestyle & Needs
                </h3>

                <div className="mt-3 space-y-2">
                  {(persona.needs || []).slice(0, 3).map((need, index) => (
                    <div
                      key={`${need}-${index}`}
                      className="flex items-start gap-2 text-xs text-[#68736f]"
                    >
                      <FiCheckCircle
                        size={13}
                        className="mt-0.5 shrink-0 text-[#16866f]"
                      />
                      <span>{need}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* RIGHT CONTENT */}
            <section className="min-w-0 rounded-2xl border border-[#e6ece9] bg-white shadow-[0_2px_12px_rgba(20,40,35,0.05)]">
              {/* Header actions */}
              <div className="flex flex-col gap-3 border-b border-[#edf1ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-[#89938f]">
                    Details for this research persona
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openEditMode}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#dfe6e3] bg-white px-3.5 py-2 text-xs font-semibold text-[#303936] transition hover:bg-[#f4f7f6]"
                  >
                    <FiEdit2 size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="overflow-x-auto border-b border-[#edf1ef]">
                <div className="flex min-w-max px-5">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative px-0 py-4 mr-6 text-xs font-semibold transition ${
                        activeTab === tab
                          ? "text-[#16866f]"
                          : "text-[#78827e] hover:text-[#303936]"
                      }`}
                    >
                      {tab}

                      {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#16866f]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="px-5 py-5 sm:px-5 sm:py-6">
                {activeTab === "Overview" && <OverviewTab persona={persona} />}

                {activeTab === "Demographics" && (
                  <DemographicsTab persona={persona} />
                )}

                {activeTab === "Goals & Needs" && (
                  <GoalsNeedsTab persona={persona} />
                )}

                {activeTab === "Pain Points" && (
                  <PainPointsTab persona={persona} />
                )}

                {activeTab === "Behavior" && <BehaviorTab persona={persona} />}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[#26302d]">
              Delete Persona?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#68736f]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#26302d]">
                {persona.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-lg border border-[#dfe6e3] px-4 py-2.5 text-sm font-medium text-[#68736f] transition hover:bg-[#f4f6f5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                <FiTrash2 size={15} />
                {deleting ? "Deleting..." : "Delete Persona"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ========================================================= */
/* TAB COMPONENTS                                             */
/* ========================================================= */

function OverviewTab({ persona }) {
  return (
    <div className="space-y-7">
      <SectionHeading
        title="About"
        description="A concise summary of this research persona."
      />

      <p className="max-w-3xl text-sm leading-7 text-[#5f6b67]">
        {persona.description}
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ListDisplay title="Goals" items={persona.goals} accent="green" />

        <ListDisplay
          title="Pain Points"
          items={persona.pain_points}
          accent="orange"
        />
      </div>

      <ListDisplay title="Needs" items={persona.needs} accent="green" />
    </div>
  );
}

function DemographicsTab({ persona }) {
  return (
    <div className="space-y-7">
      <SectionHeading
        title="Demographics"
        description="Core demographic information for this persona."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          icon={<FiUser size={16} />}
          label="Name"
          value={persona.name}
        />

        <InfoCard
          icon={<FiUser size={16} />}
          label="Gender"
          value={
            persona.gender
              ? persona.gender.charAt(0).toUpperCase() + persona.gender.slice(1)
              : "Not specified"
          }
        />

        <InfoCard
          icon={<FiUser size={16} />}
          label="Age"
          value={`${persona.age} years`}
        />

        <InfoCard
          icon={<FiUser size={16} />}
          label="Occupation"
          value={persona.occupation}
        />

        <InfoCard
          icon={<FiMapPin size={16} />}
          label="Location"
          value={persona.location}
        />
      </div>
    </div>
  );
}

function GoalsNeedsTab({ persona }) {
  return (
    <div className="space-y-7">
      <SectionHeading
        title="Goals & Needs"
        description="What this persona wants to achieve and what they need."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ListDisplay title="Goals" items={persona.goals} accent="green" />

        <ListDisplay title="Needs" items={persona.needs} accent="green" />
      </div>
    </div>
  );
}

function PainPointsTab({ persona }) {
  return (
    <div className="space-y-7">
      <SectionHeading
        title="Pain Points"
        description="Problems and frustrations that influence this persona."
      />

      <ListDisplay
        title="Pain Points"
        items={persona.pain_points}
        accent="orange"
      />
    </div>
  );
}

function BehaviorTab({ persona }) {
  return (
    <div className="space-y-7">
      <SectionHeading
        title="Behavior"
        description="Observed behaviors and areas of interest."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ListDisplay
          title="Behaviors"
          items={persona.behaviors}
          accent="blue"
        />

        <ListDisplay
          title="Interests"
          items={persona.interests}
          accent="purple"
        />
      </div>
    </div>
  );
}

/* ========================================================= */
/* REUSABLE UI                                                */
/* ========================================================= */

function SectionHeading({ title, description }) {
  return (
    <div>
      <h2 className="text-base font-bold text-[#28312e]">{title}</h2>

      {description && (
        <p className="mt-1 text-xs leading-5 text-[#89938f]">{description}</p>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#e7ecea] bg-[#fafcfb] p-4">
      <div className="flex items-center gap-2 text-[#16866f]">
        {icon}

        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-[#303936]">{value}</p>
    </div>
  );
}

function ListDisplay({ title, items = [], accent = "green" }) {
  const accentClasses = {
    green: "bg-[#e8f7f3] text-[#16866f]",
    orange: "bg-[#fff4e8] text-[#dc8128]",
    blue: "bg-[#edf5ff] text-[#3977b5]",
    purple: "bg-[#f4efff] text-[#7b5bb5]",
  };

  return (
    <div className="rounded-xl border border-[#e7ecea] bg-white">
      <div className="border-b border-[#edf1ef] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#303936]">{title}</h3>
      </div>

      <div className="space-y-2 p-4">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-start gap-3 rounded-lg bg-[#fafcfb] px-3 py-3"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${accentClasses[accent]}`}
              >
                {index + 1}
              </span>

              <span className="text-xs leading-5 text-[#5f6b67]">{item}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-[#8b9591]">No information available.</p>
        )}
      </div>
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  disabled,
  type = "text",
  min,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#303936]">
        {label}
      </label>

      <input
        type={type}
        name={name}
        min={min}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-[#dfe6e3] px-4 py-2.5 text-sm text-[#303936] outline-none focus:border-[#16866f] disabled:bg-[#f5f7f6]"
      />
    </div>
  );
}

function ListEditField({ label, name, value, onChange, disabled }) {
  return (
    <div className="rounded-2xl border border-[#e6ece9] bg-white p-5 shadow-[0_2px_10px_rgba(20,40,35,0.04)]">
      <label className="mb-2 block text-sm font-semibold text-[#303936]">
        {label}
      </label>

      <p className="mb-3 text-xs text-[#89938f]">
        Enter one item per line. Minimum 3 and maximum 5 items.
      </p>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={6}
        className="w-full resize-none rounded-lg border border-[#dfe6e3] px-4 py-3 text-sm text-[#303936] outline-none focus:border-[#16866f] disabled:bg-[#f5f7f6]"
      />
    </div>
  );
}

export default PersonaDetail;
