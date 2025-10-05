const express = require('express');
const { prisma } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/posts - 전체 글 목록
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, profileImg: true },
        },
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});


// ✅ 구체적인 경로들을 먼저 정의
// GET /api/v1/member-posts/popular - 인기 게시물
router.get('/popular', async (req, res) => {
  try {
    const { condition = 'WEEK' } = req.query; // 'WEEK' | 'MONTH'
    const { pageNumber = 1, pageSize = 10 } = req.query;
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const take = Number(pageSize);

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

    const elements = posts.map((post) => {
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
        isCompany: false,
      };
    });

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
});

// GET /api/v1/member-posts/search - 게시물 검색
router.get('/search', async (req, res) => {
  try {
    const { fields, skills, keyword, pageNumber = 1, pageSize = 10 } = req.query;
    
    // 페이지네이션 계산
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // 필터 조건 구성
    const where = { published: true };
    
    // 키워드 검색 (제목 또는 내용)
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    // 필드 필터링
    if (fields) {
      const fieldArray = Array.isArray(fields) ? fields : [fields];
      where.field = {
        in: fieldArray.map(field => JSON.stringify([field]))
      };
    }

    // 스킬 필터링
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      where.skills = {
        in: skillArray.map(skill => JSON.stringify([skill]))
      };
    }

    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: { select: { name: true, profileImg: true } },
        },
      }),
    ]);

    const elements = posts.map((post) => {
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
        isNew: false,
        isHot: post.viewCount > 100,
        isCompany: false,
      };
    });

    const totalPage = Math.ceil(totalCount / pageSize) || 1;

    return res.json({
      elements,
      pageNumber,
      pageSize,
      totalCount,
      totalPage,
    });
  } catch (error) {
    console.error('[search] fetch error:', error);
    return res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// GET /api/v1/member-posts/:id/edit - 수정용 게시글 조회
router.get('/:id/edit', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, profileImg: true },
        }
      }
    });
    
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' }); // Temporarily commented out

    // 수정용 응답 형식 - 프론트엔드에서 사용하기 쉬운 형태로 제공
    const response = {
      id: post.id,
      title: post.title || '',
      content: post.content || '',
      field: post.field ? JSON.parse(post.field)[0] || '' : '',
      skills: post.skills ? JSON.parse(post.skills) : [],
      thumbnailImageUrl: post.thumbnailImageUrl || '',
      sourceUrl: post.sourceUrl || '',
      published: post.published
    };
    
    res.json(response);
  } catch (error) {
    console.error('Fetch edit post error:', error);
    res.status(500).json({ message: 'Failed to fetch post for editing' });
  }
});

// POST /api/posts - 글 작성 (로그인 필요)
router.post('/legacy', requireAuth, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      thumbnailImageUrl,
      field = [],
      skills = [],
      published = true 
    } = req.body || {};
    
    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }

    const created = await prisma.post.create({
      data: {
        title,
        content,
        thumbnailImageUrl,
        field: JSON.stringify(Array.isArray(field) ? field : []),
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        published: Boolean(published),
        authorId: req.user.id,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// POST /api/v1/member-posts - 새 게시글 생성 (프론트엔드용)
router.post('/', async (req, res) => {
  console.log('POST /api/v1/member-posts 요청 받음');
  try {
    const { 
      title = '', 
      content = '',
      field = '',
      skills = [],
      thumbnailImageUrl = null
    } = req.body || {};
    
    // 사용자 존재 여부 확인 (최신 사용자 ID 사용)
    const latestUser = await prisma.user.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true, name: true }
    });
    
    if (!latestUser) {
      return res.status(400).json({ 
        message: 'No users found. Please login first.',
        error: 'No users in database'
      });
    }
    
    console.log('Creating post for user:', latestUser.name, 'ID:', latestUser.id);
    
    // 임시 게시글 생성 (제목이나 내용이 없어도 생성)
    const created = await prisma.post.create({
      data: {
        title: title || '임시 제목',
        content: content || '임시 내용',
        thumbnailImageUrl,
        field: JSON.stringify(field ? [field] : []),
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        published: true, // 테스트용으로 발행
        authorId: latestUser.id, // 최신 사용자 ID 사용
      },
    });
    
    res.status(201).json({ postId: created.id });
  } catch (error) {
    console.error('Create member post error:', error);
    
    // Foreign Key Constraint 에러 처리
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        message: 'User not found. Please check if the user exists in the database.',
        error: 'Foreign key constraint violated'
      });
    }
    
    // 기타 Prisma 에러 처리
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({ 
        message: 'Database error: ' + error.message,
        error: error.code
      });
    }
    
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// POST /api/v1/member-posts/:id - 게시물 내용 업데이트 (프론트엔드용)
router.post('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    // if (existing.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' }); // Temporarily commented out

    const { title, content, thumbnailImageUrl, field, skills } = req.body || {};
    
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title != null ? { title } : {}),
        ...(content != null ? { content } : {}),
        ...(thumbnailImageUrl != null ? { thumbnailImageUrl } : {}),
        ...(field != null ? { field: JSON.stringify(Array.isArray(field) ? field : [field]) } : {}),
        ...(skills != null ? { skills: JSON.stringify(Array.isArray(skills) ? skills : []) } : {}),
        published: true, // 수정 시 발행 상태로 변경
      },
    });
    
    res.json({ postId: updated.id });
  } catch (error) {
    console.error('Update member post error:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// PATCH /api/v1/member-posts/:id - 게시물 수정 (프론트엔드용)
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    // if (existing.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' }); // Temporarily commented out

    const { title, content, thumbnailImageUrl, field, skills } = req.body || {};
    
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title != null ? { title } : {}),
        ...(content != null ? { content } : {}),
        ...(thumbnailImageUrl != null ? { thumbnailImageUrl } : {}),
        ...(field != null ? { field: JSON.stringify(Array.isArray(field) ? field : [field]) } : {}),
        ...(skills != null ? { skills: JSON.stringify(Array.isArray(skills) ? skills : []) } : {}),
        published: true, // 수정 시 발행 상태로 변경
      },
    });
    
    res.json({ postId: updated.id });
  } catch (error) {
    console.error('Update member post error:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});


// PATCH /api/v1/member-posts/:id - 게시글 수정 (프론트엔드용)
router.patch('/v1/member-posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    // if (existing.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const { title, content, thumbnailImageUrl, field, skills } = req.body || {};
    
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title != null ? { title } : {}),
        ...(content != null ? { content } : {}),
        ...(thumbnailImageUrl != null ? { thumbnailImageUrl } : {}),
        ...(field != null ? { field: JSON.stringify(Array.isArray(field) ? field : [field]) } : {}),
        ...(skills != null ? { skills: JSON.stringify(Array.isArray(skills) ? skills : []) } : {}),
        published: true, // 수정 시 발행 상태로 변경
      },
    });
    
    res.json({ postId: updated.id });
  } catch (error) {
    console.error('Update member post error:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// POST /api/v1/member-posts/:id/images - 이미지 업로드용 presigned URL 생성
router.post('/v1/member-posts/:id/images', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const { fileName } = req.body || {};
    if (!fileName) return res.status(400).json({ message: 'fileName is required' });

    // 게시글 소유권 확인
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    // 간단한 파일 URL 생성 (실제 환경에서는 AWS S3 presigned URL 사용)
    const fileUrl = `https://example.com/uploads/${id}/${fileName}`;
    const presignedUrl = `https://example.com/upload/${id}/${fileName}`;

    res.json({
      presignedUrl,
      fileUrl
    });
  } catch (error) {
    console.error('Generate presigned URL error:', error);
    res.status(500).json({ message: 'Failed to generate presigned URL' });
  }
});

// DELETE /api/posts/:id - 글 삭제 (본인 글만)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    // if (existing.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' }); // Temporarily commented out

    await prisma.post.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// PUT /api/v1/member-posts/:id - 게시물 내용 업데이트 (프론트엔드용)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    // if (existing.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' }); // Temporarily commented out

    const { title, content, thumbnailImageUrl, field, skills } = req.body || {};
    
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title != null ? { title } : {}),
        ...(content != null ? { content } : {}),
        ...(thumbnailImageUrl != null ? { thumbnailImageUrl } : {}),
        ...(field != null ? { field: JSON.stringify(Array.isArray(field) ? field : [field]) } : {}),
        ...(skills != null ? { skills: JSON.stringify(Array.isArray(skills) ? skills : []) } : {}),
        published: true, // 수정 시 발행 상태로 변경
      },
    });
    
    res.json({ postId: updated.id });
  } catch (error) {
    console.error('Update member post error:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// ✅ 파라미터 경로는 마지막에
// GET /api/v1/member-posts/:id - 프론트엔드용 게시물 조회 (조회수 증가)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    // 조회수 증가와 글 조회를 동시에 실행
    const [post] = await Promise.all([
      prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, profileImg: true },
          },
          bookmarks: {
            select: { userId: true }
          }
        },
      }),
      prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {}) // 조회수 업데이트 실패해도 글 조회는 계속 진행
    ]);
    
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // 이전/다음 글 ID 찾기
    const [previousPost, nextPost] = await Promise.all([
      prisma.post.findFirst({
        where: {
          id: { lt: id },
          published: true
        },
        orderBy: { id: 'desc' },
        select: { id: true }
      }),
      prisma.post.findFirst({
        where: {
          id: { gt: id },
          published: true
        },
        orderBy: { id: 'asc' },
        select: { id: true }
      })
    ]);

    // 로그인한 사용자의 북마크 상태 확인
    let isBookmarked = false;
    if (req.user && req.user.id) {
      isBookmarked = post.bookmarks.some(bookmark => bookmark.userId === req.user.id);
    }

    // 프론트엔드가 기대하는 형식으로 응답 구성
    const response = {
      id: post.id,
      title: post.title,
      content: post.content,
      thumbnailImageUrl: post.thumbnailImageUrl,
      sourceUrl: post.sourceUrl,
      author: {
        name: post.author.name,
        imageUrl: post.author.profileImg
      },
      viewCount: (post.viewCount || 0) + 1,
      createdAt: post.createdAt.toISOString(),
      bookmarkCount: post.bookmarks.length,
      isBookmarked: isBookmarked,
      nextId: nextPost?.id || null,
      previousId: previousPost?.id || null,
      skills: post.skills ? JSON.parse(post.skills) : [],
      field: post.field ? JSON.parse(post.field) : []
    };
    
    res.json(response);
  } catch (error) {
    console.error('Fetch member post error:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

module.exports = router;

