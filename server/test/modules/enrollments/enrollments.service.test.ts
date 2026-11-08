import { EnrollmentsService } from '../../../src/modules/enrollments/enrollments.service';
import type { EnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';
import { HttpError } from '../../../src/errors';

const record = { studentRa: 123, courseId: 1, enrolledAt: new Date('2026-01-01T00:00:00Z') };
const input = { studentRa: 123, courseId: 1 };
let repository: jest.Mocked<EnrollmentRepository>;
let service: EnrollmentsService;
beforeEach(() => {
  jest.restoreAllMocks();
  repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
  service = new EnrollmentsService(repository);
});
async function expectStatus(action: () => Promise<unknown>, code: number) {
  try { await action(); throw new Error('Era esperado HttpError'); }
  catch (error) { expect(error).toBeInstanceOf(HttpError); expect((error as HttpError).statusCode).toBe(code); }
}

test('create válido retorna registro e chama repositório uma vez', async () => {
  repository.create.mockResolvedValue(record);
  expect(await service.create(input)).toEqual(record);
  expect(repository.create).toHaveBeenCalledTimes(1);
  expect(repository.create).toHaveBeenCalledWith(123, 1);
});

test.each([{ studentRa: 0, courseId: 1 }, { studentRa: 123, courseId: 0 }])('create rejeita chave inválida %j', async value => {
  await expectStatus(() => service.create(value), 400);
  expect(repository.create).not.toHaveBeenCalled();
});
test('create converte violação de chave estrangeira em 404', async () => {
  repository.create.mockRejectedValue({ code: '23503' });
  await expectStatus(() => service.create(input), 404);
});

test('create converte duplicidade em 409', async () => {
  repository.create.mockRejectedValue({ code: '23505' });
  await expectStatus(() => service.create(input), 409);
});
test('findAll devolve lista do stub e chama método uma vez sem argumentos', async () => {
  const rows = [record];
  repository.findAll.mockResolvedValue(rows);
  expect(await service.findAll()).toBe(rows);
  expect(repository.findAll).toHaveBeenCalledTimes(1);
  expect(repository.findAll).toHaveBeenCalledWith();
});

test('findOne existente retorna registro e encaminha identificadores', async () => {
  repository.findOne.mockResolvedValue(record);
  expect(await service.findOne(123, 1)).toBe(record);
  expect(repository.findOne).toHaveBeenCalledTimes(1);
  expect(repository.findOne).toHaveBeenCalledWith(123, 1);
});
test('findOne inexistente gera HTTP 404', async () => {
  repository.findOne.mockResolvedValue(undefined);
  await expectStatus(() => service.findOne(123, 1), 404);
  expect(repository.findOne).toHaveBeenCalledWith(123, 1);
});
test('create propaga a mesma instância de erro inesperado', async () => {
  const failure = new Error('Falha inesperada');
  repository.create.mockRejectedValue(failure);
  await expect(service.create(input)).rejects.toBe(failure);
});
