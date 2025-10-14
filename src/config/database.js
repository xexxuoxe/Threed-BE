const { PrismaClient } = require('@prisma/client');

// 환경 변수 로딩
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const datasourceUrl = process.env.DATABASE_URL;

console.log('Database URL:', datasourceUrl ? 'Set' : 'Not set');

// Prisma 클라이언트 인스턴스 생성
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// 연결 테스트
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

module.exports = { prisma };