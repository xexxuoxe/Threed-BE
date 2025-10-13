// 임시로 Prisma 클라이언트 비활성화
// const { PrismaClient } = require('@prisma/client');

// 환경 변수 로딩
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const datasourceUrl = process.env.DATABASE_URL;

console.log('Database URL:', datasourceUrl ? 'Set' : 'Not set');

// 임시로 더미 Prisma 객체 생성
const prisma = {
  $connect: () => Promise.resolve(),
  user: {
    count: () => Promise.resolve(0)
  }
};

module.exports = { prisma };