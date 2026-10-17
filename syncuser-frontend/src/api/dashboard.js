const API_BASE_URL = "http://127.0.0.1:8000";

export async function getDashboard() {
  const accessToken = localStorage.getItem("synuserAccessToken");

  if (!accessToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/`,
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
      data.detail || "Failed to load dashboard data."
    );

    error.status = response.status;

    throw error;
  }

  return data;
}