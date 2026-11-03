import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLatexSource, TEMPLATES } from './latexTemplates.ts';
import { calculatePageFit } from './pdfGenerator.ts';
import { tailorResumeToJd, runAntiFabricationAudit } from './tailoringEngine.ts';
import { parseResumeText } from './resumeParser.ts';
import { SEED_MASTER_RESUME } from './candidateData.ts';
import type { ResumeData } from '../models/resume.ts';


test('LaTeX Templates: generates valid compilable LaTeX for all 5 templates', () => {
  for (const t of TEMPLATES) {
    const tex = generateLatexSource(SEED_MASTER_RESUME.data, t.id);
    assert.ok(tex.includes('\\documentclass'), `Template ${t.id} must include documentclass`);
    assert.ok(tex.includes('\\begin{document}'), `Template ${t.id} must include begin{document}`);
    assert.ok(tex.includes('\\end{document}'), `Template ${t.id} must include end{document}`);
    assert.ok(tex.includes('Aarav Sharma'), `Template ${t.id} must include candidate name`);
    assert.ok(tex.includes('ChronoKV'), `Template ${t.id} must include project title`);
  }
});

test('Page Fit Estimator: calculates line count and detects one-page constraint', () => {
  const fit = calculatePageFit(SEED_MASTER_RESUME.data);
  assert.ok(fit.totalLines > 20, 'Should estimate realistic line count');
  assert.ok(fit.estimatedPages >= 0.8 && fit.estimatedPages <= 2.0, 'Page estimate reasonable');
});

test('Tailoring Engine & Anti-Fabrication: audits against phantom additions', () => {
  const jd = `We are looking for a Software Development Engineer at Google with deep experience in Go, Distributed Systems, Kafka, and PostgreSQL.`;
  const result = tailorResumeToJd(SEED_MASTER_RESUME, jd, 'Google', 'Software Engineering Intern');

  assert.equal(result.company, 'Google');
  assert.ok(result.matchScoreAfter >= result.matchScoreBefore, 'Score should improve after tailoring');
  assert.ok(result.bulletProposals.length > 0, 'Should produce change proposals');
  assert.equal(result.antiFabricationAudit.passed, true, 'Clean tailoring should pass anti-fabrication');

  // Test Anti-Fabrication violation
  const fakeResume: ResumeData = JSON.parse(JSON.stringify(SEED_MASTER_RESUME.data));
  fakeResume.experience.push({
    id: 'fake_1',
    company: 'NASA Jet Propulsion Laboratory',
    position: 'Chief Scientist',
    location: 'Pasadena, CA',
    startDate: '2023',
    endDate: '2024',
    isCurrent: false,
    bullets: ['Fabricated aerospace mission software'],
  });

  const failAudit = runAntiFabricationAudit(SEED_MASTER_RESUME.data, fakeResume);
  assert.equal(failAudit.passed, false, 'Audit should catch unverified employer');
  assert.ok(failAudit.warnings.some((w) => w.includes('NASA Jet Propulsion Laboratory')));
});

test('Resume Text Parser: extracts email, phone, location and skills from text', () => {
  const sample = `
Rohan Verma
rohan.verma@nitk.edu.in | +91 98765 12345 | Bengaluru, India
National Institute of Technology Karnataka (NITK) Surathkal
Skills: Python, C++, Docker, PostgreSQL, Kubernetes, Redis, Git
`;
  const parsed = parseResumeText(sample);
  assert.equal(parsed.data.basics.email, 'rohan.verma@nitk.edu.in');
  assert.ok(parsed.data.basics.phone.includes('98765 12345') || parsed.data.basics.phone.includes('9876512345'));
  assert.ok(parsed.data.skills[0].skills.includes('Python'));
  assert.ok(parsed.data.skills[0].skills.includes('Docker'));
});
