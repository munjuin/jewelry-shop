// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// 요청(Request) 객체 안에 user 정보가 어떤 형태로 들어있는지 TypeScript에게 알려줍니다.
// (만약 별도의 interface 파일로 분리해두셨다면 import 해서 사용하시면 됩니다.)
interface RequestWithUser {
  user: {
    sub: string | number;
    role: string;
    // 필요한 다른 속성이 있다면 여기에 추가
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 컨트롤러나 메서드에 붙은 @Roles() 데코레이터의 요구 권한을 읽어옵니다.
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. 요구되는 권한이 없다면 누구나 접근 가능한 API이므로 통과시킵니다.
    if (!requiredRoles) {
      return true;
    }

    // 3. HTTP 요청 객체를 가져오면서, 우리가 정의한 RequestWithUser 타입을 입혀줍니다.
    // 이렇게 하면 user와 user.role을 읽을 때 any 타입 에러가 발생하지 않습니다.
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // 4. (안전장치) 토큰 검증은 통과했지만 user 객체나 role 정보가 아예 없는 비정상적인 경우 차단합니다.
    if (!user || !user.role) {
      return false;
    }

    // 5. 요구되는 권한 배열(예: ['ADMIN'])에 현재 유저의 권한(예: 'USER')이 포함되어 있는지 검사합니다.
    return requiredRoles.includes(user.role);
  }
}
