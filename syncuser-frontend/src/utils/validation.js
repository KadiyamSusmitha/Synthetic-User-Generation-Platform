export function validateUsername(username) {
  if (username.length === 0) {
    return "Username is required.";
  }

  return "";
}

export function validateEmail(email) {
  // 1. Empty email
  if (email.length === 0) {
    return 'Email address is required.'
  }

  // 2. Any whitespace anywhere in the email
  if (/\s/.test(email)) {
    return 'Email must not contain spaces.'
  }

  // 3. Gmail format and domain validation
  const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/

  if (!gmailPattern.test(email)) {
    return 'Please enter a valid Gmail address ending with @gmail.com.'
  }

  return ''
}

export function validatePassword(password) {
  // 1. Empty password
  if (password.length === 0) {
    return 'Password is required.'
  }

  // 2. Spaces anywhere in password
  if (/\s/.test(password)) {
    return 'Password must not contain spaces.'
  }

  // 3. Minimum length
  if (password.length < 8) {
    return 'Password must contain at least 8 characters.'
  }

  return ''
}