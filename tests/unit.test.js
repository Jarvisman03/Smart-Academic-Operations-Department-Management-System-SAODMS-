const { hasPermission, permissionsForRole } = require('../src/config/permissions');
const { ROLES } = require('../src/config/constants');
const { toMinutes, currentPeriod } = require('../src/utils/dateUtils');
const { generateQrToken, parseQrToken } = require('../src/utils/qr');

describe('RBAC permission matrix', () => {
  test('admin has all permissions', () => {
    expect(hasPermission(ROLES.ADMIN, 'anything:at:all')).toBe(true);
  });
  test('student cannot manage users', () => {
    expect(hasPermission(ROLES.STUDENT, 'user:manage')).toBe(false);
  });
  test('faculty can mark attendance', () => {
    expect(hasPermission(ROLES.FACULTY, 'attendance:mark')).toBe(true);
  });
  test('hod can manage timetable', () => {
    expect(hasPermission(ROLES.HOD, 'timetable:manage')).toBe(true);
  });
  test('permissionsForRole returns an array', () => {
    expect(Array.isArray(permissionsForRole(ROLES.DEAN))).toBe(true);
  });
});

describe('date utilities', () => {
  test('toMinutes converts HH:MM', () => {
    expect(toMinutes('08:30')).toBe(510);
    expect(toMinutes('15:00')).toBe(900);
  });
  test('currentPeriod resolves a slot at 08:45', () => {
    const d = new Date();
    d.setHours(8, 45, 0, 0);
    const p = currentPeriod(d);
    expect(p).toBeTruthy();
    expect(p.period).toBe(1);
  });
});

describe('QR tokens', () => {
  test('generated token parses back', () => {
    const t = generateQrToken({ section: 'x', subject: 'y' }, 300);
    const parsed = parseQrToken(t);
    expect(parsed.valid).toBe(true);
    expect(parsed.data.section).toBe('x');
  });
  test('expired token is invalid', () => {
    const t = generateQrToken({ a: 1 }, -1);
    const parsed = parseQrToken(t);
    expect(parsed.valid).toBe(false);
  });
});
