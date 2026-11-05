
export function getApiError(
  error,
  fallbackMessage = "Something went wrong. Please try again."
) {
  // 1. Check whether the request timed out
  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT"
  ) {
    return "The request is taking too long. Please try again.";
  }

  // 2. Check whether the backend is unavailable
  if (!error?.response) {
    return "Unable to connect to the backend. Make sure the backend server is running.";
  }

  const status = error.response.status;
  const detail = error.response.data?.detail;

  // 3. Handle FastAPI validation errors (422)
  if (status === 422) {
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const field = Array.isArray(item.loc)
            ? item.loc.slice(1).join(".")
            : "Input";

          return `${field}: ${item.msg}`;
        })
        .join(", ");
    }

    return typeof detail === "string"
      ? detail
      : "Please check the information you entered.";
  }

  // 4. Handle common HTTP status codes
  const messages = {
    400: "Invalid request. Please check your input.",
    401: "You are not authorized. Please log in again.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    413: "The uploaded file is too large.",
    429: "Too many requests. Please wait and try again.",
    500: "Internal server error. Please try again later.",
    502: "The AI service returned an invalid response. Please try again.",
    503: "The AI service is temporarily unavailable. Please try again later.",
    504: "The AI service took too long to respond. Please try again.",
  };

  // 5. Prefer the actual error message returned by FastAPI
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  // 6. Return the matching status message or fallback
  return messages[status] || fallbackMessage;
}
