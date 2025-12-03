// config/multer.js
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer = require('multer');

// ⭐ 1. 우리가 만든 설정 모듈 불러오기
const config = require('./env'); 

const s3 = new S3Client({
    region: config.aws.region, // ✅ process.env 대신 config 사용
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.aws.bucketName, // ✅ 깔끔해짐
        // ... (나머지 동일)
    }),
    // ...
});

module.exports = upload;