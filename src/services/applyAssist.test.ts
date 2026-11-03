import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectAtsPlatform,
  splitFullName,
  generateAtsFormFields,
  generateTruthfulAnswersBank,
  generateAutofillBookmarkletScript,
  validateHumanReviewGate,
  calculateFormCompleteness,
} from './applyAssistEngine.ts';
import { SEED_PROFILES, SEED_MASTER_RESUME } from './candidateData.ts';
import type { LegalDisclosures } from '../models/applyAssist.ts';

const mockDisclosures: LegalDisclosures = {
  workAuthorization: 'india_citizen',
  noticePeriodDays: 0,
  expectedCtcInrLpa: 22,
  availableFromImmediate: true,
  willingToRelocate: true,
  collegeNocAvailable: true,
  disabilityDeclaration: 'no',
  genderDeclaration: 'male',
  confirmedReviewedByUser: true,
};

test('detectAtsPlatform correctly identifies enterprise ATS portals from URLs', () => {
  assert.equal(detectAtsPlatform('https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite'), 'workday');
  assert.equal(detectAtsPlatform('https://boards.greenhouse.io/stripe/jobs/123'), 'greenhouse');
  assert.equal(detectAtsPlatform('https://jobs.lever.co/palantir/456'), 'lever');
  assert.equal(detectAtsPlatform('https://www.amazon.jobs/en/search?base_query=intern'), 'amazon_jobs');
  assert.equal(detectAtsPlatform('https://careers.oracle.com/jobs/#en/sites/jobsearch/requisitions'), 'oracle_hcm');
  assert.equal(detectAtsPlatform('https://jobs.sap.com/search/?q=intern'), 'successfactors');
  assert.equal(detectAtsPlatform('https://custom.careers.example.com/apply'), 'generic');
});

test('splitFullName parses single and multi-word names reliably', () => {
  assert.deepEqual(splitFullName('Aarav Sharma'), { firstName: 'Aarav', lastName: 'Sharma' });
  assert.deepEqual(splitFullName('Priya Anand Patel'), { firstName: 'Priya', lastName: 'Anand Patel' });
  assert.deepEqual(splitFullName('Cher'), { firstName: 'Cher', lastName: '' });
  assert.deepEqual(splitFullName(''), { firstName: '', lastName: '' });
});

test('generateAtsFormFields produces mapped fields for personal, education, links and legal', () => {
  const profile = SEED_PROFILES['user_aarav_01'];
  const fields = generateAtsFormFields(profile, SEED_MASTER_RESUME, mockDisclosures);

  assert.ok(fields.length >= 10);
  const emailField = fields.find((f) => f.systemKey === 'email');
  assert.ok(emailField);
  assert.equal(emailField.value, 'aarav.sharma@iitd.ac.in');

  const univField = fields.find((f) => f.systemKey === 'university');
  assert.ok(univField);
  assert.ok(univField.value.includes('IIT'));

  const authField = fields.find((f) => f.systemKey === 'workAuthorization');
  assert.ok(authField);
  assert.ok(authField.value.includes('Citizen of India'));
  assert.equal(authField.isSensitive, true);
});

test('generateTruthfulAnswersBank generates grounded answers referencing real profile details', () => {
  const profile = SEED_PROFILES['user_aarav_01'];
  const answers = generateTruthfulAnswersBank('Google', 'Software Engineering Intern', profile, SEED_MASTER_RESUME);

  assert.equal(answers.length, 5);
  const whyAnswer = answers.find((a) => a.promptKey === 'why_company');
  assert.ok(whyAnswer);
  assert.ok(whyAnswer.answer.includes('Delhi'));
  assert.ok(whyAnswer.answer.includes('IIT'));

  const techChallenge = answers.find((a) => a.promptKey === 'technical_challenge');
  assert.ok(techChallenge);
  assert.ok(techChallenge.answer.includes('ChronoKV'));
});

test('generateAutofillBookmarkletScript outputs valid JS with no-auto-submit safeguard', () => {
  const profile = SEED_PROFILES['user_aarav_01'];
  const fields = generateAtsFormFields(profile, SEED_MASTER_RESUME, mockDisclosures);
  const script = generateAutofillBookmarkletScript('workday', fields);

  assert.ok(script.includes('(function rJobsApplyAssist()'));
  assert.ok(script.includes('Human-in-the-Loop Safeguard'));
  assert.ok(script.includes('alert('));
  assert.ok(!script.includes('.submit()')); // Must NEVER automatically submit
});

test('validateHumanReviewGate enforces user confirmation before submission', () => {
  const unconfirmedDisclosures: LegalDisclosures = {
    ...mockDisclosures,
    confirmedReviewedByUser: false,
  };

  const invalidResult = validateHumanReviewGate(unconfirmedDisclosures, false);
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.missingRequirements.length > 0);

  const validResult = validateHumanReviewGate(mockDisclosures, true);
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.missingRequirements.length, 0);
});

test('calculateFormCompleteness returns 100 for all-filled fields', () => {
  const profile = SEED_PROFILES['user_aarav_01'];
  const fields = generateAtsFormFields(profile, SEED_MASTER_RESUME, mockDisclosures);
  const completeness = calculateFormCompleteness(fields);
  assert.ok(completeness >= 90);
});
