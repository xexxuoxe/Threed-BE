const { PrismaClient } = require('@prisma/client');

const datasourceUrl = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = new PrismaClient({
  datasources: {
    db: { url: datasourceUrl },
  },
});

module.exports = { prisma };