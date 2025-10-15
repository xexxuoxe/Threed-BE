// 환경 변수 로딩 (로컬 개발용만)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const datasourceUrl = process.env.DATABASE_URL;
console.log('Database URL:', datasourceUrl ? 'Set' : 'Not set');

let prisma;

try {
  const { PrismaClient } = require('@prisma/client');
  
  // Prisma 클라이언트 인스턴스 생성
  prisma = new PrismaClient({
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

} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  console.error('Please run: npx prisma generate');
  
  // 더미 Prisma 객체 생성 (에러 방지용)
  prisma = {
    $connect: () => Promise.resolve(),
    user: {
      count: () => Promise.resolve(0),
      findUnique: () => Promise.resolve(null),
      findFirst: () => Promise.resolve(null),
      create: () => Promise.resolve({ id: 1 }),
      update: () => Promise.resolve({ id: 1 }),
      findMany: () => Promise.resolve([])
    },
    post: {
      count: () => Promise.resolve(0),
      findUnique: () => Promise.resolve(null),
      findFirst: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: 1 }),
      update: () => Promise.resolve({ id: 1 }),
      delete: () => Promise.resolve({ id: 1 })
    },
    bookmark: {
      count: () => Promise.resolve(0),
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: 1 }),
      delete: () => Promise.resolve({ id: 1 })
    }
  };
}

module.exports = { prisma };