// src/common/aws/aws-s3.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  // 💡 ConfigService를 주입받아 환경변수를 안전하게 가져옵니다.
  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'AWS_BUCKET_NAME',
    ) as string;

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') as string,
      credentials: {
        accessKeyId: this.configService.get<string>(
          'AWS_ACCESS_KEY_ID',
        ) as string,
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ) as string,
      },
    });
  }

  async uploadFileToS3(
    folder: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      const ext = extname(file.originalname);
      const uniqueFilename = `${folder}/${Date.now()}-${uuidv4()}${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFilename,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const region = this.configService.get<string>('AWS_REGION') as string;
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new InternalServerErrorException(
        '이미지 업로드 중 문제가 발생했습니다.',
      );
    }
  }
  // 💡 2. Presigned URL 발급 메서드 추가
  async getPresignedUrl(
    folder: string,
    originalFilename: string,
    contentType: string,
  ) {
    try {
      const ext = extname(originalFilename);
      const uniqueFilename = `${folder}/${Date.now()}-${uuidv4()}${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFilename,
        ContentType: contentType, // 허용할 정확한 MIME 타입 지정 (보안)
      });

      // 60초 동안만 유효한 업로드 티켓(URL) 발급
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60,
      });

      const region = this.configService.get<string>('AWS_REGION') as string;
      const publicUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;

      return {
        presignedUrl, // 프론트엔드가 파일을 PUT 요청으로 보낼 주소
        publicUrl, // 업로드 성공 후 프론트엔드가 다시 백엔드로 보내줄 최종 공개 주소
      };
    } catch (error) {
      console.error('Presigned URL 발급 에러:', error);
      throw new InternalServerErrorException(
        '업로드 URL을 발급하는 중 문제가 발생했습니다.',
      );
    }
  }
}
