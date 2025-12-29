// config/env.js
const dotenv = require('dotenv');

// 여기서 한 번만 로드
dotenv.config();

// 환경 변수 유효성 검사도 여기서 할 수 있습니다. (옵션)
if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error("⚠️  .env 파일에 AWS_ACCESS_KEY_ID가 없습니다.");
}

module.exports = {
    port: process.env.PORT || 3000,
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        bucketName: process.env.AWS_BUCKET_NAME,
    },
    sessionSecret: process.env.SESSION_SECRET,
    // ... 필요한 변수들 정리
};