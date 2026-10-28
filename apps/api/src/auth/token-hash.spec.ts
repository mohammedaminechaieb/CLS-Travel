import { compareToken, hashToken } from './token-hash';

describe('token-hash', () => {
  it('distinguishes tokens sharing a 72+ byte prefix (bcrypt truncation)', async () => {
    const prefix = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Yjg2NTJhYi1mNDVjLTQ1NjgtOTJkMC02';
    const a = `${prefix}AAAA`;
    const b = `${prefix}BBBB`;
    const hash = await hashToken(a);
    expect(await compareToken(a, hash)).toBe(true);
    expect(await compareToken(b, hash)).toBe(false);
  });
});
