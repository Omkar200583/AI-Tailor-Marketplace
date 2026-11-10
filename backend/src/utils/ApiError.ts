export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  static badRequest(m = "Bad request", d?: unknown) { return new ApiError(400, m, d); }
  static unauthorized(m = "Unauthorized") { return new ApiError(401, m); }
  static forbidden(m = "Forbidden") { return new ApiError(403, m); }
  static notFound(m = "Not found") { return new ApiError(404, m); }
  static conflict(m = "Conflict") { return new ApiError(409, m); }
}
