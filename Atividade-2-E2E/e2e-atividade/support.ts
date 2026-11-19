import { test as base, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

export const test = base.extend({
  page: async ({ page }, use) => {
    const sql = `TRUNCATE enrollments, courses, students RESTART IDENTITY CASCADE;
INSERT INTO students (ra, name) VALUES (258001, 'Ana Clara Silva'), (258002, 'Bruno Henrique Santos');`;
    const reset = spawnSync('docker', [
      'compose', '-f', 'compose.atividade-e2e.yml', '-p', 'atividade2-e2e',
      'exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'atividade2_e2e', '-v', 'ON_ERROR_STOP=1'
    ], { cwd: resolve(__dirname, '..'), input: sql, encoding: 'utf8' });
    if (reset.error || reset.status !== 0) {
      throw new Error(`Falha ao preparar banco E2E: ${reset.error?.message ?? reset.stderr}`);
    }
    await page.goto('/');
    await expect(page.locator('#students')).toHaveAttribute('aria-busy', 'false');
    await use(page);
  },
});
export { expect };
