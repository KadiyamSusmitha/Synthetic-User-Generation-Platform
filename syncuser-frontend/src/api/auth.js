const API_BASE_URL = "http://127.0.0.1:8000";

export async function loginUser(email, password) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed.");
  }

  return data;
}

export async function getCurrentUser(accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch user.");
  }

  return data;
}

export async function updateCurrentUser(accessToken, username) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/me`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        username,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to update username.",
    );
  }

  return data;
}

export async function getLoginActivity(accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/login-activity`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to fetch login activity.",
    );
  }

  return data;
}

export async function registerUser(username, email, password) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed.");
  }

  return data;
}

export async function forgotPassword(email) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to send verification code.");
  }

  return data;
}


export async function verifyOTP(email, otp) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/verify-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Verification failed.");
  }

  return data;
}


export async function resendOTP(email) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/resend-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to resend verification code.");
  }

  return data;
}

export async function resetPassword(resetToken, newPassword) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reset_token: resetToken,
        new_password: newPassword,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to reset password.");
  }

  return data;
}