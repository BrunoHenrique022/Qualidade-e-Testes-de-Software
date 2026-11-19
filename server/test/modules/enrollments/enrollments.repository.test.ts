import { PgEnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';
import type { Database } from '../../../src/database/connection';

const record = { studentRa: 123, courseId: 7, enrolledAt: new Date('2026-01-01T00:00:00Z') };
const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();
let query: jest.Mock;
let repository: PgEnrollmentRepository;
beforeEach(() => {
  jest.restoreAllMocks();
  query = jest.fn();
  repository = new PgEnrollmentRepository({ query } as unknown as Database);
});
function expectSql(...parts: string[]) {
  expect(query).toHaveBeenCalledTimes(1);
  const sql = normalize(query.mock.calls[0][0] as string);
  for (const part of parts) expect(sql).toContain(part);
}
test('create retorna linha e executa INSERT parametrizado com RETURNING', async () => {
  query.mockResolvedValue({ rows: [record] });
  expect(await repository.create(123, 7)).toBe(record);
  expectSql('INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2)', 'RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"');
  expect(query.mock.calls[0][1]).toEqual([123, 7]);
});
test('findAll retorna linhas, seleciona colunas e ordena sem parâmetros', async () => {
  const rows = [record];
  query.mockResolvedValue({ rows });
  expect(await repository.findAll()).toBe(rows);
  expectSql('SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments', 'ORDER BY student_ra, course_id');
  expect(query.mock.calls[0]).toHaveLength(1);
});
test('findAll devolve lista vazia', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await repository.findAll()).toEqual([]);
});
test('findOne existente retorna primeira linha e filtra com parâmetros', async () => {
  query.mockResolvedValue({ rows: [record] });
  expect(await repository.findOne(123, 7)).toBe(record);
  expectSql('SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments', 'WHERE student_ra = $1 AND course_id = $2');
  expect(query.mock.calls[0][1]).toEqual([123, 7]);
});
test('findOne inexistente devolve undefined', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await repository.findOne(123, 7)).toBeUndefined();
});
test.each(['create', 'findAll', 'findOne'] as const)('%s propaga a mesma instância de erro do banco', async method => {
  const failure = new Error('Banco indisponível');
  query.mockRejectedValue(failure);
  const action = method === 'create' ? repository.create(123, 7) : method === 'findAll' ? repository.findAll() : repository.findOne(123, 7);
  await expect(action).rejects.toBe(failure);
});
