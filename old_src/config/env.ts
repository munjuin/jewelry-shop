import dotenv from 'dotenv';
dotenv.config();

// 1. 설정 객체의 구조를 인터페이스로 정의합니다.
interface Config {
    port: number;
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        bucketName: string;
    };
    sessionSecret: string;
}

// 2. 환경 변수가 없을 때 에러를 던지는 헬퍼 함수
const required = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`⚠️  .env 파일에 ${key}가 정의되지 않았습니다.`);
    }
    return value;
};

// 3. 계층형 구조를 유지한 상수 내보내기
export const config: Config = {
    port: Number(process.env.PORT || 3000),
    aws: {
        accessKeyId: required('AWS_ACCESS_KEY_ID'),
        secretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
        region: required('AWS_REGION'),
        bucketName: required('AWS_BUCKET_NAME'),
    },
    sessionSecret: required('SESSION_SECRET'),
};