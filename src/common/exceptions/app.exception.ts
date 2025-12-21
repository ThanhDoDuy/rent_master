import {
  HttpException,
  HttpStatus,
  HttpExceptionOptions,
} from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../constants/error-codes';

export interface AppExceptionResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path?: string;
}

/**
 * Custom application exception with error codes
 */
export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly timestamp: string;

  constructor(
    errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    customMessage?: string,
    options?: HttpExceptionOptions,
  ) {
    const message = customMessage || ErrorMessages[errorCode] || 'An error occurred';
    
    super(
      {
        statusCode,
        errorCode,
        message,
        timestamp: new Date().toISOString(),
      } as AppExceptionResponse,
      statusCode,
      options,
    );

    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get the error response object
   */
  getResponse(): AppExceptionResponse {
    return super.getResponse() as AppExceptionResponse;
  }
}

/**
 * Convenience exception classes for common HTTP status codes
 */
export class AppBadRequestException extends AppException {
  constructor(errorCode: ErrorCode, customMessage?: string) {
    super(errorCode, HttpStatus.BAD_REQUEST, customMessage);
  }
}

export class AppUnauthorizedException extends AppException {
  constructor(errorCode: ErrorCode, customMessage?: string) {
    super(errorCode, HttpStatus.UNAUTHORIZED, customMessage);
  }
}

export class AppForbiddenException extends AppException {
  constructor(errorCode: ErrorCode, customMessage?: string) {
    super(errorCode, HttpStatus.FORBIDDEN, customMessage);
  }
}

export class AppNotFoundException extends AppException {
  constructor(errorCode: ErrorCode, customMessage?: string) {
    super(errorCode, HttpStatus.NOT_FOUND, customMessage);
  }
}

export class AppConflictException extends AppException {
  constructor(errorCode: ErrorCode, customMessage?: string) {
    super(errorCode, HttpStatus.CONFLICT, customMessage);
  }
}

export class AppInternalServerErrorException extends AppException {
  constructor(errorCode: ErrorCode, customMessage?: string) {
    super(errorCode, HttpStatus.INTERNAL_SERVER_ERROR, customMessage);
  }
}
