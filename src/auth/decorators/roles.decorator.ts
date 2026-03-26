import { SetMetadata } from '@nestjs/common';

// 'roles'라는 키 값으로, 우리가 넘겨준 권한 배열(예: ['ADMIN'])을 메타데이터로 저장하는 함수입니다.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
