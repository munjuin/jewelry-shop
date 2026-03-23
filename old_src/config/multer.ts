import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { config } from './env'; // ✅ 우리가 만든 env.ts 불러오기

// 1. S3 클라이언트 인스턴스 생성
const s3 = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

// 2. 업로드 미들웨어 설정
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.aws.bucketName,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            // 파일명 중복 방지를 위한 키 생성 로직 (products/타임스탬프-이름.확장자)
            const extension = path.extname(file.originalname);
            const basename = path.basename(file.originalname, extension);
            cb(null, `products/${Date.now()}-${basename}${extension}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

export default upload;