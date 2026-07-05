import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { StatCard, Badge, EmptyState } from '../components/ui';
import { attendanceColor, pct } from '../utils/format';

describe('UI components', () => {
  test('StatCard renders label and value', () => {
    render(<StatCard label="Students Present" value={42} icon="user" />);
    expect(screen.getByText('Students Present')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('Badge renders children', () => {
    render(<Badge className="bg-emerald-100">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('EmptyState renders title', () => {
    render(<EmptyState title="Nothing found" />);
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });
});

describe('format helpers', () => {
  test('pct rounds correctly', () => {
    expect(pct(74.6)).toBe('75%');
  });
  test('attendanceColor thresholds', () => {
    expect(attendanceColor(80)).toContain('emerald');
    expect(attendanceColor(70)).toContain('amber');
    expect(attendanceColor(50)).toContain('rose');
  });
});
