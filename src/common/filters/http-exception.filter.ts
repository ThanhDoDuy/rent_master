import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException, AppExceptionResponse } from '../exceptions/app.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: AppExceptionResponse;

    if (exception instanceof AppException) {
      // Handle custom AppException
      status = exception.getStatus();
      errorResponse = exception.getResponse();
      errorResponse.path = request.url;
    } else if (exception instanceof HttpException) {
      // Handle standard NestJS HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Check if it's already in the correct format
      if (typeof exceptionResponse === 'object' && 'errorCode' in exceptionResponse) {
        errorResponse = exceptionResponse as AppExceptionResponse;
      } else {
        // Convert standard HttpException to AppExceptionResponse format
        errorResponse = {
          statusCode: status,
          errorCode: this.getErrorCodeFromStatus(status),
          message: typeof exceptionResponse === 'string' 
            ? exceptionResponse 
            : (exceptionResponse as any)?.message || exception.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    } else {
      // Handle unknown errors
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'GENERIC_INTERNAL_SERVER_ERROR',
        message: exception instanceof Error ? exception.message : 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_INVALID_INPUT';
      case HttpStatus.UNAUTHORIZED:
        return 'GENERIC_UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'GENERIC_FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'GENERIC_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'VALIDATION_INVALID_INPUT';
      default:
        return 'GENERIC_INTERNAL_SERVER_ERROR';
    }
  }
}
