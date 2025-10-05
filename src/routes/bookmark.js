const express = require('express');
const { prisma } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/bookmarks - 사용자의 북마크 목록 조회
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(size);
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    // 사용자의 북마크된 게시글 조회
    const [totalCount, bookmarks] = await Promise.all([
      prisma.bookmark.count({
        where: { userId: req.user.id }
      }),
      prisma.bookmark.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          post: {
            include: {
              author: {
                select: { name: true, profileImg: true }
              }
            }
          }
        }
      })
    ]);

    // 응답 데이터 변환
    const elements = bookmarks.map(bookmark => {
      const post = bookmark.post;
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
        viewCount: post.viewCount || 0,
        author: {
          name: post.author?.name ?? 'Unknown',
          imageUrl: post.author?.profileImg ?? null
        },
        skills: skillsArray,
        createdAt: post.createdAt,
        isNew,
        isHot: post.viewCount > 100,
        isCompany: false
      };
    });

    const totalPage = Math.ceil(totalCount / pageSize) || 1;

    res.json({
      elements,
      pageNumber,
      pageSize,
      totalCount,
      totalPage
    });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Failed to get bookmarks' });
  }
});

// POST /api/v1/bookmarks - 북마크 추가
router.post('/', requireAuth, async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: 'postId is required' });
    }

    // 게시글 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 이미 북마크되어 있는지 확인
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: Number(postId)
        }
      }
    });

    if (existingBookmark) {
      return res.status(409).json({ message: 'Already bookmarked' });
    }

    // 북마크 생성
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: req.user.id,
        postId: Number(postId)
      }
    });

    res.status(201).json({ 
      message: 'Bookmark added successfully',
      bookmarkId: bookmark.id
    });

  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ message: 'Failed to add bookmark' });
  }
});

// DELETE /api/v1/bookmarks/:postId - 북마크 삭제
router.delete('/:postId', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: 'Invalid postId' });
    }

    // 북마크 존재 확인 및 삭제
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: postId
        }
      }
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    await prisma.bookmark.delete({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: postId
        }
      }
    });

    res.json({ message: 'Bookmark removed successfully' });

  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});

// GET /api/v1/bookmarks/check/:postId - 북마크 상태 확인
router.get('/check/:postId', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: 'Invalid postId' });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: postId
        }
      }
    });

    res.json({ isBookmarked: !!bookmark });

  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ message: 'Failed to check bookmark status' });
  }
});

module.exports = router;
