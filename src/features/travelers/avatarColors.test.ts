import { describe, expect, it } from 'vitest';
import { TRAVELER_AVATAR_COLORS } from '../../config/constants';
import { initialsOf, nextAvatarColor } from './lib/avatarColors';

describe('nextAvatarColor', () => {
  it('cycles through the fixed palette in order', () => {
    expect(nextAvatarColor(0)).toBe(TRAVELER_AVATAR_COLORS[0]);
    expect(nextAvatarColor(1)).toBe(TRAVELER_AVATAR_COLORS[1]);
  });

  it('wraps around once every color has been used', () => {
    expect(nextAvatarColor(TRAVELER_AVATAR_COLORS.length)).toBe(TRAVELER_AVATAR_COLORS[0]);
  });
});

describe('initialsOf', () => {
  it('returns "?" for an empty name', () => {
    expect(initialsOf('')).toBe('?');
    expect(initialsOf('   ')).toBe('?');
  });

  it('uses the first two letters of a single-word name', () => {
    expect(initialsOf('Maria')).toBe('MA');
  });

  it('uses the first letter of the first and last name for multi-word names', () => {
    expect(initialsOf('George Papadopoulos')).toBe('GP');
  });

  it('ignores extra whitespace between name parts', () => {
    expect(initialsOf('  George   Papadopoulos  ')).toBe('GP');
  });
});
