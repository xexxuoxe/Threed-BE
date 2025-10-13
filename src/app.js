// 최소한의 Express 앱으로 테스트
const express = require('express');
const app = express();
const port = 7000;

// 기본 미들웨어만 사용
app.use(express.json());

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

// 간단한 테스트 엔드포인트
app.get('/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Minimal Express app working',
    timestamp: new Date().toISOString()
  });
});

// 라우트 설정 - 임시로 주석 처리
// app.use('/api/v1/member-posts', postsRouter); // 게시물 API (search, CRUD 포함)
// app.use('/api/v1/members', membersRouter); // 사용자 API
// app.use('/api/v1/bookmarks', bookmarkRouter); // 북마크 API
// app.use('/api/v1/auth', authRouter); // 인증 API
// app.use('/api/posts', postsRouter); // 기존 posts API
// app.use('/api/v1', popularRouter); // 나머지 v1 라우트 (popular 등)

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


