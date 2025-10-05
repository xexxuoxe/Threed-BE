const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Google OAuth2 클라이언트 설정
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.FRONTEND_URL + '/auth/callback'
);

// JWT 토큰 생성 함수
function generateAccessToken(user) {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      name: user.name,
      type: 'access'
    },
    jwtSecret,
    { expiresIn: '15m' } // 15분간 유효 (짧게 설정)
  );
}

// 리프레시 토큰 생성 함수
function generateRefreshToken(user) {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      type: 'refresh'
    },
    jwtSecret,
    { expiresIn: '7d' } // 7일간 유효
  );
}

// GET /api/v1/auth/google/callback - 구글 OAuth 콜백 처리
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ 
        message: 'Authorization code is required' 
      });
    }

    console.log('Received authorization code:', code);

    // 개발 환경에서 Mock 인증 (테스트용)
    if (code === 'test123' || !process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
      console.log('Using mock authentication for development');
      
      // Mock 사용자 데이터
      const mockUser = {
        googleId: `mock_${Date.now()}`,
        email: 'test@example.com',
        name: '테스트 사용자',
        profileImg: 'https://via.placeholder.com/150'
      };

      // 데이터베이스에서 사용자 찾기 또는 생성
      let user = await prisma.user.findUnique({
        where: { email: mockUser.email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: mockUser
        });
        console.log('Created mock user:', user.id);
      } else {
        console.log('Using existing mock user:', user.id);
      }

      // JWT 토큰 생성 (액세스 토큰 + 리프레시 토큰)
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // 리프레시 토큰을 데이터베이스에 저장
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken }
      });

      // 응답 데이터 구성
      const responseData = {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profileImg
        }
      };

      console.log('Mock login successful for user:', user.email);
      return res.json(responseData);
    }

    // 구글로부터 액세스 토큰 받기
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // 구글 사용자 정보 가져오기
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const profileImg = payload.picture;

    console.log('Google user info:', { googleId, email, name });

    // 데이터베이스에서 사용자 찾기 또는 생성
    let user = await prisma.user.findUnique({
      where: { googleId: googleId }
    });

    if (!user) {
      // 이메일로도 한번 더 확인 (기존 사용자가 있을 수 있음)
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      });

      if (existingUser) {
        // 기존 사용자에 googleId 업데이트
        user = await prisma.user.update({
          where: { email: email },
          data: { 
            googleId: googleId,
            name: name,
            profileImg: profileImg
          }
        });
      } else {
        // 새 사용자 생성
        user = await prisma.user.create({
          data: {
            googleId: googleId,
            email: email,
            name: name,
            profileImg: profileImg
          }
        });
      }
      
      console.log('Created new user:', user.id);
    } else {
      // 기존 사용자 정보 업데이트 (프로필 이미지나 이름이 변경될 수 있음)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name,
          profileImg: profileImg
        }
      });
      
      console.log('Updated existing user:', user.id);
    }

    // JWT 토큰 생성 (액세스 토큰 + 리프레시 토큰)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 리프레시 토큰을 데이터베이스에 저장
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken }
    });

    // 응답 데이터 구성 (프론트엔드 인터페이스에 맞춤)
    const responseData = {
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImageUrl: user.profileImg
      }
    };

    console.log('Login successful for user:', user.email);

    res.json(responseData);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    if (error.message.includes('invalid_grant')) {
      return res.status(400).json({ 
        message: 'Invalid or expired authorization code' 
      });
    }
    
    res.status(500).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/v1/auth/me - 현재 로그인한 사용자 정보 조회
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 데이터베이스에서 최신 사용자 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          profileImg: true
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profileImg
        }
      });

    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid token' });
    }

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

// GET /api/v1/auth/refresh - 리프레시 토큰으로 새 액세스 토큰 발급
router.get('/refresh', async (req, res) => {
  try {
    // 쿠키에서 리프레시 토큰 가져오기 (또는 Authorization 헤더에서)
    let refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
      // 리프레시 토큰 검증
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
      const decoded = jwt.verify(refreshToken, jwtSecret);

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      // 데이터베이스에서 사용자 및 리프레시 토큰 확인
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.id,
          refreshToken: refreshToken // 저장된 리프레시 토큰과 일치하는지 확인
        },
        select: {
          id: true,
          email: true,
          name: true,
          profileImg: true
        }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // 새로운 액세스 토큰 생성
      const newAccessToken = generateAccessToken(user);

      res.json({
        token: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profileImg
        }
      });

    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// POST /api/v1/auth/logout - 로그아웃 (리프레시 토큰 무효화)
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // 데이터베이스에서 리프레시 토큰 삭제
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
});

module.exports = router;
