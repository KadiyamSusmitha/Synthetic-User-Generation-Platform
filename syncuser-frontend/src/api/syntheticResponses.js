const API_BASE_URL = "http://127.0.0.1:8000";

function getAccessToken() {
  const accessToken = localStorage.getItem(
    "synuserAccessToken",
  );

  if (!accessToken) {
    const error = new Error(
      "Authentication required.",
    );

    error.status = 401;

    throw error;
  }

  return accessToken;
}

async function handleResponse(
  response,
  fallbackMessage,
) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response does not contain JSON.
  }

  if (!response.ok) {
    const error = new Error(
      data?.detail || fallbackMessage,
    );

    error.status = response.status;

    throw error;
  }

  return data;
}


// ============================================================
// SYNTHETIC RESPONSE APIs
// ============================================================

export async function generateSyntheticResponses(
  surveyId,
) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/synthetic-responses/generate/${surveyId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to generate synthetic responses.",
  );
}