const { PrismaClient } = require('@prisma/client');

// 환경 변수 로딩
require('dotenv').config();

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('Database URL:', datasourceUrl ? 'Set' : 'Not set');

const prisma = new PrismaClient({
  datasources: {
    db: { url: datasourceUrl },
  },
  log: ['query', 'info', 'warn', 'error'],
});

module.exports = { prisma };