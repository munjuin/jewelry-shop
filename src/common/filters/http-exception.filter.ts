// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

// 1. 에러 응답의 구조를 미리 정의합니다. (인터페이스)
interface ErrorResponseObject {
  message?: string | string[]; // NestJS 에러는 문자열 배열일 수도 있습니다.
  [key: string]: any; // 다른 필드가 더 있을 수도 있음을 명시
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception.getStatus();

    const res = exception.getResponse();

    // 2. 타입을 any 대신 위에서 만든 인터페이스로 지정합니다.
    const message =
      typeof res === 'object' && res !== null
        ? (res as ErrorResponseObject).message || JSON.stringify(res)
        : res;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message, // 이제 빨간 줄이 사라집니다!
    });
  }
}
