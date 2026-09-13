import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField, TextAreaField } from './Field';

describe('TextField', () => {
  it('associates the visible label with the input via htmlFor/id, so getByLabelText finds it', () => {
    render(<TextField label="Title" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Title')).toBeInstanceOf(HTMLInputElement);
  });

  it('uses a stable auto-generated id when none is provided', () => {
    render(<TextField label="Title" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Title');
    expect(input.id).toBeTruthy();
  });

  it('respects an explicit id instead of generating one', () => {
    render(<TextField label="Title" id="my-title" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Title')).toHaveAttribute('id', 'my-title');
  });

  it('marks the input aria-invalid and describes it by the error text when an error is present', () => {
    render(<TextField label="Title" value="" onChange={() => {}} error="Title is required" />);
    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!.split(' ')[0]!)).toHaveTextContent('Title is required');
  });

  it('has no aria-invalid when there is no error', () => {
    render(<TextField label="Title" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Title')).not.toHaveAttribute('aria-invalid');
  });

  it('describes the input by both caption and error when both are present, without duplicate ids', () => {
    render(<TextField label="Title" value="" onChange={() => {}} caption="Helper text" error="Bad value" />);
    const input = screen.getByLabelText('Title');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) {
      expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
    }
  });
});

describe('TextAreaField', () => {
  it('associates the visible label with the textarea', () => {
    render(<TextAreaField label="Note" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Note')).toBeInstanceOf(HTMLTextAreaElement);
  });
});
