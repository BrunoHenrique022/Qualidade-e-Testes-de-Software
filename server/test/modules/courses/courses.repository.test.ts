import { PgCourseRepository } from '../../../src/modules/courses/courses.repository';
import type { Database } from '../../../src/database/connection';

const record = { id: 7, name: 'Qualidade' };
const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();
let query: jest.Mock;
let repository: PgCourseRepository;
beforeEach(() => {
  jest.restoreAllMocks();
  query = jest.fn();
  repository = new PgCourseRepository({ query } as unknown as Database);
});
function expectSql(...parts: string[]) {
  expect(query).toHaveBeenCalledTimes(1);
  const sql = normalize(query.mock.calls[0][0] as string);
  for (const part of parts) expect(sql).toContain(part);
}
test('create retorna linha e executa INSERT parametrizado com RETURNING', async () => {
  query.mockResolvedValue({ rows: [record] });
  expect(await repository.create({ name: 'Qualidade' })).toBe(record);
  expectSql('INSERT INTO courses (name) VALUES ($1)', 'RETURNING id, name');
  expect(query.mock.calls[0][1]).toEqual(['Qualidade']);
});
test('findAll retorna linhas, seleciona colunas e ordena sem parâmetros', async () => {
  const rows = [record];
  query.mockResolvedValue({ rows });
  expect(await repository.findAll()).toBe(rows);
  expectSql('SELECT id, name FROM courses', 'ORDER BY id');
  expect(query.mock.calls[0]).toHaveLength(1);
});
test('findAll devolve lista vazia', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await repository.findAll()).toEqual([]);
});
test('findOne existente retorna primeira linha e filtra com parâmetros', async () => {
  query.mockResolvedValue({ rows: [record] });
  expect(await repository.findOne(7)).toBe(record);
  expectSql('SELECT id, name FROM courses', 'WHERE id = $1');
  expect(query.mock.calls[0][1]).toEqual([7]);
});
test('findOne inexistente devolve undefined', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await repository.findOne(7)).toBeUndefined();
});
test.each(['create', 'findAll', 'findOne'] as const)('%s propaga a mesma instância de erro do banco', async method => {
  const failure = new Error('Banco indisponível');
  query.mockRejectedValue(failure);
  const action = method === 'create' ? repository.create({ name: 'Qualidade' }) : method === 'findAll' ? repository.findAll() : repository.findOne(7);
  await expect(action).rejects.toBe(failure);
});
