import { setupSecurityTests, getDatabaseService } from './setup';

export default async function globalSetup() {
  await setupSecurityTests();
  return getDatabaseService();
}
