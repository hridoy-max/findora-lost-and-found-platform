/**
 * Normalizes backend errors into user-friendly strings.
 */
export function getErrorMessage(err) {
  if (!err.response) {
    return "Can't reach the server. Check your connection and try again.";
  }

  const status = err.response.status;
  const data = err.response.data;

  if (status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }

  if (status === 500) {
    return "Something went wrong on our side. Try again in a moment.";
  }

  if (status === 403 && data?.detail?.toLowerCase().includes('deactivated')) {
    return "This account is deactivated. Contact an administrator.";
  }

  // FastAPI returns either a string detail or an array of validation errors
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail.map(e => e.msg).join(' ');
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Extracts field-specific errors from a 422 Unprocessable Entity response.
 * Returns { fieldName: "error message" }
 */
export function getFieldErrors(err) {
  const errors = {};
  if (err.response?.status === 422 && Array.isArray(err.response.data?.detail)) {
    err.response.data.detail.forEach(e => {
      // FastAPI loc: ["body", "field_name"]
      const field = e.loc[e.loc.length - 1];
      errors[field] = e.msg;
    });
  }
  return errors;
}
