export interface User {
  id: number;
  email: string;
  password?: string; // 조회 시 비밀번호를 제외할 수 있으므로 옵셔널
  name: string;
  role: 'user' | 'admin'; // 오타 방지를 위해 문자열 리터럴 사용
  created_at: Date;
}