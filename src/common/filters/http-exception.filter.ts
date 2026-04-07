// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseObject {
  message?: string | string[];
  [key: string]: any;
}

// 💡 1. 괄호 안을 비워서(HttpException 삭제) 애플리케이션의 '모든' 예외를 다 잡도록 합니다.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 💡 2. 어떤 에러가 올지 모르니 unknown으로 받습니다.
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    // 💡 3. 에러의 종류를 판별합니다.
    const isHttpException = exception instanceof HttpException;

    // 우리가 아는 에러면 그 상태 코드를 쓰고, 모르는 서버 에러면 500을 줍니다.
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // 우리가 아는 에러면 그 메시지를 쓰고, 모르는 에러면 보안을 위해 숨깁니다.
    let message: string | string[] =
      '서버 내부 에러가 발생했습니다. (Internal Server Error)';

    if (isHttpException) {
      const res = exception.getResponse();
      message =
        typeof res === 'object' && res !== null
          ? (res as ErrorResponseObject).message || JSON.stringify(res)
          : res;
    } else {
      // 💡 [중요] 500 에러일 경우, 클라이언트에게는 숨기지만 서버 터미널에는 반드시 로그를 남겨야 우리가 디버깅을 할 수 있습니다!
      console.error(
        `[🚨 Unhandled Exception] ${request.method} ${request.url}`,
      );
      console.error(exception);
    }

    // 4. 일관된 응답 포맷으로 클라이언트에게 반환
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
