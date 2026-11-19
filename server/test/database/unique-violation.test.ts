import { isUniqueViolation } from '../../src/database/unique-violation';
describe('isUniqueViolation', () => {
  test('reconhece código 23505 no objeto', () => expect(isUniqueViolation({ code: '23505' })).toBe(true));
  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])('rejeita entrada não reconhecida %s', value => {
    expect(isUniqueViolation(value)).toBe(false);
  });
});
