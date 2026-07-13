export type AppErrorCode =
  | "INVALID_REQUEST"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "NO_DATA"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

interface AppErrorOptions {
  readonly code: AppErrorCode;
  readonly publicMessage: string;
  readonly statusCode?: number;
  readonly retryable?: boolean;
  readonly cause?: unknown;
}

const DEFAULT_STATUS_BY_CODE: Readonly<Record<AppErrorCode, number>> = {
  INVALID_REQUEST: 400,
  METHOD_NOT_ALLOWED: 405,
  NOT_FOUND: 404,
  NO_DATA: 200,
  RATE_LIMITED: 429,
  PROVIDER_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

const RETRYABLE_CODES = new Set<AppErrorCode>([
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly publicMessage: string;
  readonly statusCode: number;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor({
    code,
    publicMessage,
    statusCode = DEFAULT_STATUS_BY_CODE[code],
    retryable = RETRYABLE_CODES.has(code),
    cause,
  }: AppErrorOptions) {
    super(publicMessage, cause === undefined ? undefined : { cause });
    this.name = "AppError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.statusCode = statusCode;
    this.retryable = retryable;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    publicMessage: "Não foi possível gerar o card.",
    cause: error,
  });
}
