require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const postsRouter = require('./routes/posts');
const popularRouter = require('./routes/popular');
const authRouter = require('./routes/auth');
const bookmarkRouter = require('./routes/bookmark');
const membersRouter = require('./routes/members');

const app = express();
const port = 7000;

// CORS 설정 - credentials 지원을 위해 구체적인 origin 설정
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://threedblog.netlify.app'
  ], // 프론트엔드 주소
  credentials: true, // 쿠키, 인증 헤더 등을 포함한 요청 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(cookieParser()); // 쿠키 파서 추가
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('OK!!! Hello World!!!');
});

// 간단한 테스트 엔드포인트
app.get('/test-simple', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Server is working',
    timestamp: new Date().toISOString()
  });
});

// 데이터베이스 연결 테스트
app.get('/test-db', async (req, res) => {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    const { prisma } = require('./config/database');
    
    // 간단한 연결 테스트
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // 테이블 존재 확인
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    res.json({ 
      status: 'success', 
      message: 'Database connected successfully',
      userCount: userCount,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  }
});

// 라우트 설정
app.use('/api/v1/member-posts', postsRouter); // 게시물 API (search, CRUD 포함)
app.use('/api/v1/members', membersRouter); // 사용자 API
app.use('/api/v1/bookmarks', bookmarkRouter); // 북마크 API
app.use('/api/v1/auth', authRouter); // 인증 API
app.use('/api/posts', postsRouter); // 기존 posts API
app.use('/api/v1', popularRouter); // 나머지 v1 라우트 (popular 등)

// 404 fallback
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});


