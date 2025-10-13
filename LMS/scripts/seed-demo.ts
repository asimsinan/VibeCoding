import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create or get demo organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Demo University' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Demo University',
          domain: 'demo-university.com',
          settings: {
            allowRegistration: true,
            requireEmailVerification: false,
            maxUsers: 1000,
          },
        },
      });
    }

    console.log('✅ Created organization:', organization.name);

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password', 12);

    // Create or get demo users
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      });
    }

    let instructor = await prisma.user.findUnique({
      where: { email: 'instructor@example.com' }
    });

    if (!instructor) {
      instructor = await prisma.user.create({
        data: {
          email: 'instructor@example.com',
          name: 'Instructor User',
          password: hashedPassword,
          role: 'INSTRUCTOR',
          organizationId: organization.id,
        },
      });
    }

    let student = await prisma.user.findUnique({
      where: { email: 'student@example.com' }
    });

    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student@example.com',
          name: 'Student User',
          password: hashedPassword,
          role: 'STUDENT',
          organizationId: organization.id,
        },
      });
    }

    console.log('✅ Created users:');
    console.log('   - Admin:', admin.email);
    console.log('   - Instructor:', instructor.email);
    console.log('   - Student:', student.email);

    console.log('✅ Demo data created successfully!');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin: admin@example.com / password');
    console.log('   Instructor: instructor@example.com / password');
    console.log('   Student: student@example.com / password');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
