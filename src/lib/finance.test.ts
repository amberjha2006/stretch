import { describe, it, expect } from 'vitest';
import { initialState } from '@/lib/initial-state';
import {
  computeMetrics,
  applyDecision,
  simulateDecision,
  advanceDay,
  resolveEvent,
  toggleSubscription,
  resetState,
} from '@/lib/finance';
import type { Decision, GameState } from '@/lib/types';

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

describe('initial metrics', () => {
  const metrics = computeMetrics(initialState);
  it('calculates stillToPay correctly', () => {
    expect(metrics.stillToPay).toBe(4291);
  });
  it('calculates goalReserve correctly', () => {
    expect(metrics.goalReserve).toBe(1500);
  });
  it('initial risk is Low', () => {
    expect(metrics.risk).toBe('Low');
  });

  it('large spend makes risk Medium', () => {
    const decision: Decision = { kind: 'spend', amount: 500, category: 'food' };
    const { after } = simulateDecision(initialState, decision);
    expect(after.risk).toBe('Medium');
  });

  it('overspending makes risk High', () => {
    const decision: Decision = { kind: 'spend', amount: 15000, category: 'luxury' };
    const { after } = simulateDecision(initialState, decision);
    expect(after.risk).toBe('High');
  });
});

describe('applyDecision', () => {
  it('spend reduces balance and logs', () => {
    const decision: Decision = { kind: 'spend', amount: 500, category: 'food' };
    const next = applyDecision(initialState, decision);
    expect(next.balance).toBe(initialState.balance - 500);
    expect(next.discretionarySpent).toBe(500);
    expect(next.log).toHaveLength(1);
    expect(next.log[0].amount).toBe(-500);
  });

  it('saveToGoal updates goal and balance', () => {
    const decision: Decision = { kind: 'saveToGoal', amount: 300, goalId: 'g2' };
    const next = applyDecision(initialState, decision);
    const goal = next.goals.find(g => g.id === 'g2')!;
    expect(goal.saved).toBe(300);
    expect(goal.doneThisMonth).toBe(300);
    expect(next.balance).toBe(initialState.balance - 300);
    expect(next.log).toHaveLength(1);
  });

  it('subscription toggles active flag', () => {
    const decision: Decision = { kind: 'subscription', amount: 0, name: 'Spotify' };
    const next = applyDecision(initialState, decision);
    const sub = next.commitments.find(c => c.name === 'Spotify')!;
    expect(sub.active).toBe(false);
  });
});

describe('simulateDecision warnings', () => {
  it('overdraft warning when spending too much', () => {
    const decision: Decision = { kind: 'spend', amount: 20000, category: 'luxury' };
    const { warnings } = simulateDecision(initialState, decision);
    expect(warnings).toContain('overdraft');
  });
});

describe('advanceDay and events', () => {
  it('charges due commitments and sets pending event', () => {
    const after = advanceDay(initialState);
    // day becomes 2, rent share due
    const rent = after.commitments.find(c => c.id === 'c1')!;
    expect(rent.paid).toBe(true);
    expect(after.balance).toBe(initialState.balance - rent.amount);
    expect(after.pendingEventId).toBeUndefined();
  });

  it('sets pendingEventId on event day', () => {
    let state = clone(initialState);
    // advance to day 8 where Spotify due and event day 9 later
    for (let i = 0; i < 8; i++) state = advanceDay(state);
    expect(state.day).toBe(9);
    expect(state.pendingEventId).toBe('e1');
  });
});

describe('resolveEvent choices', () => {
  it('full pays full amount', () => {
    let state = clone(initialState);
    // advance to day 9
    for (let i = 0; i < 8; i++) state = advanceDay(state);
    const beforeBal = state.balance;
    const after = resolveEvent(state, 'full');
    const event = initialState.events.find(e => e.id === 'e1')!;
    expect(after.balance).toBe(beforeBal - event.amount);
    expect(after.pendingEventId).toBeUndefined();
  });

  it('cheaper pays half amount', () => {
    let state = clone(initialState);
    // advance to day 9
    for (let i = 0; i < 8; i++) state = advanceDay(state);
    const beforeBal = state.balance;
    const after = resolveEvent(state, 'cheaper');
    const event = initialState.events.find(e => e.id === 'e1')!;
    expect(after.balance).toBe(beforeBal - Math.ceil(event.amount / 2));
    expect(after.pendingEventId).toBeUndefined();
  });

  it('fund draws from emergency first', () => {
    let state = clone(initialState);
    // advance to day 9
    for (let i = 0; i < 8; i++) state = advanceDay(state);
    const beforeBal = state.balance;
    const emergency = state.goals.find(g => g.name.toLowerCase().includes('emergency'))!;
    const after = resolveEvent(state, 'fund');
    const event = initialState.events.find(e => e.id === 'e1')!;
    const fromEmergency = Math.min(emergency.saved, event.amount);
    const remaining = event.amount - fromEmergency;
    expect(after.balance).toBe(beforeBal - remaining);
    expect(after.pendingEventId).toBeUndefined();
  });
});

describe('toggleSubscription', () => {
  it('toggles active flag', () => {
    const before = initialState.commitments.find(c => c.id === 'c4')!; // Spotify
    const after = toggleSubscription(initialState, 'c4');
    const toggled = after.commitments.find(c => c.id === 'c4')!;
    expect(toggled.active).toBe(!before.active);
  });

  it('cancelling subscription raises forecast', () => {
    const decision: Decision = { kind: 'subscription', amount: 0, name: 'Spotify' };
    const before = computeMetrics(initialState);
    const afterState = applyDecision(initialState, decision);
    const after = computeMetrics(afterState);
    expect(after.forecast).toBeGreaterThan(before.forecast);
  });
});

describe('resetState', () => {
  it('returns fresh initial state', () => {
    const modified = applyDecision(initialState, { kind: 'spend', amount: 100, category: 'test' });
    const reset = resetState();
    expect(reset).toEqual(initialState);
    expect(modified.balance).not.toBe(reset.balance);
  });
});

describe('advanceDay edge cases', () => {
  it('sets finished = true at day 30', () => {
    let state = clone(initialState);
    // advance to day 29
    for (let i = 0; i < 28; i++) state = advanceDay(state);
    expect(state.day).toBe(29);
    state = advanceDay(state); // day 30
    expect(state.day).toBe(30);
    expect(state.finished).toBe(false);
    state = advanceDay(state); // day 31 -> finished
    expect(state.day).toBe(30); // should stay at 30
    expect(state.finished).toBe(true);
  });

  it('does nothing harmful while event is pending', () => {
    let state = clone(initialState);
    // advance to day 9 where event pending
    for (let i = 0; i < 8; i++) state = advanceDay(state);
    expect(state.pendingEventId).toBe('e1');
    const before = clone(state);
    // calling advanceDay should not change state when event pending
    const after = advanceDay(state);
    expect(after).toEqual(before);
  });
});

describe('immutability', () => {
  it('applyDecision does not mutate input', () => {
    const state = clone(initialState);
    const before = clone(state);
    applyDecision(state, { kind: 'spend', amount: 100, category: 'test' });
    expect(state).toEqual(before);
  });

  it('simulateDecision does not mutate input', () => {
    const state = clone(initialState);
    const before = clone(state);
    simulateDecision(state, { kind: 'spend', amount: 100, category: 'test' });
    expect(state).toEqual(before);
  });

  it('advanceDay does not mutate input', () => {
    const state = clone(initialState);
    const before = clone(state);
    advanceDay(state);
    expect(state).toEqual(before);
  });

  it('resolveEvent does not mutate input', () => {
    let state = clone(initialState);
    // advance to day 9
    for (let i = 0; i < 8; i++) state = advanceDay(state);
    const before = clone(state);
    resolveEvent(state, 'full');
    expect(state).toEqual(before);
  });

  it('toggleSubscription does not mutate input', () => {
    const state = clone(initialState);
    const before = clone(state);
    toggleSubscription(state, 'c4');
    expect(state).toEqual(before);
  });
});
