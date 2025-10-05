const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
      const decoded = jwt.verify(token, jwtSecret);
      
      // 액세스 토큰인지 확인
      if (decoded.type !== 'access') {
        return res.status(401).json({ message: 'Invalid token type' });
      }
      
      // 데이터베이스에서 사용자 확인
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
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();

    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 사용자 정보 설정, 없어도 통과)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          profileImg: true
        }
      });

      req.user = user || null;
      next();

    } catch (jwtError) {
      req.user = null;
      next();
    }

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = { requireAuth, optionalAuth };