import { useState } from 'react';
import { CHECKLIST_CATEGORIES } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { FieldWrapper, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { PresetChips } from '../../../shared/components/PresetChips';
import type { ChecklistItem } from '../types';

const ITEM_PRESETS = ['Passport', 'Charger', 'Sunscreen', 'Umbrella', 'Medicine'];
const OTHER = '__other__';

interface AddChecklistItemSheetProps {
  onClose: () => void;
  onSave: (values: Pick<ChecklistItem, 'text' | 'category' | 'quantity'>) => void;
}

export function AddChecklistItemSheet({ onClose, onSave }: AddChecklistItemSheetProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string>(CHECKLIST_CATEGORIES[0]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState(1);

  const effectiveCategory = creatingCategory ? customCategory.trim() : category;
  const canSave = text.trim().length > 0 && effectiveCategory.length > 0;

  return (
    <Modal
      title="New item"
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          disabled={!canSave}
          onClick={() => onSave({ text: text.trim(), category: effectiveCategory, quantity })}
        >
          Save
        </Button>
      }
    >
      <TextField label="What are you taking" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Adapter" />
      <FieldWrapper label="Quick picks">
        <PresetChips presets={ITEM_PRESETS} onSelect={setText} hideInput />
      </FieldWrapper>

      <FieldWrapper label="Category">
        <ChipSelect
          options={[...CHECKLIST_CATEGORIES.map((c) => ({ id: c, label: c })), { id: OTHER, label: 'Other' }]}
          value={creatingCategory ? OTHER : category}
          onChange={(id) => {
            if (id === OTHER) setCreatingCategory(true);
            else {
              setCreatingCategory(false);
              setCategory(id);
            }
          }}
        />
      </FieldWrapper>
      {creatingCategory && (
        <TextField label="New category" autoFocus value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
      )}

      <TextField
        label="Quantity"
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
      />
    </Modal>
  );
}
