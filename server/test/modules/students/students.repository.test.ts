import { PgStudentRepository } from '../../../src/modules/students/students.repository';
import type { Database } from '../../../src/database/connection';

const record = { ra: 123, name: 'Ana' };
const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();
let query: jest.Mock;
let repository: PgStudentRepository;
beforeEach(() => {
  jest.restoreAllMocks();
  query = jest.fn();
  repository = new PgStudentRepository({ query } as unknown as Database);
});
function expectSql(...parts: string[]) {
  expect(query).toHaveBeenCalledTimes(1);
  const sql = normalize(query.mock.calls[0][0] as string);
  for (const part of parts) expect(sql).toContain(part);
}
test('create retorna linha e executa INSERT parametrizado com RETURNING', async () => {
  query.mockResolvedValue({ rows: [record] });
  expect(await repository.create({ ra: 123, name: 'Ana' })).toBe(record);
  expectSql('INSERT INTO students (ra, name) VALUES ($1, $2)', 'RETURNING ra, name');
  expect(query.mock.calls[0][1]).toEqual([123, 'Ana']);
});
test('findAll retorna linhas, seleciona colunas e ordena sem parâmetros', async () => {
  const rows = [record];
  query.mockResolvedValue({ rows });
  expect(await repository.findAll()).toBe(rows);
  expectSql('SELECT ra, name FROM students', 'ORDER BY name');
  expect(query.mock.calls[0]).toHaveLength(1);
});
test('findAll devolve lista vazia', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await repository.findAll()).toEqual([]);
});
test('findOne existente retorna primeira linha e filtra com parâmetros', async () => {
  query.mockResolvedValue({ rows: [record] });
  expect(await repository.findOne(123)).toBe(record);
  expectSql('SELECT ra, name FROM students', 'WHERE ra = $1');
  expect(query.mock.calls[0][1]).toEqual([123]);
});
test('findOne inexistente devolve undefined', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await repository.findOne(123)).toBeUndefined();
});
test.each(['create', 'findAll', 'findOne'] as const)('%s propaga a mesma instância de erro do banco', async method => {
  const failure = new Error('Banco indisponível');
  query.mockRejectedValue(failure);
  const action = method === 'create' ? repository.create({ ra: 123, name: 'Ana' }) : method === 'findAll' ? repository.findAll() : repository.findOne(123);
  await expect(action).rejects.toBe(failure);
});
