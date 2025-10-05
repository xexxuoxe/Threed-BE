const express = require('express');
const { prisma } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/members/posts - 사용자가 작성한 게시글 목록
router.get('/posts', requireAuth, async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(size);
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    // 사용자가 작성한 게시글 조회
    const [totalCount, posts] = await Promise.all([
      prisma.post.count({
        where: { 
          authorId: req.user.id,
          published: true
        }
      }),
      prisma.post.findMany({
        where: { 
          authorId: req.user.id,
          published: true
        },
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
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to get user posts' });
  }
});

// GET /api/v1/members/profile - 사용자 프로필 정보
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        profileImg: true,
        createdAt: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            bookmarks: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profileImg,
      joinedAt: user.createdAt,
      stats: {
        totalPosts: user._count.posts,
        totalBookmarks: user._count.bookmarks
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// PUT /api/v1/members/profile - 사용자 프로필 수정
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, profileImageUrl } = req.body;

    const updateData = {};
    if (name != null) updateData.name = name;
    if (profileImageUrl != null) updateData.profileImg = profileImageUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        profileImg: true
      }
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      profileImageUrl: updatedUser.profileImg
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
});

module.exports = router;



