# 1. Base Image: 가볍고 안정적인 Node.js 20 (Alpine Linux 버전) 사용
FROM node:20-alpine

# 2. 컨테이너 내부 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 의존성 설치를 위해 패키지 파일들 먼저 복사
# (소스 코드보다 먼저 복사해야 캐싱 효율이 좋아집니다)
COPY package*.json ./

# 4. 의존성 설치 (배포용이므로 devDependencies 제외 가능하지만, 일단 전체 설치)
RUN npm install

# 5. 소스 코드 전체를 컨테이너로 복사
COPY . .

# 6. 포트 노출 (Express 서버 포트)
EXPOSE 3000

# 7. 서버 실행 명령어
CMD ["npm", "start"]