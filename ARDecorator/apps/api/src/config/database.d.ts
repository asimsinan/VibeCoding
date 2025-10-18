import { PrismaClient } from '@prisma/client';
export declare const databaseConfig: {
    url: string;
    connectionTimeout: number;
    maxConnections: number;
    minConnections: number;
};
export declare const prisma: PrismaClient<{
    datasources: {
        db: {
            url: string;
        };
    };
    log: ("error" | "query" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function testDatabaseConnection(): Promise<boolean>;
export declare function disconnectDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map