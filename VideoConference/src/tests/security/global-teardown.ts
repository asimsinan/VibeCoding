import { cleanupSecurityTests } from './setup';

export default async function globalTeardown() {
  await cleanupSecurityTests();
}
