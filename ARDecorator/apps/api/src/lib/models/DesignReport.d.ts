import { DesignReport as PrismaDesignReport } from '@prisma/client';
/**
 * DesignReport Model
 * Represents a generated PDF report for a design
 */
export interface DesignReport extends PrismaDesignReport {
}
export type ReportStatus = 'generating' | 'completed' | 'failed';
export interface CreateReportInput {
    designId: string;
}
export interface UpdateReportInput {
    status: ReportStatus;
    reportUrl?: string;
    message?: string;
    expiresAt?: Date;
}
//# sourceMappingURL=DesignReport.d.ts.map