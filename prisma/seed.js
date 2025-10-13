const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성을 시작합니다...');

  // 기존 데이터 삭제 (개발용)
  await prisma.bookmark.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 샘플 사용자 생성
  const users = await Promise.all([
    prisma.user.create({
      data: {
        googleId: 'google_1',
        email: 'john.doe@example.com',
        name: '김개발',
        profileImg: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    }),
    prisma.user.create({
      data: {
        googleId: 'google_2', 
        email: 'jane.smith@example.com',
        name: '이디자인',
        profileImg: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      }
    }),
    prisma.user.create({
      data: {
        googleId: 'google_3',
        email: 'mike.wilson@example.com', 
        name: '박풀스택',
        profileImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      }
    }),
    prisma.user.create({
      data: {
        googleId: 'google_4',
        email: 'sarah.lee@example.com',
        name: '최모바일',
        profileImg: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      }
    }),
    prisma.user.create({
      data: {
        googleId: 'google_5',
        email: 'david.kim@example.com',
        name: '정백엔드',
        profileImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      }
    })
  ]);

  console.log(`✅ ${users.length}명의 사용자가 생성되었습니다.`);

  // 샘플 게시글 데이터
  const samplePosts = [
    {
      title: 'React 18의 새로운 기능들과 성능 최적화 방법',
      content: 'React 18에서 도입된 Concurrent Features, Automatic Batching, Suspense 등의 새로운 기능들을 살펴보고, 실제 프로젝트에서 성능을 최적화하는 방법에 대해 알아보겠습니다. 특히 useTransition과 useDeferredValue 훅을 활용한 사용자 경험 개선 방법을 중점적으로 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
      field: JSON.stringify(['frontend', 'web']),
      skills: JSON.stringify(['React', 'JavaScript', 'TypeScript']),
      viewCount: 245,
      authorId: users[0].id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2일 전
    },
    {
      title: 'Node.js와 Express로 RESTful API 구축하기',
      content: 'Node.js와 Express 프레임워크를 사용하여 확장 가능한 RESTful API를 구축하는 방법을 단계별로 설명합니다. 미들웨어 설정, 에러 핸들링, 데이터베이스 연동, 인증 시스템 구현까지 실무에서 필요한 모든 내용을 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
      field: JSON.stringify(['backend', 'api']),
      skills: JSON.stringify(['Node.js', 'Express', 'MongoDB', 'JWT']),
      viewCount: 189,
      authorId: users[4].id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5일 전
    },
    {
      title: 'UI/UX 디자인 트렌드 2025: 사용자 중심의 인터페이스',
      content: '2025년 UI/UX 디자인 트렌드를 분석하고, 사용자 경험을 향상시키는 디자인 원칙들을 소개합니다. 접근성, 마이크로 인터랙션, 다크 모드, 글래스모피즘 등 최신 디자인 패턴과 실제 적용 사례를 함께 살펴봅니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
      field: JSON.stringify(['design', 'ux']),
      skills: JSON.stringify(['Figma', 'Adobe XD', 'Sketch', 'Prototyping']),
      viewCount: 156,
      authorId: users[1].id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1일 전
    },
    {
      title: 'Flutter로 크로스 플랫폼 모바일 앱 개발하기',
      content: 'Flutter 프레임워크를 사용하여 iOS와 Android 앱을 동시에 개발하는 방법을 알아봅니다. 위젯 시스템, 상태 관리, 네이티브 기능 연동, 앱 배포까지 모바일 앱 개발의 전 과정을 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
      field: JSON.stringify(['mobile', 'app']),
      skills: JSON.stringify(['Flutter', 'Dart', 'Firebase', 'iOS', 'Android']),
      viewCount: 298,
      authorId: users[3].id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3일 전
    },
    {
      title: 'Docker와 Kubernetes로 마이크로서비스 아키텍처 구현',
      content: 'Docker 컨테이너화와 Kubernetes 오케스트레이션을 활용한 마이크로서비스 아키텍처 구현 방법을 설명합니다. 서비스 디스커버리, 로드 밸런싱, 모니터링, CI/CD 파이프라인 구축까지 실무 적용 사례와 함께 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=250&fit=crop',
      field: JSON.stringify(['devops', 'infrastructure']),
      skills: JSON.stringify(['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Monitoring']),
      viewCount: 134,
      authorId: users[2].id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7일 전
    },
    {
      title: 'Python 데이터 분석과 머신러닝 입문',
      content: 'Python을 사용한 데이터 분석의 기초부터 머신러닝 모델 구축까지 단계별로 학습합니다. Pandas, NumPy, Matplotlib를 활용한 데이터 처리와 Scikit-learn을 이용한 예측 모델 개발 방법을 실습과 함께 진행합니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      field: JSON.stringify(['data', 'ai']),
      skills: JSON.stringify(['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Jupyter']),
      viewCount: 87,
      authorId: users[0].id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4일 전
    },
    {
      title: 'Vue.js 3 Composition API 완벽 가이드',
      content: 'Vue.js 3의 Composition API를 활용한 현대적인 Vue 애플리케이션 개발 방법을 알아봅니다. setup 함수, 반응형 시스템, 커스텀 훅 작성, TypeScript 통합까지 실무에서 바로 적용할 수 있는 패턴들을 소개합니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
      field: JSON.stringify(['frontend', 'web']),
      skills: JSON.stringify(['Vue.js', 'JavaScript', 'TypeScript', 'Vite']),
      viewCount: 203,
      authorId: users[2].id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6일 전
    },
    {
      title: 'GraphQL과 Apollo Client로 효율적인 데이터 관리',
      content: 'GraphQL의 장점과 Apollo Client를 활용한 프론트엔드 데이터 관리 방법을 설명합니다. 쿼리 최적화, 캐싱 전략, 실시간 구독, 에러 핸들링까지 GraphQL 생태계의 모든 것을 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
      field: JSON.stringify(['frontend', 'backend']),
      skills: JSON.stringify(['GraphQL', 'Apollo', 'React', 'Node.js']),
      viewCount: 167,
      authorId: users[1].id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8일 전
    },
    {
      title: 'AWS 클라우드 서비스 활용한 서버리스 아키텍처',
      content: 'AWS Lambda, API Gateway, DynamoDB를 활용한 서버리스 아키텍처 구축 방법을 알아봅니다. 비용 효율적이고 확장 가능한 클라우드 네이티브 애플리케이션 개발의 모든 과정을 실습과 함께 진행합니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
      field: JSON.stringify(['cloud', 'backend']),
      skills: JSON.stringify(['AWS', 'Lambda', 'DynamoDB', 'API Gateway', 'CloudFormation']),
      viewCount: 312,
      authorId: users[4].id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10일 전
    },
    {
      title: 'TypeScript 고급 타입 시스템과 제네릭 활용법',
      content: 'TypeScript의 고급 타입 시스템을 마스터하여 더 안전하고 유지보수하기 쉬운 코드를 작성하는 방법을 배웁니다. 유니온 타입, 인터섹션 타입, 조건부 타입, 템플릿 리터럴 타입 등을 실제 예제와 함께 설명합니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop',
      field: JSON.stringify(['frontend', 'backend']),
      skills: JSON.stringify(['TypeScript', 'JavaScript', 'React', 'Node.js']),
      viewCount: 178,
      authorId: users[3].id,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12일 전
    },
    {
      title: 'Next.js 14 App Router와 Server Components 완벽 가이드',
      content: 'Next.js 14의 새로운 App Router와 Server Components를 활용한 풀스택 웹 애플리케이션 개발 방법을 알아봅니다. SSR, SSG, ISR의 차이점과 각각의 활용 사례, 성능 최적화 기법까지 상세히 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
      field: JSON.stringify(['frontend', 'fullstack']),
      skills: JSON.stringify(['Next.js', 'React', 'TypeScript', 'Vercel']),
      viewCount: 421,
      authorId: users[0].id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15일 전
    },
    {
      title: '모던 CSS: Grid, Flexbox, Container Queries 마스터하기',
      content: '최신 CSS 기능들을 활용하여 반응형 레이아웃을 구성하는 방법을 배웁니다. CSS Grid와 Flexbox의 차이점, Container Queries를 활용한 컴포넌트 기반 반응형 디자인, CSS 커스텀 프로퍼티 활용법까지 다룹니다.',
      thumbnailImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
      field: JSON.stringify(['frontend', 'design']),
      skills: JSON.stringify(['CSS', 'HTML', 'Sass', 'PostCSS']),
      viewCount: 145,
      authorId: users[1].id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20일 전
    }
  ];

  // 게시글 생성
  const posts = [];
  for (const postData of samplePosts) {
    const post = await prisma.post.create({
      data: postData
    });
    posts.push(post);
  }

  console.log(`✅ ${posts.length}개의 게시글이 생성되었습니다.`);

  // 샘플 북마크 생성 (일부 사용자가 일부 게시글을 북마크)
  const bookmarks = await Promise.all([
    prisma.bomark.create({
      data: {
        userId: users[0].id,
        postId: posts[1].id
      }
    }),
    prisma.bookmark.create({
      data: {
        userId: users[0].id,
        postId: posts[3].id
      }
    }),
    prisma.bookmark.create({
      data: {
        userId: users[1].id,
        postId: posts[0].id
      }
    }),
    prisma.bookmark.create({
      data: {
        userId: users[2].id,
        postId: posts[4].id
      }
    }),
    prisma.bookmark.create({
      data: {
        userId: users[3].id,
        postId: posts[2].id
      }
    })
  ]);

  console.log(`✅ ${bookmarks.length}개의 북마크가 생성되었습니다.`);
  console.log('🎉 시드 데이터 생성이 완료되었습니다!');
  
  // 생성된 데이터 요약 출력
  console.log('\n📊 생성된 데이터 요약:');
  console.log(`👥 사용자: ${users.length}명`);
  console.log(`📝 게시글: ${posts.length}개`);
  console.log(`🔖 북마크: ${bookmarks.length}개`);
  console.log(`📈 총 조회수: ${posts.reduce((sum, post) => sum + post.viewCount, 0)}회`);
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

