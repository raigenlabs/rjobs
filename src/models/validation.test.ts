import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeLatex, formatIndianPhone, UserRegistrationSchema, ProfileUpdateSchema } from './validation.ts';

test('LaTeX Escaping: properly escapes standard LaTeX special characters', () => {
  const input = 'Built 100% test coverage & saved $50k #1 priority {test} _score_ ~99% ^high';
  const escaped = escapeLatex(input);
  
  assert.ok(escaped.includes('\\&'), 'Ampersand must be escaped');
  assert.ok(escaped.includes('\\%'), 'Percent must be escaped');
  assert.ok(escaped.includes('\\$'), 'Dollar sign must be escaped');
  assert.ok(escaped.includes('\\#'), 'Hash must be escaped');
  assert.ok(escaped.includes('\\_'), 'Underscore must be escaped');
  assert.ok(escaped.includes('\\{'), 'Left brace must be escaped');
  assert.ok(escaped.includes('\\}'), 'Right brace must be escaped');
  assert.ok(escaped.includes('\\textasciitilde{}'), 'Tilde must be escaped');
  assert.ok(escaped.includes('\\textasciicircum{}'), 'Caret must be escaped');
});

test('LaTeX Security: neutralizes dangerous injection macros and commands', () => {
  const hostilePayload = '\\input{/etc/passwd} and \\write18{cat /etc/shadow} and \\openin';
  const sanitized = escapeLatex(hostilePayload);
  
  assert.ok(!sanitized.includes('\\input{'), 'Input command must be neutralized');
  assert.ok(!sanitized.includes('\\write18'), 'Write18 command must be neutralized');
  assert.ok(!sanitized.includes('\\openin'), 'Openin command must be neutralized');
  assert.ok(sanitized.includes('[BLOCKED-CMD]'), 'Blocked marker should be substituted');
});

test('Indian Phone Formatter: converts raw 10-digit numbers to +91 formatted string', () => {
  assert.equal(formatIndianPhone('9876543210'), '+91 98765 43210');
  assert.equal(formatIndianPhone('919876543210'), '+91 98765 43210');
  assert.equal(formatIndianPhone('+91 98765 43210'), '+91 98765 43210');
});

test('Zod Registration Schema: accepts valid Indian student signups and rejects invalid emails', () => {
  const valid = {
    email: 'student@iitd.ac.in',
    password: 'securepassword123',
    name: 'Aarav Sharma',
    college: 'IIT Delhi',
    gradYear: 2026,
  };
  const result = UserRegistrationSchema.safeParse(valid);
  assert.equal(result.success, true);

  const invalidEmail = {
    email: 'not-an-email',
    password: 'short',
    name: 'A',
  };
  const failResult = UserRegistrationSchema.safeParse(invalidEmail);
  assert.equal(failResult.success, false);
});
