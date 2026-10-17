const API_BASE_URL = "http://127.0.0.1:8000";

function getAccessToken() {
  return localStorage.getItem("synuserAccessToken");
}

// Generate Personas
export async function generatePersonas(
  experimentId,
  personaCount,
  instructions,
) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/personas/generate/${experimentId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        persona_count: personaCount,
        instructions: instructions || null,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.detail || "Failed to generate personas.");

    error.status = response.status;

    throw error;
  }

  return data;
}

// Get Personas for an Experiment
export async function getPersonasForExperiment(experimentId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/personas/experiment/${experimentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load personas.");
  }

  return data;
}

// Get Single Persona
export async function getPersona(personaId) {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/personas/${personaId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load persona.");
  }

  return data;
}

// Update Persona
export async function updatePersona(personaId, payload) {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/personas/${personaId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update persona.");
  }

  return data;
}

// Delete Persona
export async function deletePersona(personaId) {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/personas/${personaId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to delete persona.");
  }

  return data;
}
