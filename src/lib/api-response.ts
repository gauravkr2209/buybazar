export function apiError(message: string, status: number): Response {
  return Response.json({ error: { message } }, { status });
}

export function serviceUnavailable(message: string): Response {
  return apiError(message, 503);
}
