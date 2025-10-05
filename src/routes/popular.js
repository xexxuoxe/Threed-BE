const express = require('express');
const { prisma } = require('../config/database');

const router = express.Router();

function toPostResponseElement(post, type, condition) {
  const now = new Date();
  const createdAt = new Date(post.createdAt);
  const isNew = condition === 'WEEK'
    ? (now - createdAt) <= 7 * 24 * 60 * 60 * 1000
    : (now - createdAt) <= 30 * 24 * 60 * 60 * 1000;

  // JSON 문자열을 배열로 파싱
  let fieldArray = [];
  let skillsArray = [];
  
  try {
    fieldArray = post.field ? JSON.parse(post.field) : [];
  } catch (e) {
    fieldArray = [];
  }
  
  try {
    skillsArray = post.skills ? JSON.parse(post.skills) : [];
  } catch (e) {
    skillsArray = [];
  }

  return {
    id: post.id,
    title: post.title,
    thumbnailImageUrl: post.thumbnailImageUrl,
    field: fieldArray,
    viewCount: post.viewCount || 0,
    author: {
      name: post.author?.name ?? 'Unknown',
      imageUrl: post.author?.profileImg ?? null,
    },
    skills: skillsArray,
    createdAt: post.createdAt,
    isNew,
    isHot: post.viewCount > 100, // 조회수 100 이상이면 인기글
    isCompany: type === 'company',
  };
}

async function getPopular(req, res) {
  try {
    const { type } = req.params; // 'company' | 'member'
    const { condition = 'WEEK' } = req.query; // 'WEEK' | 'MONTH'

    // 기본 페이지네이션 (프론트가 전달하지 않으므로 기본값 적용)
    const pageNumber = Number(req.query.pageNumber ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    // 기간별 필터링
    const dateFilter = new Date();
    if (condition === 'WEEK') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (condition === 'MONTH') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const where = {
      published: true,
      createdAt: {
        gte: dateFilter
      }
    };

    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: [
          { viewCount: 'desc' }, // 조회수 높은 순
          { createdAt: 'desc' }  // 최신순
        ],
        skip,
        take,
        include: {
          author: { select: { name: true, profileImg: true } },
        },
      }),
    ]);

    const elements = posts.map((p) => toPostResponseElement(p, type, condition));
    const totalPage = Math.ceil(totalCount / pageSize) || 1;

    return res.json({
      elements,
      pageNumber,
      pageSize,
      totalCount,
      totalPage,
    });
  } catch (error) {
    console.error('[popular] fetch error:', error);
    return res.status(500).json({ message: 'Failed to fetch popular posts' });
  }
}

// /api/v1/company-posts/popular
router.get('/company-posts/popular', (req, res) => {
  req.params.type = 'company';
  return getPopular(req, res);
});

// /api/v1/member-posts/popular
router.get('/member-posts/popular', (req, res) => {
  req.params.type = 'member';
  return getPopular(req, res);
});

// /api/v1/member-posts/search - 필터링된 전체 글 목록
router.get('/search', async (req, res) => {
  try {
    const { fields, skills, keyword, pageNumber = 1, pageSize = 10 } = req.query;
    
    // 페이지네이션 계산
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const take = Number(pageSize);
    
    // 필터 조건 구성
    const where = {
      published: true,
      AND: []
    };
    
    // fields 필터링 (JSON 문자열에서 검색)
    if (fields) {
      const fieldArray = Array.isArray(fields) ? fields : [fields];
      const fieldConditions = fieldArray.map(field => ({
        field: { contains: `"${field}"` }
      }));
      where.AND.push({
        OR: fieldConditions
      });
    }
    
    // skills 필터링 (JSON 문자열에서 검색)
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      const skillConditions = skillArray.map(skill => ({
        skills: { contains: `"${skill}"` }
      }));
      where.AND.push({
        OR: skillConditions
      });
    }
    
    // keyword 검색 (제목과 내용에서 검색)
    if (keyword) {
      where.AND.push({
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } }
        ]
      });
    }
    
    // AND 배열이 비어있으면 제거
    if (where.AND.length === 0) {
      delete where.AND;
    }
    
    // 총 개수와 게시글 조회
    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: {
            select: { name: true, profileImg: true }
          }
        }
      })
    ]);
    
    // 응답 데이터 변환
    const elements = posts.map(post => {
      const now = new Date();
      const createdAt = new Date(post.createdAt);
      const isNew = (now - createdAt) <= 7 * 24 * 60 * 60 * 1000; // 7일 이내
      
      // JSON 문자열을 배열로 파싱
      let fieldArray = [];
      let skillsArray = [];
      
      try {
        fieldArray = post.field ? JSON.parse(post.field) : [];
      } catch (e) {
        fieldArray = [];
      }
      
      try {
        skillsArray = post.skills ? JSON.parse(post.skills) : [];
      } catch (e) {
        skillsArray = [];
      }
      
      return {
        id: post.id,
        title: post.title,
        thumbnailImageUrl: post.thumbnailImageUrl,
        field: fieldArray,
        viewCount: post.viewCount,
        author: {
          name: post.author?.name ?? 'Unknown',
          imageUrl: post.author?.profileImg ?? null
        },
        skills: skillsArray,
        createdAt: post.createdAt,
        isNew,
        isHot: post.viewCount > 100, // 조회수 100 이상이면 인기글
        isCompany: false
      };
    });
    
    const totalPage = Math.ceil(totalCount / Number(pageSize)) || 1;
    
    res.json({
      elements,
      pageNumber: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
      totalPage
    });
    
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Failed to search posts' });
  }
});

module.exports = router;


