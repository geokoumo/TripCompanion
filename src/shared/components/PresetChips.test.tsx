import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PresetChips } from './PresetChips';

describe('PresetChips', () => {
  it('calls onSelect with the tapped preset', async () => {
    const onSelect = vi.fn();
    render(<PresetChips presets={['Stays', 'Food']} onSelect={onSelect} hideInput />);
    await userEvent.click(screen.getByText('Stays'));
    expect(onSelect).toHaveBeenCalledWith('Stays');
  });

  it('submits trimmed free text on Enter', async () => {
    const onSelect = vi.fn();
    render(<PresetChips presets={[]} onSelect={onSelect} />);
    const input = screen.getByPlaceholderText('Other…');
    await userEvent.type(input, '  Custom category  {Enter}');
    expect(onSelect).toHaveBeenCalledWith('Custom category');
  });

  it('does not submit blank free text', async () => {
    const onSelect = vi.fn();
    render(<PresetChips presets={[]} onSelect={onSelect} />);
    const input = screen.getByPlaceholderText('Other…');
    await userEvent.type(input, '   {Enter}');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders a preset already present elsewhere as disabled and filled with its color, and blocks re-adding it', async () => {
    const onSelect = vi.fn();
    render(<PresetChips presets={['Stays', 'Food']} onSelect={onSelect} hideInput filledColor={(p) => (p === 'Stays' ? 'rust' : undefined)} />);

    const staysChip = screen.getByText('Stays');
    const foodChip = screen.getByText('Food');
    expect(staysChip).toBeDisabled();
    expect(staysChip).toHaveAttribute('data-color', 'rust');
    expect(foodChip).not.toBeDisabled();

    await userEvent.click(staysChip);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(foodChip);
    expect(onSelect).toHaveBeenCalledWith('Food');
  });
});
