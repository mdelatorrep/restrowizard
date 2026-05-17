export class ServiceError extends Error {
  code?: string;
  details?: unknown;
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.details = details;
  }
}

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: ServiceError };

export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function fail<T = never>(message: string, code?: string, details?: unknown): ServiceResult<T> {
  return { data: null, error: new ServiceError(message, code, details) };
}
