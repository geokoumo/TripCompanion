import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSavingGuard } from './useSavingGuard';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useSavingGuard', () => {
  it('starts with saving false', () => {
    const { result } = renderHook(() => useSavingGuard());
    expect(result.current.saving).toBe(false);
  });

  it('sets saving true while the action is in flight, then false once it resolves', async () => {
    const { result } = renderHook(() => useSavingGuard());
    const { promise, resolve } = deferred<void>();

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.run(() => promise);
    });
    expect(result.current.saving).toBe(true);

    await act(async () => {
      resolve();
      await runPromise;
    });
    expect(result.current.saving).toBe(false);
  });

  it('resets saving to false even when the action throws, so a failed save can be retried', async () => {
    const { result } = renderHook(() => useSavingGuard());
    const action = vi.fn().mockRejectedValue(new Error('save failed'));

    await act(async () => {
      await expect(result.current.run(action)).rejects.toThrow('save failed');
    });
    expect(result.current.saving).toBe(false);
  });

  it('ignores a second call while the first is still in flight (prevents duplicate submission)', async () => {
    const { result } = renderHook(() => useSavingGuard());
    const { promise, resolve } = deferred<void>();
    const action = vi.fn(() => promise);

    let firstCall!: Promise<void>;
    let secondCall!: Promise<void>;
    act(() => {
      firstCall = result.current.run(action);
      secondCall = result.current.run(action);
    });
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve();
      await Promise.all([firstCall, secondCall]);
    });
  });

  it('allows a fresh call once a previous one has finished', async () => {
    const { result } = renderHook(() => useSavingGuard());
    const action = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.run(action);
    });
    await act(async () => {
      await result.current.run(action);
    });
    expect(action).toHaveBeenCalledTimes(2);
  });
});
