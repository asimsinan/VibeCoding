import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DesignReportService {
  async create(designId: string) {
    // Create report with initial "generating" status
    const report = await prisma.designReport.create({
      data: {
        designId,
        status: 'generating',
      },
    });

    // In a real implementation, this would trigger an async job to generate the report
    // For now, we'll immediately mark it as completed with a placeholder URL
    setTimeout(async () => {
      await this.updateStatus(report.id, 'completed', `https://reports.example.com/${report.id}.pdf`);
    }, 100);

    return report;
  }

  async findById(id: string) {
    return prisma.designReport.findUnique({
      where: { id },
      include: {
        design: {
          include: {
            roomPhoto: true,
            placedFurniture: {
              include: {
                furnitureItem: true,
              },
            },
          },
        },
      },
    });
  }

  async findByDesignId(designId: string) {
    return prisma.designReport.findMany({
      where: { designId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, reportUrl?: string) {
    const updateData: any = { status };
    
    if (reportUrl) {
      updateData.reportUrl = reportUrl;
    }

    if (status === 'completed') {
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      updateData.expiresAt = expiresAt;
    }

    return prisma.designReport.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await prisma.designReport.delete({
      where: { id },
    });
  }
}

