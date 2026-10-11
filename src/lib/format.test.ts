import { describe, it, expect } from 'vitest';
import { formatINR } from './format';

describe('formatINR', () => {
  it('formats numbers as INR currency', () => {
    expect(formatINR(1000)).toBe('₹1,000.00');
    expect(formatINR(1234567.89)).toBe('₹12,34,567.89');
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(0.5)).toBe('₹0.50');
  });
});