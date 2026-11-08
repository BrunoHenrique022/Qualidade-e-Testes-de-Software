import { CoursesService } from '../../../src/modules/courses/courses.service';
import type { CourseRepository } from '../../../src/modules/courses/courses.repository';
import { HttpError } from '../../../src/errors';

const record = { id: 123, name: 'Qualidade' };
const input = { name: 'Qualidade' };
let repository: jest.Mocked<CourseRepository>;
let service: CoursesService;
beforeEach(() => {
  jest.restoreAllMocks();
  repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
  service = new CoursesService(repository);
});
async function expectStatus(action: () => Promise<unknown>, code: number) {
  try { await action(); throw new Error('Era esperado HttpError'); }
  catch (error) { expect(error).toBeInstanceOf(HttpError); expect((error as HttpError).statusCode).toBe(code); }
}

test('create válido retorna registro e chama repositório uma vez', async () => {
  repository.create.mockResolvedValue(record);
  expect(await service.create(input)).toEqual(record);
  expect(repository.create).toHaveBeenCalledTimes(1);
  expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
});

test.each([null, {}, { name: 'A' }])('create rejeita entrada inválida %s sem consultar repositório', async value => {
  await expectStatus(() => service.create(value), 400);
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

test('findOne rejeita ID zero antes de consultar repositório', async () => {
  await expectStatus(() => service.findOne(0), 400);
  expect(repository.findOne).not.toHaveBeenCalled();
});
test.each(['findAll', 'findOne'] as const)('%s propaga a mesma instância de erro inesperado', async method => {
  const failure = new Error('Falha inesperada');
  repository[method].mockRejectedValue(failure);
  const action = method === 'findAll' ? service.findAll() : service.findOne(123);
  await expect(action).rejects.toBe(failure);
});
test('spy observa método real de stub assíncrono', async () => {
  const stub: CourseRepository = {
    create: async () => record,
    findAll: async () => [record],
    findOne: async () => ({ id: 1, name: 'Qualidade' }),
  };
  const spy = jest.spyOn(stub, 'findOne');
  const instance = new CoursesService(stub);
  expect(await instance.findOne(1)).toEqual({ id: 1, name: 'Qualidade' });
  expect(spy).toHaveBeenCalledWith(1);
  expect(spy).toHaveBeenCalledTimes(1);
});
test('create ignora campos extras antes de encaminhar', async () => {
  repository.create.mockResolvedValue(record);
  await service.create({ name: 'Qualidade', extra: true });
  expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  expect(repository.create).toHaveBeenCalledTimes(1);
});
