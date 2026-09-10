import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { nullableOptional } from './lib/zodHelpers';

describe('nullableOptional', () => {
  const schema = z.object({ field: nullableOptional(z.string()) });

  it('accepts a real value', () => {
    expect(schema.parse({ field: 'hello' })).toEqual({ field: 'hello' });
  });

  it('accepts an explicit null, the shape Postgres RPCs actually send for an unset column', () => {
    expect(schema.parse({ field: null })).toEqual({ field: null });
  });

  it('accepts the key being omitted entirely', () => {
    expect(schema.parse({})).toEqual({});
  });

  it('rejects a wrong-typed value', () => {
    expect(() => schema.parse({ field: 123 })).toThrow();
  });
});
