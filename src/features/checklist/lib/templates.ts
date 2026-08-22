import { CHECKLIST_TEMPLATES } from '../../../config/constants';
import { generateId } from '../../../shared/lib/id';
import type { ChecklistItem } from '../types';

export const TEMPLATE_NAMES = Object.keys(CHECKLIST_TEMPLATES);

export function buildChecklistFromTemplate(templateName: string, travelerId: string): ChecklistItem[] {
  const template = CHECKLIST_TEMPLATES[templateName];
  if (!template) return [];
  return template.map((item) => ({
    id: generateId(),
    travelerId,
    text: item.text,
    category: item.category,
    quantity: item.quantity,
    done: false,
  }));
}

const MASTER_TEMPLATE_KEY = 'tripcompanion:masterChecklistTemplate';

export function saveMasterTemplate(items: ChecklistItem[]): void {
  const serializable = items.map(({ text, category, quantity }) => ({ text, category, quantity }));
  localStorage.setItem(MASTER_TEMPLATE_KEY, JSON.stringify(serializable));
}

export function loadMasterTemplate(travelerId: string): ChecklistItem[] {
  const raw = localStorage.getItem(MASTER_TEMPLATE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { text: string; category: string; quantity: number }[];
    return parsed.map((item) => ({
      id: generateId(),
      travelerId,
      text: item.text,
      category: item.category,
      quantity: item.quantity,
      done: false,
    }));
  } catch {
    return [];
  }
}

export function hasMasterTemplate(): boolean {
  return localStorage.getItem(MASTER_TEMPLATE_KEY) !== null;
}
