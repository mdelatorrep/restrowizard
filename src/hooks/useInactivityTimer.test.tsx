import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInactivityTimer } from './useInactivityTimer';

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), toast: vi.fn() }));
vi.mock('./useAuth', () => ({
  // useAuth returns a new signOut function on each render in the real app.
  useAuth: () => ({ user: { id: 'test-user' }, signOut: () => mocks.signOut() }),
}));
vi.mock('./use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));

describe('authenticated inactivity timer', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('warns 30 seconds before the 10-minute limit and signs out exactly once', () => {
    const { result, rerender } = renderHook(() => useInactivityTimer());
    act(() => vi.advanceTimersByTime(569_999));
    expect(result.current.isWarningActive).toBe(false);
    rerender();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.isWarningActive).toBe(true);
    expect(result.current.timeLeft).toBe(30);
    act(() => vi.advanceTimersByTime(29_999));
    expect(mocks.signOut).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh 10-minute period after activity', () => {
    renderHook(() => useInactivityTimer());
    act(() => vi.advanceTimersByTime(300_000));
    act(() => document.dispatchEvent(new MouseEvent('mousemove')));
    act(() => vi.advanceTimersByTime(599_999));
    expect(mocks.signOut).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it('only extends a warning through explicit session renewal', () => {
    const { result } = renderHook(() => useInactivityTimer());
    act(() => vi.advanceTimersByTime(570_000));
    act(() => document.dispatchEvent(new MouseEvent('mousemove')));
    expect(result.current.isWarningActive).toBe(true);
    act(() => result.current.extendSession());
    expect(result.current.isWarningActive).toBe(false);
    act(() => vi.advanceTimersByTime(599_999));
    expect(mocks.signOut).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
});