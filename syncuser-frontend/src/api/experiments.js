const API_BASE_URL = "http://127.0.0.1:8000";


export async function getExperiments() {
  const accessToken = localStorage.getItem(
    "synuserAccessToken"
  );

  if (!accessToken) {
    const error = new Error(
      "Authentication required."
    );

    error.status = 401;

    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail ||
        "Failed to load experiments."
    );

    error.status = response.status;

    throw error;
  }

  return data;
}


export async function createExperiment(
  name,
  targetAudience,
  description
) {
  const accessToken = localStorage.getItem(
    "synuserAccessToken"
  );

  if (!accessToken) {
    const error = new Error(
      "Authentication required."
    );

    error.status = 401;

    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },

      body: JSON.stringify({
        name,
        target_audience: targetAudience,
        description,
        status: "Draft",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail ||
        "Failed to create experiment."
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

export async function getExperiment(experimentId) {
  const accessToken = localStorage.getItem("synuserAccessToken");

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${experimentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail || "Failed to load experiment."
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

export async function deleteExperiment(experimentId) {
  const accessToken = localStorage.getItem("synuserAccessToken");

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${experimentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail || "Failed to delete experiment."
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function updateExperiment(
  experimentId,
  name,
  targetAudience,
  description,
) {
  const accessToken = localStorage.getItem("synuserAccessToken");

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${experimentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name,
        target_audience: targetAudience,
        description,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail || "Failed to update experiment.",
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function startExperiment(experimentId) {
  const accessToken = localStorage.getItem(
    "synuserAccessToken",
  );

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${experimentId}/start`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail || "Failed to start experiment.",
    );

    error.status = response.status;

    throw error;
  }

  return data;
}


export async function completeExperiment(experimentId) {
  const accessToken = localStorage.getItem(
    "synuserAccessToken",
  );

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${experimentId}/complete`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.detail || "Failed to complete experiment.",
    );

    error.status = response.status;

    throw error;
  }

  return data;
}