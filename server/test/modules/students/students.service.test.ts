import { StudentsService } from '../../../src/modules/students/students.service';
import type { StudentRepository } from '../../../src/modules/students/students.repository';
import { HttpError } from '../../../src/errors';

const record = { ra: 123, name: 'Ana' };
const input = { ra: 123, name: 'Ana' };
let repository: jest.Mocked<StudentRepository>;
let service: StudentsService;
beforeEach(() => {
  jest.restoreAllMocks();
  repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
  service = new StudentsService(repository);
});
async function expectStatus(action: () => Promise<unknown>, code: number) {
  try { await action(); throw new Error('Era esperado HttpError'); }
  catch (error) { expect(error).toBeInstanceOf(HttpError); expect((error as HttpError).statusCode).toBe(code); }
}

test('create válido retorna registro e chama repositório uma vez', async () => {
  repository.create.mockResolvedValue(record);
  expect(await service.create(input)).toEqual(record);
  expect(repository.create).toHaveBeenCalledTimes(1);
  expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: 'Ana' });
});

test('create rejeita RA zero sem consultar repositório', async () => {
  await expectStatus(() => service.create({ ra: 0, name: 'Ana' }), 400);
  expect(repository.create).not.toHaveBeenCalled();
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
  expect(await service.findOne(123)).toBe(record);
  expect(repository.findOne).toHaveBeenCalledTimes(1);
  expect(repository.findOne).toHaveBeenCalledWith(123);
});
test('findOne inexistente gera HTTP 404', async () => {
  repository.findOne.mockResolvedValue(undefined);
  await expectStatus(() => service.findOne(123), 404);
  expect(repository.findOne).toHaveBeenCalledWith(123);
});
test('create propaga a mesma instância de erro inesperado', async () => {
  const failure = new Error('Falha inesperada');
  repository.create.mockRejectedValue(failure);
  await expect(service.create(input)).rejects.toBe(failure);
});
