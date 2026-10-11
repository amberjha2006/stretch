import type { GameState, Decision, Goal, Commitment, LogEntry } from './types';
import { initialState } from './initial-state';

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Compute various metrics from the current game state */
export function computeMetrics(state: GameState) {
  const daysLeft = 31 - state.day;
  const stillToPay = state.commitments
    .filter(c => c.active && !c.paid)
    .reduce((sum, c) => sum + c.amount, 0);
  const goalReserve = state.goals.reduce((sum, g) => sum + Math.max(0, g.plan - g.doneThisMonth), 0);
  const dailyAllowance = Math.max(0, (state.balance - stillToPay - goalReserve) / daysLeft);
  const avgDailySpend = (state.discretionarySpent + 240) / (state.day + 1);
  const forecast = state.balance - stillToPay - goalReserve - avgDailySpend * daysLeft;
  const risk =
    state.balance < 0 || forecast < 0
      ? 'High'
      : forecast < 500
      ? 'Medium'
      : 'Low';

  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const activeSubscriptionTotal = state.commitments
    .filter(c => c.isSubscription && c.active)
    .reduce((s, c) => s + c.amount, 0);
  const emergencyGoal = state.goals.find(g => g.name.toLowerCase().includes('emergency'));
  const emergencySaved = emergencyGoal ? emergencyGoal.saved : 0;

  const healthScore = Math.round(
    40 * clamp01((forecast + 1500) / 3000) +
      25 * clamp01(totalSaved / 1500) +
      15 * clamp01(1 - activeSubscriptionTotal / 1000) +
      20 * clamp01(emergencySaved / 1000)
  );
  const healthLabel = healthScore < 40 ? 'Fragile' : healthScore < 70 ? 'Steady' : 'Strong';

  return {
    daysLeft,
    stillToPay,
    goalReserve,
    dailyAllowance,
    avgDailySpend,
    forecast,
    risk,
    healthScore,
    healthLabel,
  };
}

/** Apply a decision immutably and return new state */
export function applyDecision(state: GameState, decision: Decision): GameState {
  const newLog: LogEntry = {
    id: `log-${Date.now()}`,
    day: state.day,
    label: decision.kind,
    amount: 0,
  };

  switch (decision.kind) {
    case 'spend': {
      const amount = decision.amount;
      newLog.amount = -amount;
      return {
        ...state,
        balance: state.balance - amount,
        discretionarySpent: state.discretionarySpent + amount,
        log: [...state.log, { ...newLog }],
      };
    }
    case 'subscription': {
      // toggle subscription active state based on amount (activate if amount > 0)
      const idx = state.commitments.findIndex(c => c.name === decision.name);
      if (idx === -1) return state;
      const commitment = state.commitments[idx];
      const updated: Commitment = { ...commitment, active: decision.amount > 0 };
      const newCommitments = [...state.commitments];
      newCommitments[idx] = updated;
      return { ...state, commitments: newCommitments };
    }
    case 'saveToGoal': {
      const goalIdx = state.goals.findIndex(g => g.id === decision.goalId);
      if (goalIdx === -1) return state;
      const goal = state.goals[goalIdx];
      const amount = decision.amount;
      const updatedGoal: Goal = {
        ...goal,
        saved: goal.saved + amount,
        doneThisMonth: goal.doneThisMonth + amount,
      };
      const newGoals = [...state.goals];
      newGoals[goalIdx] = updatedGoal;
      newLog.amount = -amount;
      return {
        ...state,
        balance: state.balance - amount,
        goals: newGoals,
        log: [...state.log, { ...newLog }],
      };
    }
    default:
      return state;
  }
}

/** Simulate a decision, returning before/after metrics, deltas and warnings */
export function simulateDecision(state: GameState, decision: Decision) {
  const before = computeMetrics(state);
  const afterState = applyDecision(state, decision);
  const after = computeMetrics(afterState);
  const deltas = {
    balance: afterState.balance - state.balance,
    dailyAllowance: after.dailyAllowance - before.dailyAllowance,
    risk: after.risk,
    healthScore: after.healthScore - before.healthScore,
  };
  const warnings: string[] = [];
  if (afterState.balance < 0) warnings.push('overdraft');
  if (after.risk === 'High' && before.risk !== 'High') warnings.push('newHighRisk');
  if (after.dailyAllowance < before.dailyAllowance * 0.75) warnings.push('allowanceDrop');
  return { before, after, afterState, deltas, warnings };
}

/** Advance the simulation by one day */
export function advanceDay(state: GameState): GameState {
  if (state.finished) return state;
  const newDay = state.day + 1;
  if (newDay > 30) {
    return { ...state, finished: true };
  }
  let newState: GameState = { ...state, day: newDay };
  // charge commitments due today or earlier that are unpaid
  const updatedCommitments = newState.commitments.map(c => {
    if (c.active && !c.paid && c.dueDay <= newDay) {
      // charge
      newState = {
        ...newState,
        balance: newState.balance - c.amount,
        log: [...newState.log, { id: `log-${Date.now()}`, day: newDay, label: 'commitment', amount: -c.amount }],
      };
      return { ...c, paid: true };
    }
    return c;
  });
  // set pending event if any
  const eventToday = newState.events.find(e => e.day === newDay);
  const pendingEventId = eventToday ? eventToday.id : undefined;
  return { ...newState, commitments: updatedCommitments, pendingEventId };
}

/** Resolve a pending surprise event */
export function resolveEvent(state: GameState, choice: 'full' | 'cheaper' | 'fund'): GameState {
  if (!state.pendingEventId) return state;
  const event = state.events.find(e => e.id === state.pendingEventId);
  if (!event) return { ...state, pendingEventId: undefined };
  let cost = 0;
  if (choice === 'full') {
    cost = event.amount;
  } else if (choice === 'cheaper') {
    cost = Math.ceil(event.amount / 2);
  } else if (choice === 'fund') {
    // use emergency goal first
    const emergencyIdx = state.goals.findIndex(g => g.name.toLowerCase().includes('emergency'));
    if (emergencyIdx === -1) {
      cost = event.amount;
    } else {
      const emergency = state.goals[emergencyIdx];
      const fromEmergency = Math.min(emergency.saved, event.amount);
      const remaining = event.amount - fromEmergency;
      const updatedGoal = { ...emergency, saved: emergency.saved - fromEmergency };
      const newGoals = [...state.goals];
      newGoals[emergencyIdx] = updatedGoal;
      cost = remaining;
      state = { ...state, goals: newGoals };
    }
  }
  const newBalance = state.balance - cost;
  const newLog: LogEntry = {
    id: `log-${Date.now()}`,
    day: state.day,
    label: 'event',
    amount: -cost,
  };
  return {
    ...state,
    balance: newBalance,
    log: [...state.log, newLog],
    pendingEventId: undefined,
  };
}

/** Toggle a subscription's active flag */
export function toggleSubscription(state: GameState, id: string): GameState {
  const idx = state.commitments.findIndex(c => c.id === id);
  if (idx === -1) return state;
  const commitment = state.commitments[idx];
  const updated = { ...commitment, active: !commitment.active };
  const newCommitments = [...state.commitments];
  newCommitments[idx] = updated;
  return { ...state, commitments: newCommitments };
}

/** Forecast series of balances for remaining days */
export function forecastSeries(state: GameState): number[] {
  const series: number[] = [];
  let sim = { ...state };
  while (!sim.finished && sim.day < 30) {
    sim = advanceDay(sim);
    series.push(sim.balance);
  }
  return series;
}

/** Reset to initial state */
export function resetState(): GameState {
  return { ...initialState };
}
