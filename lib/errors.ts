export function errorMessage(error: unknown): string {
  const detail = error && typeof error === "object" && "message" in error
    ? String(error.message) : "An unexpected error occurred.";
  if (/fetch|network|timeout/i.test(detail)) {
    return "Cannot reach FinDash. Check your connection and confirm the server is running.";
  }
  return detail;
}
