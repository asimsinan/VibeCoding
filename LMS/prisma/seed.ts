import { PrismaClient } from '../src/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.certificate.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create organizations
  console.log('🏢 Creating organizations...');
  const org1 = await prisma.organization.create({
    data: {
      name: 'Acme University',
      domain: 'acme.edu',
      settings: {
        theme: 'blue',
        logo: 'https://example.com/acme-logo.png',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af'
      }
    }
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'TechCorp Training',
      domain: 'techcorp.com',
      settings: {
        theme: 'dark',
        logo: 'https://example.com/techcorp-logo.png',
        primaryColor: '#059669',
        secondaryColor: '#047857'
      }
    }
  });

  const org3 = await prisma.organization.create({
    data: {
      name: 'Global Learning Institute',
      domain: 'gli.org',
      settings: {
        theme: 'light',
        logo: 'https://example.com/gli-logo.png',
        primaryColor: '#dc2626',
        secondaryColor: '#b91c1c'
      }
    }
  });

  // Create users for each organization
  console.log('👥 Creating users...');
  
  // Hash password for demo users
  const hashedPassword = await hash('password', 12);
  
  // Acme University users
  const acmeAdmin = await prisma.user.create({
    data: {
      email: 'admin@acme.edu',
      name: 'Dr. Sarah Johnson',
      role: 'ADMIN',
      organizationId: org1.id,
      password: hashedPassword
    }
  });

  const acmeInstructor1 = await prisma.user.create({
    data: {
      email: 'prof.smith@acme.edu',
      name: 'Prof. Michael Smith',
      role: 'INSTRUCTOR',
      organizationId: org1.id,
      password: hashedPassword
    }
  });

  const acmeInstructor2 = await prisma.user.create({
    data: {
      email: 'dr.brown@acme.edu',
      name: 'Dr. Emily Brown',
      role: 'INSTRUCTOR',
      organizationId: org1.id,
      password: hashedPassword
    }
  });

  const acmeStudents = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@acme.edu',
        name: 'John Doe',
        role: 'STUDENT',
        organizationId: org1.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@acme.edu',
        name: 'Jane Smith',
        role: 'STUDENT',
        organizationId: org1.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob.wilson@acme.edu',
        name: 'Bob Wilson',
        role: 'STUDENT',
        organizationId: org1.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'alice.johnson@acme.edu',
        name: 'Alice Johnson',
        role: 'STUDENT',
        organizationId: org1.id,
        password: hashedPassword
      }
    })
  ]);

  // TechCorp Training users
  const techcorpAdmin = await prisma.user.create({
    data: {
      email: 'admin@techcorp.com',
      name: 'Alex Chen',
      role: 'ADMIN',
      organizationId: org2.id,
      password: hashedPassword
    }
  });

  const techcorpInstructor = await prisma.user.create({
    data: {
      email: 'trainer@techcorp.com',
      name: 'Maria Rodriguez',
      role: 'INSTRUCTOR',
      organizationId: org2.id,
      password: hashedPassword
    }
  });

  const techcorpStudents = await Promise.all([
    prisma.user.create({
      data: {
        email: 'dev1@techcorp.com',
        name: 'Developer One',
        role: 'STUDENT',
        organizationId: org2.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'dev2@techcorp.com',
        name: 'Developer Two',
        role: 'STUDENT',
        organizationId: org2.id,
        password: hashedPassword
      }
    })
  ]);

  // Global Learning Institute users
  const gliAdmin = await prisma.user.create({
    data: {
      email: 'admin@gli.org',
      name: 'Dr. Robert Taylor',
      role: 'ADMIN',
      organizationId: org3.id,
      password: hashedPassword
    }
  });

  const gliInstructor = await prisma.user.create({
    data: {
      email: 'instructor@gli.org',
      name: 'Lisa Wang',
      role: 'INSTRUCTOR',
      organizationId: org3.id,
      password: hashedPassword
    }
  });

  const gliStudents = await Promise.all([
    prisma.user.create({
      data: {
        email: 'student1@gli.org',
        name: 'Student One',
        role: 'STUDENT',
        organizationId: org3.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'student2@gli.org',
        name: 'Student Two',
        role: 'STUDENT',
        organizationId: org3.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'student3@gli.org',
        name: 'Student Three',
        role: 'STUDENT',
        organizationId: org3.id,
        password: hashedPassword
      }
    })
  ]);

  // Create demo users for homepage
  console.log('🎭 Creating demo users...');
  
  const demoUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Demo Admin',
        role: 'ADMIN',
        organizationId: org1.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'instructor@example.com',
        name: 'Demo Instructor',
        role: 'INSTRUCTOR',
        organizationId: org1.id,
        password: hashedPassword
      }
    }),
    prisma.user.create({
      data: {
        email: 'student@example.com',
        name: 'Demo Student',
        role: 'STUDENT',
        organizationId: org1.id,
        password: hashedPassword
      }
    })
  ]);


  // Create courses for Acme University
  console.log('📚 Creating courses...');
  
  const webDevCourse = await prisma.course.create({
    data: {
      title: 'Web Development Fundamentals',
      description: 'Learn the basics of web development including HTML, CSS, and JavaScript',
      status: 'PUBLISHED',
      organizationId: org1.id
    }
  });

  const dataScienceCourse = await prisma.course.create({
    data: {
      title: 'Introduction to Data Science',
      description: 'Explore data analysis, machine learning, and statistical methods',
      status: 'PUBLISHED',
      organizationId: org1.id
    }
  });

  const mobileDevCourse = await prisma.course.create({
    data: {
      title: 'Mobile App Development',
      description: 'Build mobile applications using React Native and Flutter',
      status: 'DRAFT',
      organizationId: org1.id
    }
  });

  // Create courses for TechCorp Training
  const reactCourse = await prisma.course.create({
    data: {
      title: 'Advanced React Development',
      description: 'Master React hooks, context, and advanced patterns',
      status: 'PUBLISHED',
      organizationId: org2.id
    }
  });

  const nodejsCourse = await prisma.course.create({
    data: {
      title: 'Node.js Backend Development',
      description: 'Build scalable backend applications with Node.js and Express',
      status: 'PUBLISHED',
      organizationId: org2.id
    }
  });

  // Create courses for Global Learning Institute
  const leadershipCourse = await prisma.course.create({
    data: {
      title: 'Leadership and Management',
      description: 'Develop essential leadership skills for modern organizations',
      status: 'PUBLISHED',
      organizationId: org3.id
    }
  });

  const projectMgmtCourse = await prisma.course.create({
    data: {
      title: 'Project Management Fundamentals',
      description: 'Learn project management methodologies and best practices',
      status: 'PUBLISHED',
      organizationId: org3.id
    }
  });

  // Create additional demo courses for better dashboard data
  console.log('📚 Creating additional demo courses...');
  
  const additionalCourses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'Advanced JavaScript',
        description: 'Deep dive into modern JavaScript features, async programming, and design patterns',
        status: 'PUBLISHED',
        organizationId: org1.id
      }
    }),
    prisma.course.create({
      data: {
        title: 'React Development',
        description: 'Complete guide to building modern web applications with React',
        status: 'PUBLISHED',
        organizationId: org1.id
      }
    }),
    prisma.course.create({
      data: {
        title: 'Database Design',
        description: 'Learn database design principles and SQL optimization',
        status: 'PUBLISHED',
        organizationId: org1.id
      }
    }),
    prisma.course.create({
      data: {
        title: 'DevOps Fundamentals',
        description: 'Introduction to DevOps practices and tools',
        status: 'DRAFT',
        organizationId: org1.id
      }
    })
  ]);

  // Create enrollments for demo student
  console.log('📝 Creating demo enrollments...');
  
  const demoStudent = demoUsers[2]; // student@example.com
  
  const demoEnrollments = await Promise.all([
    prisma.enrollment.create({
      data: {
        userId: demoStudent.id,
        courseId: webDevCourse.id,
        organizationId: org1.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: demoStudent.id,
        courseId: additionalCourses[0].id,
        organizationId: org1.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: demoStudent.id,
        courseId: additionalCourses[1].id,
        organizationId: org1.id,
        status: 'COMPLETED'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: demoStudent.id,
        courseId: additionalCourses[2].id,
        organizationId: org1.id,
        status: 'ACTIVE'
      }
    })
  ]);

  // Create modules for Web Development course
  console.log('📖 Creating modules and lessons...');
  
  const webDevModules = await Promise.all([
    prisma.module.create({
      data: {
        title: 'HTML Basics',
        order: 1,
        courseId: webDevCourse.id
      }
    }),
    prisma.module.create({
      data: {
        title: 'CSS Styling',
        order: 2,
        courseId: webDevCourse.id
      }
    }),
    prisma.module.create({
      data: {
        title: 'JavaScript Fundamentals',
        order: 3,
        courseId: webDevCourse.id
      }
    })
  ]);

  // Create lessons for HTML module
  const htmlLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Introduction to HTML',
        content: 'Learn about HTML structure and basic tags',
        type: 'TEXT',
        order: 1,
        moduleId: webDevModules[0].id
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'HTML Forms and Input',
        content: 'Create interactive forms with various input types',
        type: 'TEXT',
        order: 2,
        moduleId: webDevModules[0].id
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'HTML Semantic Elements',
        content: 'Use semantic HTML elements for better structure',
        type: 'TEXT',
        order: 3,
        moduleId: webDevModules[0].id
      }
    })
  ]);

  // Create lessons for CSS module
  const cssLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'CSS Selectors and Properties',
        content: 'Learn CSS selectors and basic styling properties',
        type: 'TEXT',
        order: 1,
        moduleId: webDevModules[1].id
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'CSS Layout with Flexbox',
        content: 'Master CSS Flexbox for modern layouts',
        type: 'TEXT',
        order: 2,
        moduleId: webDevModules[1].id
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'CSS Grid Layout',
        content: 'Create complex layouts with CSS Grid',
        type: 'TEXT',
        order: 3,
        moduleId: webDevModules[1].id
      }
    })
  ]);

  // Create lessons for JavaScript module
  const jsLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'JavaScript Variables and Functions',
        content: 'Learn JavaScript basics including variables and functions',
        type: 'TEXT',
        order: 1,
        moduleId: webDevModules[2].id
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'DOM Manipulation',
        content: 'Interact with the Document Object Model',
        type: 'TEXT',
        order: 2,
        moduleId: webDevModules[2].id
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'JavaScript Events',
        content: 'Handle user interactions with JavaScript events',
        type: 'TEXT',
        order: 3,
        moduleId: webDevModules[2].id
      }
    })
  ]);

  // Create quizzes for some lessons
  console.log('❓ Creating quizzes...');
  
  const htmlQuiz = await prisma.quiz.create({
    data: {
      title: 'HTML Basics Quiz',
      timeLimit: 15,
      lessonId: htmlLessons[0].id
    }
  });

  const cssQuiz = await prisma.quiz.create({
    data: {
      title: 'CSS Fundamentals Quiz',
      timeLimit: 20,
      lessonId: cssLessons[0].id
    }
  });

  const jsQuiz = await prisma.quiz.create({
    data: {
      title: 'JavaScript Basics Quiz',
      timeLimit: 25,
      lessonId: jsLessons[0].id
    }
  });

  // Create questions for HTML quiz
  const htmlQuestions = await Promise.all([
    prisma.question.create({
      data: {
        text: 'What does HTML stand for?',
        type: 'MULTIPLE_CHOICE',
        options: {
          A: 'HyperText Markup Language',
          B: 'High Tech Modern Language',
          C: 'Home Tool Markup Language',
          D: 'Hyperlink and Text Markup Language'
        },
        correctAnswer: { answer: 'A' },
        order: 1,
        quizId: htmlQuiz.id
      }
    }),
    prisma.question.create({
      data: {
        text: 'Which tag is used to create a hyperlink?',
        type: 'MULTIPLE_CHOICE',
        options: {
          A: '<link>',
          B: '<a>',
          C: '<href>',
          D: '<url>'
        },
        correctAnswer: { answer: 'B' },
        order: 2,
        quizId: htmlQuiz.id
      }
    }),
    prisma.question.create({
      data: {
        text: 'HTML is a programming language.',
        type: 'TRUE_FALSE',
        correctAnswer: { answer: false },
        order: 3,
        quizId: htmlQuiz.id
      }
    })
  ]);

  // Create questions for CSS quiz
  const cssQuestions = await Promise.all([
    prisma.question.create({
      data: {
        text: 'What does CSS stand for?',
        type: 'MULTIPLE_CHOICE',
        options: {
          A: 'Computer Style Sheets',
          B: 'Creative Style Sheets',
          C: 'Cascading Style Sheets',
          D: 'Colorful Style Sheets'
        },
        correctAnswer: { answer: 'C' },
        order: 1,
        quizId: cssQuiz.id
      }
    }),
    prisma.question.create({
      data: {
        text: 'Which property is used to change the text color?',
        type: 'MULTIPLE_CHOICE',
        options: {
          A: 'text-color',
          B: 'color',
          C: 'font-color',
          D: 'text-style'
        },
        correctAnswer: { answer: 'B' },
        order: 2,
        quizId: cssQuiz.id
      }
    })
  ]);

  // Create questions for JavaScript quiz
  const jsQuestions = await Promise.all([
    prisma.question.create({
      data: {
        text: 'Which keyword is used to declare a variable in JavaScript?',
        type: 'MULTIPLE_CHOICE',
        options: {
          A: 'var',
          B: 'let',
          C: 'const',
          D: 'All of the above'
        },
        correctAnswer: { answer: 'D' },
        order: 1,
        quizId: jsQuiz.id
      }
    }),
    prisma.question.create({
      data: {
        text: 'JavaScript is case-sensitive.',
        type: 'TRUE_FALSE',
        correctAnswer: { answer: true },
        order: 2,
        quizId: jsQuiz.id
      }
    }),
    prisma.question.create({
      data: {
        text: 'What is the result of 2 + "2" in JavaScript?',
        type: 'MULTIPLE_CHOICE',
        options: {
          A: '4',
          B: '22',
          C: 'Error',
          D: 'NaN'
        },
        correctAnswer: { answer: 'B' },
        order: 3,
        quizId: jsQuiz.id
      }
    })
  ]);

  // Create enrollments
  console.log('📝 Creating enrollments...');
  
  const enrollments = await Promise.all([
    // Acme University enrollments
    prisma.enrollment.create({
      data: {
        userId: acmeStudents[0].id,
        courseId: webDevCourse.id,
        organizationId: org1.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: acmeStudents[1].id,
        courseId: webDevCourse.id,
        organizationId: org1.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: acmeStudents[2].id,
        courseId: dataScienceCourse.id,
        organizationId: org1.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: acmeStudents[3].id,
        courseId: dataScienceCourse.id,
        organizationId: org1.id,
        status: 'COMPLETED'
      }
    }),
    // TechCorp Training enrollments
    prisma.enrollment.create({
      data: {
        userId: techcorpStudents[0].id,
        courseId: reactCourse.id,
        organizationId: org2.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: techcorpStudents[1].id,
        courseId: nodejsCourse.id,
        organizationId: org2.id,
        status: 'ACTIVE'
      }
    }),
    // Global Learning Institute enrollments
    prisma.enrollment.create({
      data: {
        userId: gliStudents[0].id,
        courseId: leadershipCourse.id,
        organizationId: org3.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: gliStudents[1].id,
        courseId: projectMgmtCourse.id,
        organizationId: org3.id,
        status: 'ACTIVE'
      }
    }),
    prisma.enrollment.create({
      data: {
        userId: gliStudents[2].id,
        courseId: leadershipCourse.id,
        organizationId: org3.id,
        status: 'COMPLETED'
      }
    })
  ]);

  // Create progress records
  console.log('📊 Creating progress records...');
  
  const progressRecords = await Promise.all([
    // Progress for John Doe in Web Development course
    prisma.progress.create({
      data: {
        userId: acmeStudents[0].id,
        lessonId: htmlLessons[0].id,
        status: 'COMPLETED',
        completedAt: new Date('2024-01-15T10:30:00Z')
      }
    }),
    prisma.progress.create({
      data: {
        userId: acmeStudents[0].id,
        lessonId: htmlLessons[1].id,
        status: 'IN_PROGRESS'
      }
    }),
    prisma.progress.create({
      data: {
        userId: acmeStudents[0].id,
        lessonId: cssLessons[0].id,
        status: 'NOT_STARTED'
      }
    }),
    // Progress for Jane Smith in Web Development course
    prisma.progress.create({
      data: {
        userId: acmeStudents[1].id,
        lessonId: htmlLessons[0].id,
        status: 'COMPLETED',
        completedAt: new Date('2024-01-16T14:20:00Z')
      }
    }),
    prisma.progress.create({
      data: {
        userId: acmeStudents[1].id,
        lessonId: htmlLessons[1].id,
        status: 'COMPLETED',
        completedAt: new Date('2024-01-17T09:15:00Z')
      }
    }),
    prisma.progress.create({
      data: {
        userId: acmeStudents[1].id,
        lessonId: cssLessons[0].id,
        status: 'IN_PROGRESS'
      }
    })
  ]);

  // Create quiz attempts
  console.log('📝 Creating quiz attempts...');
  
  const quizAttempts = await Promise.all([
    prisma.quizAttempt.create({
      data: {
        userId: acmeStudents[0].id,
        quizId: htmlQuiz.id,
        answers: {
          question1: 'A',
          question2: 'B',
          question3: false
        },
        score: 100,
        submittedAt: new Date('2024-01-15T11:00:00Z')
      }
    }),
    prisma.quizAttempt.create({
      data: {
        userId: acmeStudents[1].id,
        quizId: htmlQuiz.id,
        answers: {
          question1: 'A',
          question2: 'A',
          question3: true
        },
        score: 66.67,
        submittedAt: new Date('2024-01-16T15:00:00Z')
      }
    }),
    prisma.quizAttempt.create({
      data: {
        userId: acmeStudents[1].id,
        quizId: cssQuiz.id,
        answers: {
          question1: 'C',
          question2: 'B'
        },
        score: 100,
        submittedAt: new Date('2024-01-17T10:00:00Z')
      }
    })
  ]);

  // Create additional quiz attempts for demo student
  console.log('📝 Creating additional demo quiz attempts...');
  
  const additionalQuizAttempts = await Promise.all([
    prisma.quizAttempt.create({
      data: {
        userId: demoStudent.id,
        quizId: cssQuiz.id,
        answers: {
          question1: 'C',
          question2: 'B'
        },
        score: 100,
        submittedAt: new Date('2024-01-18T14:30:00Z')
      }
    }),
    prisma.quizAttempt.create({
      data: {
        userId: demoStudent.id,
        quizId: jsQuiz.id,
        answers: {
          question1: 'D',
          question2: true,
          question3: 'B'
        },
        score: 100,
        submittedAt: new Date('2024-01-19T10:15:00Z')
      }
    })
  ]);

  // Create sample certificates
  console.log('🏆 Creating sample certificates...');
  
  const certificates = await Promise.all([
    prisma.certificate.create({
      data: {
        userId: demoStudent.id,
        courseId: additionalCourses[1].id, // React Development course
        certificateNumber: 'CERT-2024-001',
        verificationCode: 'VERIFY-ABC123',
        status: 'ACTIVE'
      }
    }),
    prisma.certificate.create({
      data: {
        userId: acmeStudents[3].id, // Alice Johnson
        courseId: dataScienceCourse.id,
        certificateNumber: 'CERT-2024-002',
        verificationCode: 'VERIFY-DEF456',
        status: 'ACTIVE'
      }
    }),
    prisma.certificate.create({
      data: {
        userId: gliStudents[2].id, // Student Three
        courseId: leadershipCourse.id,
        certificateNumber: 'CERT-2024-003',
        verificationCode: 'VERIFY-GHI789',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organizations: 3`);
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Courses: ${await prisma.course.count()}`);
  console.log(`- Modules: ${await prisma.module.count()}`);
  console.log(`- Lessons: ${await prisma.lesson.count()}`);
  console.log(`- Quizzes: ${await prisma.quiz.count()}`);
  console.log(`- Questions: ${await prisma.question.count()}`);
  console.log(`- Enrollments: ${await prisma.enrollment.count()}`);
  console.log(`- Progress Records: ${await prisma.progress.count()}`);
  console.log(`- Quiz Attempts: ${await prisma.quizAttempt.count()}`);
  console.log(`- Certificates: ${await prisma.certificate.count()}`);
  console.log('\n🎭 Demo Credentials:');
  console.log('Admin: admin@example.com / password');
  console.log('Instructor: instructor@example.com / password');
  console.log('Student: student@example.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
