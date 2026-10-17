import { X } from "lucide-react";


function CreateExperimentModal({
  formData,
  setFormData,
  onClose,
  onSubmit,
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">

      {/* Modal */}
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EEED] px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-[#262633]">
              Create Experiment
            </h2>

            <p className="mt-1 text-xs text-[#7A838B]">
              Create a new research experiment.
            </p>
          </div>


          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#7A838B] transition hover:bg-[#F0F5F4] hover:text-[#262633]"
          >
            <X
              className="h-4 w-4"
              strokeWidth={2}
            />
          </button>

        </div>


        {/* Form */}
        <form onSubmit={onSubmit}>

          <div className="space-y-5 px-6 py-6">

            {/* Experiment Name */}
            <div>
              <label
                htmlFor="experiment-name"
                className="mb-1.5 block text-xs font-semibold text-[#3D454C]"
              >
                Experiment Name
              </label>

              <input
                id="experiment-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter experiment name"
                className="w-full rounded-xl border border-[#DCE8E6] bg-white px-3.5 py-2.5 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A7AC] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
              />
            </div>


            {/* Target Audience */}
            <div>
              <label
                htmlFor="target-audience"
                className="mb-1.5 block text-xs font-semibold text-[#3D454C]"
              >
                Target Audience
              </label>

              <input
                id="target-audience"
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                placeholder="e.g. Urban Shoppers"
                className="w-full rounded-xl border border-[#DCE8E6] bg-white px-3.5 py-2.5 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A7AC] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
              />
            </div>


            {/* Description */}
            <div>
              <label
                htmlFor="experiment-description"
                className="mb-1.5 block text-xs font-semibold text-[#3D454C]"
              >
                Description
              </label>

              <textarea
                id="experiment-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this experiment is about"
                rows={4}
                className="w-full resize-none rounded-xl border border-[#DCE8E6] bg-white px-3.5 py-2.5 text-sm text-[#262633] outline-none transition placeholder:text-[#A0A7AC] focus:border-[#0F8E77] focus:ring-2 focus:ring-[#0F8E77]/10"
              />
            </div>

          </div>


          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[#E8EEED] px-6 py-4">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DCE8E6] bg-white px-4 py-2.5 text-xs font-medium text-[#626975] transition hover:bg-[#F4FAF9]"
            >
              Cancel
            </button>


            <button
              type="submit"
              className="rounded-xl bg-[#0F8E77] px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#0C7A66] hover:shadow-md"
            >
              Create Experiment
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default CreateExperimentModal;