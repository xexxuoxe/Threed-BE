# Threed-EX API

3D 관련 프로젝트를 위한 백엔드 API 서버입니다.

## 🚀 배포 상태

현재 Vercel에 배포되어 있으며, 서버리스 함수로 작동합니다.

## 📋 주요 기능

- **인증**: Google OAuth2 로그인
- **게시물 관리**: CRUD 작업, 검색, 인기 게시물
- **북마크**: 게시물 북마크 기능
- **사용자 관리**: 프로필 관리

## 🔧 API 엔드포인트

### 인증
- `GET /api/v1/auth/google/callback` - Google OAuth 콜백
- `GET /api/v1/auth/me` - 현재 사용자 정보
- `GET /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/logout` - 로그아웃

### 게시물
- `GET /api/posts` - 전체 게시물 목록
- `GET /api/posts/popular` - 인기 게시물
- `GET /api/posts/search` - 게시물 검색
- `GET /api/posts/:id` - 개별 게시물 조회
- `POST /api/posts/create` - 게시물 생성
- `PATCH /api/posts/:id` - 게시물 수정
- `DELETE /api/posts/:id` - 게시물 삭제

### 사용자
- `GET /api/v1/members/profile` - 사용자 프로필
- `PUT /api/v1/members/profile` - 프로필 수정
- `GET /api/v1/members/posts` - 사용자 게시물 목록

### 북마크
- `GET /api/v1/bookmarks` - 북마크 목록
- `POST /api/v1/bookmarks` - 북마크 추가
- `DELETE /api/v1/bookmarks/:postId` - 북마크 삭제

## 🛠️ 기술 스택

- **Node.js** + **Express**
- **Prisma** (ORM)
- **PostgreSQL** (데이터베이스)
- **JWT** (인증)
- **Google OAuth2** (소셜 로그인)
- **Vercel** (배포)

## 📦 환경 변수

다음 환경 변수들을 Vercel 대시보드에서 설정해야 합니다:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FRONTEND_URL="https://your-frontend-domain.com"
NODE_ENV="production"
```

## 🚀 배포 방법

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **프로젝트 배포**
   ```bash
   vercel --prod
   ```

3. **환경 변수 설정**
   - Vercel 대시보드에서 프로젝트 설정
   - Environment Variables 섹션에서 위의 환경 변수들 추가

4. **데이터베이스 마이그레이션**
   ```bash
   npx prisma migrate deploy
   ```

## 🔍 헬스 체크

배포 후 다음 엔드포인트로 서버 상태를 확인할 수 있습니다:

- `GET /` - 기본 상태 확인
- `GET /health` - 데이터베이스 연결 상태 포함

## 📝 개발 환경 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
cp .env.example .env

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

## 🐛 문제 해결

### 500 에러가 발생하는 경우

1. **환경 변수 확인**: Vercel 대시보드에서 모든 필수 환경 변수가 설정되었는지 확인
2. **데이터베이스 연결**: `DATABASE_URL`이 올바른지 확인
3. **Prisma 클라이언트**: `npx prisma generate` 실행 필요
4. **로그 확인**: Vercel 대시보드의 Functions 탭에서 로그 확인

### 인증 관련 문제

- Google OAuth 설정이 올바른지 확인
- `FRONTEND_URL`이 정확한지 확인
- JWT 시크릿이 설정되었는지 확인

## 📞 지원

문제가 발생하면 Vercel 대시보드의 로그를 확인하거나 이슈를 등록해주세요.
