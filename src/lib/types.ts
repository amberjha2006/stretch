// Types for the Stretch finance simulation engine

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number
  saved: number
  plan: number
  /** amount saved this month towards the goal */
  doneThisMonth: number
}

export interface Commitment {
  id: string
  name: string
  emoji: string
  amount: number
  dueDay: number
  isSubscription: boolean
  active: boolean
  paid: boolean
}

export interface LogEntry {
  id: string
  day: number
  label: string
  amount: number // negative = money out, positive = money in
}

export interface SurpriseEvent {
  id: string
  day: number
  title: string
  emoji: string
  amount: number // cost to resolve (positive number)
}

export type Decision =
  | { kind: 'spend'; amount: number; category: string }
  | { kind: 'subscription'; amount: number; name: string }
  | { kind: 'saveToGoal'; amount: number; goalId: string }

export interface GameState {
  day: number
  balance: number
  discretionarySpent: number
  goals: Goal[]
  commitments: Commitment[]
  log: LogEntry[]
  events: SurpriseEvent[]
  pendingEventId?: string
  finished: boolean
}
