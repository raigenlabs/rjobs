import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_JOB_SOURCES, INITIAL_JOB_OPENINGS } from './jobSourcesRegistry.ts';
import { probeJobSource } from './scraperEngine.ts';
import { calculateJobMatch } from './matchingAlgorithm.ts';
import { SEED_PROFILES } from './candidateData.ts';

test('Job Sources Registry: exactly 35 enterprise sources configured with valid URLs', () => {
  assert.equal(SEED_JOB_SOURCES.length, 35, 'Must contain all 35 specified employer career sources');

  const requiredCompanies = [
    'Google',
    'Microsoft',
    'Amazon',
    'Meta',
    'Apple',
    'Oracle',
    'IBM',
    'Intel',
    'Nvidia',
    'Qualcomm',
    'Infosys (InStep)',
    'TCS',
    'Wipro',
    'Cognizant',
    'Capgemini',
    'Accenture',
    'Deloitte',
    'PwC',
    'EY',
    'KPMG',
    'Goldman Sachs',
    'JP Morgan',
    'Morgan Stanley',
    'Barclays',
    'Uber',
    'Adobe',
    'Salesforce',
    'SAP',
    'Cisco',
    'Siemens',
    'Bosch',
    'Philips',
    'Sony',
    "Lowe's India",
    'Sony Research India',
  ];

  for (const comp of requiredCompanies) {
    const found = SEED_JOB_SOURCES.find((s) => s.company.toLowerCase().includes(comp.toLowerCase().slice(0, 5)));
    assert.ok(found, `Source for ${comp} must be present in registry`);
    assert.ok(found.careersUrl.startsWith('https://'), `Careers URL for ${comp} must be HTTPS`);
    assert.ok(found.robotsCompliance.userAgentChecked.includes('rJobsBot'), 'User-agent must be documented');
  }
});

test('Scraper Probe Engine: measures latency and verifies healthy response', async () => {
  const googleSource = SEED_JOB_SOURCES[0];
  const result = await probeJobSource(googleSource);

  assert.equal(result.httpStatus, 200);
  assert.equal(result.status, 'healthy');
  assert.ok(result.latencyMs > 0, 'Latency must be recorded');
  assert.ok(result.jobsDiscovered >= googleSource.jobsCount, 'Discovered count should be tracked');
});

test('Job Matching Algorithm: produces high scores and reasons for matching candidates', () => {
  const aaravProfile = SEED_PROFILES['user_aarav_01'];
  const googleJob = INITIAL_JOB_OPENINGS.find((j) => j.company === 'Google')!;

  const match = calculateJobMatch(googleJob, aaravProfile);
  assert.ok(match.totalScore >= 80, 'Score should be high for matching skills & location');
  assert.equal(match.hardFilterPassed, true);
  assert.ok(match.reasons.length > 0, 'Should output human-readable reasons');
});
