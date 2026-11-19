import { isForeignKeyViolation } from '../../src/database/foreign-key-violation';
describe('isForeignKeyViolation', () => {
  test('reconhece código 23503 no objeto', () => expect(isForeignKeyViolation({ code: '23503' })).toBe(true));
  test.each([null, undefined, '23503', 23503, {}, { code: 'outro' }])('rejeita entrada não reconhecida %s', value => {
    expect(isForeignKeyViolation(value)).toBe(false);
  });
});
