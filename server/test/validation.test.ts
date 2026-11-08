import { positiveInteger, parseId, validateName, validateBody } from '../src/validation';
import { HttpError } from '../src/errors';

function expectBad(fn: () => unknown) {
  try { fn(); throw new Error('Era esperado HttpError'); }
  catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(400);
  }
}

describe('positiveInteger', () => {
  test.each([1, 2147483647])('aceita o limite válido %s', value => {
    expect(positiveInteger(value, 'RA')).toBe(value);
  });
  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, '123', null, undefined])('rejeita %s com HTTP 400', value => {
    expectBad(() => positiveInteger(value, 'RA'));
  });
});
describe('parseId', () => {
  test.each([['1', 1], ['2147483647', 2147483647]] as const)('converte %s em %s', (value, expected) => {
    expect(parseId(value, 'RA')).toBe(expected);
  });
  test.each(['1abc', '1.2', '1e2', '', '-1', '0', '2147483648', 123])('rejeita %s com HTTP 400', value => {
    expectBad(() => parseId(value, 'RA'));
  });
});
describe('validateName', () => {
  test.each(['Ana', 'a'.repeat(100)])('aceita nome válido de comprimento %s', value => {
    expect(validateName(value)).toBe(value);
  });
  test.each(['', 'ab', '   ', ' a ', 'a'.repeat(101), 123, null, undefined])('rejeita nome inválido %s', value => {
    expectBad(() => validateName(value));
  });
});
describe('validateBody', () => {
  test('aceita objeto congelado sem alterar a referência', () => {
    const input = Object.freeze({ name: 'Ana' });
    expect(validateBody(input)).toBe(input);
    expect(input).toEqual({ name: 'Ana' });
  });
  test.each([null, undefined, [], 'Ana', 12])('rejeita corpo inválido %s', value => {
    expectBad(() => validateBody(value));
  });
  test('preserva campos extras e referência original', () => {
    const input = { name: 'Ana', extra: true };
    expect(validateBody(input)).toBe(input);
    expect(input).toEqual({ name: 'Ana', extra: true });
  });
});
