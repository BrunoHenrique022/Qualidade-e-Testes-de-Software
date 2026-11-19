import { test, expect } from './support';

const rows = (page: import('@playwright/test').Page) => page.getByTestId('student-row');
const ra = (page: import('@playwright/test').Page) => page.getByLabel('RA', { exact: true });
const nome = (page: import('@playwright/test').Page) => page.getByLabel('Nome', { exact: true });
const cadastrar = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Cadastrar aluno' });

async function preencher(page: import('@playwright/test').Page, valorRA: string, valorNome: string) {
  await ra(page).fill(valorRA);
  await nome(page).fill(valorNome);
}

async function cadastro(page: import('@playwright/test').Page, valorRA: string, valorNome: string) {
  await preencher(page, valorRA, valorNome);
  const resposta = page.waitForResponse(r => new URL(r.url()).pathname === '/api/students' && r.request().method() === 'POST');
  await cadastrar(page).click();
  return resposta;
}

test('listagem inicial apresenta os alunos existentes', async ({ page }) => {
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).filter({ hasText: 'Ana Clara Silva' })).toContainText('258001');
  await expect(rows(page).filter({ hasText: 'Bruno Henrique Santos' })).toContainText('258002');
});

test('cadastro válido atualiza lista sem reload, limpa formulário e persiste', async ({ page }) => {
  let navegacoes = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navegacoes++; });
  const resposta = await cadastro(page, '258010', 'Mariana Costa');
  expect((await resposta).status()).toBe(201);
  await expect(page.getByTestId('form-message')).toHaveText('Aluno cadastrado com sucesso.');
  await expect(rows(page).filter({ hasText: 'Mariana Costa' })).toContainText('258010');
  expect(navegacoes).toBe(0);
  await expect(ra(page)).toBeEmpty();
  await expect(nome(page)).toBeEmpty();
  await page.reload();
  await expect(rows(page).filter({ hasText: 'Mariana Costa' })).toContainText('258010');
});

for (const [descricao, valorRA, valorNome] of [
  ['RA vazio', '', 'Nome Válido'],
  ['Nome vazio', '258020', ''],
]) {
  test(`campos obrigatórios: ${descricao}`, async ({ page }) => {
    await preencher(page, valorRA, valorNome);
    let posts = 0;
    page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/students') posts++; });
    await cadastrar(page).click();
    const invalido = valorRA === '' ? ra(page) : nome(page);
    expect(await invalido.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await expect(rows(page)).toHaveCount(2);
    expect(posts).toBe(0);
  });
}

for (const [descricao, valor] of [
  ['negativo', '-1'], ['zero', '0'], ['decimal', '1.5'], ['acima do limite', '2147483648'],
]) {
  test(`RA inválido: ${descricao}`, async ({ page }) => {
    await preencher(page, valor, 'Nome Válido');
    let posts = 0;
    page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/students') posts++; });
    await cadastrar(page).click();
    expect(await ra(page).evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await expect(rows(page)).toHaveCount(2);
    expect(posts).toBe(0);
  });
}

for (const valor of ['A', 'AB', '  AB  ']) {
  test(`nome inválido com menos de três caracteres: ${JSON.stringify(valor)}`, async ({ page }) => {
    await preencher(page, '258030', valor);
    let posts = 0;
    page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/students') posts++; });
    await cadastrar(page).click();
    expect(await nome(page).evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await expect(rows(page)).toHaveCount(2);
    expect(posts).toBe(0);
  });
}

test('RA duplicado exibe erro e preserva os campos', async ({ page }) => {
  const resposta = await cadastro(page, '258001', 'Outro Aluno');
  expect((await resposta).status()).toBe(409);
  await expect(page.getByTestId('form-message')).toContainText('Já existe um estudante com este RA.');
  await expect(page.getByTestId('form-message')).toHaveAttribute('data-state', 'error');
  await expect(ra(page)).toHaveValue('258001');
  await expect(nome(page)).toHaveValue('Outro Aluno');
  await expect(rows(page)).toHaveCount(2);
});

test('lista vazia exibe a mensagem adequada', async ({ page }) => {
  // Este cenário prepara o estado por SQL, sem simular a API ou alterar a aplicação.
  const { spawnSync } = await import('node:child_process');
  const { resolve } = await import('node:path');
  const reset = spawnSync('docker', [
    'compose', '-f', 'compose.atividade-e2e.yml', '-p', 'atividade2-e2e',
    'exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'atividade2_e2e', '-v', 'ON_ERROR_STOP=1'
  ], { cwd: resolve(__dirname, '..'), input: 'TRUNCATE enrollments, courses, students RESTART IDENTITY CASCADE;', encoding: 'utf8' });
  expect(reset.status, reset.stderr).toBe(0);
  await page.reload();
  await expect(page.locator('#students')).toHaveAttribute('aria-busy', 'false');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByTestId('list-message')).toHaveText('Nenhum aluno cadastrado.');
});
