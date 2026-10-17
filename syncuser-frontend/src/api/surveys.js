
const API_BASE_URL = "http://127.0.0.1:8000";

function getAccessToken() {
  const accessToken = localStorage.getItem("synuserAccessToken");

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  return accessToken;
}

async function handleResponse(response, fallbackMessage) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response does not contain JSON.
  }

  if (!response.ok) {
    const error = new Error(data?.detail || fallbackMessage);

    error.status = response.status;
    throw error;
  }

  return data;
}

// ============================================================
// SURVEY APIs
// ============================================================

export async function getSurveys() {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/surveys`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response, "Failed to load surveys.");
}

export async function getSurvey(surveyId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(response, "Failed to load survey.");
}

export async function createSurvey(title, experimentId = null) {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/surveys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      title,
      experiment_id: experimentId,
    }),
  });

  return handleResponse(response, "Failed to create survey.");
}

export async function updateSurvey(surveyId, title) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title,
      }),
    },
  );

  return handleResponse(response, "Failed to update survey.");
}

export async function deleteSurvey(surveyId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    return handleResponse(response, "Failed to delete survey.");
  }

  return true;
}

// ============================================================
// QUESTION APIs
// ============================================================

export async function getSurveyQuestions(surveyId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}/questions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(response, "Failed to load survey questions.");
}

export async function createSurveyQuestion(surveyId, questionData) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}/questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(questionData),
    },
  );

  return handleResponse(response, "Failed to create question.");
}

export async function updateSurveyQuestion(
  surveyId,
  questionId,
  questionData,
) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}/questions/${questionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(questionData),
    },
  );

  return handleResponse(response, "Failed to update question.");
}

export async function deleteSurveyQuestion(surveyId, questionId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}/questions/${questionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    return handleResponse(response, "Failed to delete question.");
  }

  return true;
}

// ============================================================
// SURVEY READY API
// ============================================================

export async function markSurveyReady(surveyId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/surveys/${surveyId}/ready`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to mark survey as ready.",
  );
}

// ============================================================
// SYNTHETIC RESPONSE APIs
// ============================================================

export async function generateSyntheticResponses(surveyId) {
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

export async function getSyntheticResponses(surveyId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/synthetic-responses/survey/${surveyId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to load synthetic responses.",
  );
}
