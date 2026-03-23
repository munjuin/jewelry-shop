declare namespace NodeJS {
  interface ProcessEnv {
    // 1. 서버 기본 설정
    PORT?: string;
    NODE_ENV: 'development' | 'production' | 'test' | '개발환경'; // '개발환경' 문자열도 허용하도록 설계
    SESSION_SECRET: string;

    // 2. PostgreSQL 설정
    DB_HOST: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_PORT: string;

    // 3. AWS S3 설정
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;
  }
}