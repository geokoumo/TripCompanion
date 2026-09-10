import { beforeEach, describe, expect, it } from 'vitest';
import { CHECKLIST_TEMPLATES } from '../../config/constants';
import { buildChecklistFromTemplate, hasMasterTemplate, loadMasterTemplate, saveMasterTemplate, TEMPLATE_NAMES } from './lib/templates';

beforeEach(() => {
  localStorage.clear();
});

describe('TEMPLATE_NAMES', () => {
  it('lists every configured template name', () => {
    expect(TEMPLATE_NAMES).toEqual(Object.keys(CHECKLIST_TEMPLATES));
  });
});

describe('buildChecklistFromTemplate', () => {
  it('builds one item per template entry, assigned to the given traveler', () => {
    const name = TEMPLATE_NAMES[0]!;
    const items = buildChecklistFromTemplate(name, 'traveler-1');
    expect(items).toHaveLength(CHECKLIST_TEMPLATES[name]!.length);
    expect(items.every((i) => i.travelerId === 'traveler-1' && !i.done)).toBe(true);
  });

  it('gives each item a unique id', () => {
    const items = buildChecklistFromTemplate(TEMPLATE_NAMES[0]!, 't1');
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('returns an empty list for an unknown template name', () => {
    expect(buildChecklistFromTemplate('Not A Real Template', 't1')).toEqual([]);
  });
});

describe('master template persistence', () => {
  it('has no master template until one is saved', () => {
    expect(hasMasterTemplate()).toBe(false);
    expect(loadMasterTemplate('t1')).toEqual([]);
  });

  it('saves and reloads a master template, re-keyed for a new traveler and reset to not-done', () => {
    const items = buildChecklistFromTemplate(TEMPLATE_NAMES[0]!, 'original-traveler').map((i) => ({ ...i, done: true }));
    saveMasterTemplate(items);
    expect(hasMasterTemplate()).toBe(true);

    const loaded = loadMasterTemplate('new-traveler');
    expect(loaded).toHaveLength(items.length);
    expect(loaded.every((i) => i.travelerId === 'new-traveler' && !i.done)).toBe(true);
    expect(loaded.map((i) => i.text)).toEqual(items.map((i) => i.text));
  });

  it('recovers gracefully from corrupted stored JSON', () => {
    localStorage.setItem('tripcompanion:masterChecklistTemplate', 'not json');
    expect(loadMasterTemplate('t1')).toEqual([]);
  });
});
