import type { GameState } from './types';

export const initialState: GameState = {
  day: 1,
  balance: 10000,
  discretionarySpent: 0,
  goals: [
    {
      id: 'g1',
      name: 'Emergency fund',
      emoji: '🚑',
      target: 1500,
      saved: 200,
      plan: 500,
      doneThisMonth: 0,
    },
    {
      id: 'g2',
      name: 'Goa trip',
      emoji: '🏖️',
      target: 4000,
      saved: 0,
      plan: 1000,
      doneThisMonth: 0,
    },
  ],
  commitments: [
    { id: 'c1', name: 'Rent share', emoji: '🏠', amount: 2500, dueDay: 2, isSubscription: false, active: true, paid: false },
    { id: 'c2', name: 'Metro pass', emoji: '🚇', amount: 600, dueDay: 3, isSubscription: false, active: true, paid: false },
    { id: 'c3', name: 'Phone recharge', emoji: '📱', amount: 299, dueDay: 5, isSubscription: false, active: true, paid: false },
    { id: 'c4', name: 'Spotify', emoji: '🎧', amount: 119, dueDay: 8, isSubscription: true, active: true, paid: false },
    { id: 'c5', name: 'Netflix', emoji: '📺', amount: 199, dueDay: 12, isSubscription: true, active: true, paid: false },
    { id: 'c6', name: 'Gym', emoji: '💪', amount: 499, dueDay: 15, isSubscription: true, active: true, paid: false },
    { id: 'c7', name: 'Cloud storage', emoji: '☁️', amount: 75, dueDay: 20, isSubscription: true, active: true, paid: false },
  ],
  log: [],
  events: [
    { id: 'e1', day: 9, title: "cracked phone screen", emoji: '📱', amount: 1400 },
    { id: 'e2', day: 18, title: "friend's birthday dinner", emoji: '🎂', amount: 800 },
    { id: 'e3', day: 25, title: "laptop charger died", emoji: '🔌', amount: 900 },
  ],
  pendingEventId: undefined,
  finished: false,
};
