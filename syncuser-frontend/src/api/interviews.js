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

async function handleResponse(response, defaultMessage) {
  let data;

  try {
    data = await response.json();
  } catch {
    // Response does not contain JSON.
  }

  if (!response.ok) {
    const error = new Error(data?.detail || defaultMessage);

    error.status = response.status;
    throw error;
  }

  return data;
}

/* =========================================================
   Create Interview
   ========================================================= */

export async function createInterview(experimentId, personaId) {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/interviews/`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },

    body: JSON.stringify({
      experiment_id: Number(experimentId),
      persona_id: Number(personaId),
    }),
  });

  return handleResponse(response, "Failed to start interview.");
}

/* =========================================================
   Get Interviews
   ========================================================= */

export async function getInterviews() {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/interviews/`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response, "Failed to load interviews.");
}

/* =========================================================
   Get Interview
   ========================================================= */

export async function getInterview(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(response, "Failed to load interview.");
}

/* =========================================================
   Get Interview Messages
   ========================================================= */

export async function getInterviewMessages(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/messages`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to load interview conversation.",
  );
}

/* =========================================================
   Generate Interview Turn
   ========================================================= */

export async function generateInterviewTurn(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/turn`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to generate the next interview turn.",
  );
}

/* =========================================================
   Generate Follow-up
   ========================================================= */

export async function generateInterviewFollowUp(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/follow-up`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to generate the follow-up question.",
  );
}

/* =========================================================
   Run Interview Cycle
   ========================================================= */

export async function runInterviewCycle(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/cycle`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to continue the interview.",
  );
}

/* =========================================================
   Complete Interview
   ========================================================= */

export async function completeInterview(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/complete`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to complete the interview.",
  );
}

/* =========================================================
   Save Interview
   ========================================================= */

export async function saveInterview(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/save`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to save interview.",
  );
}

/* =========================================================
   Delete Interview
   ========================================================= */

export async function deleteInterview(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to delete interview.",
  );
}

/* =========================================================
   Get Interview Result
   ========================================================= */

export async function getInterviewResult(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/result`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to load interview results.",
  );
}

/* =========================================================
   Add Interview Note
   ========================================================= */

export async function addInterviewNote(interviewId, note) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/notes`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },

      body: JSON.stringify({
        note,
      }),
    },
  );

  return handleResponse(
    response,
    "Failed to save interview note.",
  );
}

/* =========================================================
   Get Interview Notes
   ========================================================= */

export async function getInterviewNotes(interviewId) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/interviews/${interviewId}/notes`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse(
    response,
    "Failed to load interview notes.",
  );
}