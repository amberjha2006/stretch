import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Decision } from '@/lib/types';
import { initialState } from '@/lib/initial-state';
import {
  applyDecision,
  advanceDay,
  computeMetrics,
  resetState,
  resolveEvent,
  toggleSubscription,
} from '@/lib/finance';

export interface StretchStore extends GameState {
  // derived metrics
  metrics: ReturnType<typeof computeMetrics>;
  // actions
  commitDecision: (decision: Decision) => void;
  nextDay: () => void;
  resolveEvent: (choice: 'full' | 'cheaper' | 'fund') => void;
  toggleSubscription: (id: string) => void;
  restart: () => void;
}

export const useStretch = create<StretchStore>()(
  persist(
    (set, get) => {
      const baseState: GameState = initialState;
      const compute = () => computeMetrics({ ...get() } as GameState);
      return {
        ...baseState,
        get metrics() {
          return compute();
        },
        commitDecision: (decision: Decision) => {
          set(state => applyDecision(state, decision));
        },
        nextDay: () => {
          const state = get();
          if (state.pendingEventId) return; // block while event pending
          set(state => advanceDay(state));
        },
        resolveEvent: (choice) => {
          set(state => resolveEvent(state, choice));
        },
        toggleSubscription: (id) => {
          set(state => toggleSubscription(state, id));
        },
        restart: () => {
          set(() => ({ ...resetState() } as StretchStore));
        },
      } as StretchStore;
    },
    {
      name: 'stretch-v1', // storage key
    }
  )
);
