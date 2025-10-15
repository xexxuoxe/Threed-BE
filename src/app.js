// Express 앱을 Vercel 서버리스 함수로 변환
const express = require('express');

// dotenv 로드 (로컬 개발용만)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// CORS 미들웨어
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// 기본 미들웨어
app.use(express.json());

// 라우트 import
const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts');
const membersRouter = require('./routes/members');
const bookmarkRouter = require('./routes/bookmark');
const popularRouter = require('./routes/popular');

// 기본 엔드포인트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Threed-EX API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 헬스 체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    const { prisma } = require('./config/database');
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    res.json({ 
      status: 'healthy',
      message: 'Server and database are working',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount: userCount
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Server or database connection failed',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
  }
});

// API 라우트 설정
app.use('/api/v1/auth', authRouter); // 인증 API
app.use('/api/v1/member-posts', postsRouter); // 게시물 API (search, CRUD 포함)
app.use('/api/v1/members', membersRouter); // 사용자 API
app.use('/api/v1/bookmarks', bookmarkRouter); // 북마크 API
app.use('/api/posts', postsRouter); // 기존 posts API
app.use('/api/v1', popularRouter); // 나머지 v1 라우트 (popular 등)

// favicon 에러 처리
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end();
});

// 404 fallback
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// 로컬 개발용 포트 설정
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 7000;
  app.listen(port, () => {
    console.log(`App running on port ${port}...`);
  });
}

// Vercel 서버리스 함수로 export
module.exports = app;


