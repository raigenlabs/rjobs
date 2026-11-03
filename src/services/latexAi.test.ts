import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLatexSource } from './latexTemplates.ts';
import { parseLatexToResumeData, unescapeLatex } from './latexParser.ts';
import {
  localTransformLatex,
  validateLatexSyntax,
} from './latexAiEngine.ts';
import type { ResumeData } from '../models/resume.ts';

const SAMPLE_RESUME_DATA: ResumeData = {
  schemaVersion: '1.0.0',
  basics: {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    github: 'https://github.com/aaravsharma',
    linkedin: 'https://linkedin.com/in/aaravsharma',
  },
  summary: 'Motivated backend engineer with deep interest in distributed systems.',
  education: [
    {
      id: 'edu_1',
      institution: 'Indian Institute of Technology, Madras',
      degree: 'B.Tech in Computer Science',
      fieldOfStudy: '',
      location: 'Chennai, India',
      startDate: '2022',
      endDate: '2026',
      grade: '8.9 / 10 CGPA',
    },
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'Amazon Development Centre',
      position: 'Software Engineering Intern',
      location: 'Bengaluru, India',
      startDate: 'May 2025',
      endDate: 'July 2025',
      isCurrent: false,
      bullets: [
        'Worked on internal telemetry pipelines using Java and AWS SQS.',
        'Helped with indexing database queries for low latency search.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Cloud Key-Value Store',
      startDate: 'Jan 2025',
      endDate: 'Apr 2025',
      technologies: ['Go', 'Raft', 'gRPC'],
      bullets: [
        'Built a replicated distributed key-value store implementing the Raft consensus algorithm.',
      ],
    },
  ],
  skills: [
    {
      id: 'sk_1',
      categoryName: 'Languages',
      skills: ['Python', 'Java', 'C++', 'TypeScript'],
    },
    {
      id: 'sk_2',
      categoryName: 'Frameworks & Tools',
      skills: ['React', 'Node.js', 'Git', 'PostgreSQL'],
    },
  ],
  achievements: [
    {
      id: 'ach_1',
      title: 'Codeforces Master',
      description: 'Ranked top 1% globally in international competitive programming rounds.',
    },
  ],
  certifications: [],
  sectionOrder: ['education', 'experience', 'projects', 'skills', 'achievements'],
};

test('LaTeX Generation & Parser Roundtrip: Extracts candidate info, education, experience, and projects', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  assert.ok(latex.includes('Aarav Sharma'));
  assert.ok(latex.includes('\\section{Education}'));
  assert.ok(latex.includes('\\section{Experience}'));

  const parsed = parseLatexToResumeData(latex, SAMPLE_RESUME_DATA);
  assert.equal(parsed.basics.name, 'Aarav Sharma');
  assert.equal(parsed.basics.email, 'aarav.sharma@example.com');
  assert.ok(parsed.education.length > 0);
  assert.ok(parsed.experience.length > 0);
  assert.equal(parsed.experience[0].company, 'Amazon Development Centre');
  assert.ok(parsed.projects.length > 0);
  assert.equal(parsed.projects[0].title, 'Cloud Key-Value Store');
});

test('validateLatexSyntax: confirms balanced environments in generated resumes', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const check = validateLatexSyntax(latex);
  assert.equal(check.valid, true);
  assert.equal(check.errors.length, 0);

  // Mismatched environment
  const brokenLatex = latex + '\n\\begin{itemize}\n\\item stray';
  const brokenCheck = validateLatexSyntax(brokenLatex);
  assert.equal(brokenCheck.valid, false);
});

test('AI LaTeX Engine: Condenses resume for strict 1-page fit', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'Condense the resume to fit strictly on 1 page');

  assert.ok(res.updatedLatex.includes('\\addtolength{\\topmargin}{-0.65in}'));
  assert.ok(res.summaryOfChanges.some((s) => s.includes('vertical margins')));
  assert.equal(res.isCompilable, true);
});

test('AI LaTeX Engine: Quantifies project and experience bullets with Google XYZ metrics', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'Quantify all bullets with Google XYZ metrics');

  assert.ok(res.updatedLatex.includes('%') || res.updatedLatex.includes('latency') || res.updatedLatex.includes('RPS'));
  assert.ok(res.summaryOfChanges.some((s) => s.includes('metrics')));
  assert.equal(res.isCompilable, true);
});

test('AI LaTeX Engine: Inserts a production-grade Distributed Rate Limiter project', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'Add a high-throughput Distributed Rate Limiter project in Go and Redis');

  assert.ok(res.updatedLatex.includes('Distributed Rate Limiter'));
  assert.ok(res.updatedLatex.includes('Go, Redis, gRPC, Docker'));
  assert.equal(res.isCompilable, true);

  // Roundtrip parse check
  const parsed = parseLatexToResumeData(res.updatedLatex, SAMPLE_RESUME_DATA);
  const foundProj = parsed.projects.find((p) => p.title.includes('Distributed Rate Limiter'));
  assert.ok(foundProj, 'Parsed projects should include the newly added project');
});

test('AI LaTeX Engine: Adds requested skills to Technical Skills section', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'Add Docker, Kubernetes and Redis to my technical skills');

  assert.ok(res.updatedLatex.includes('Docker'));
  assert.ok(res.updatedLatex.includes('Kubernetes'));
  assert.equal(res.isCompilable, true);
});

test('unescapeLatex: correctly handles escaped characters', () => {
  const text = 'Systems \\& Scalability \\% 99.9\\$ under \\_test\\_';
  const clean = unescapeLatex(text);
  assert.equal(clean, 'Systems & Scalability % 99.9$ under _test_');
});

test('AI LaTeX Engine: Modifies candidate name and verifies ATS sync', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'Change candidate name to Rohan Deshmukh');
  assert.ok(res.updatedLatex.includes('Rohan Deshmukh'));
  const parsed = parseLatexToResumeData(res.updatedLatex, SAMPLE_RESUME_DATA);
  assert.equal(parsed.basics.name, 'Rohan Deshmukh');
});

test('AI LaTeX Engine: Modifies candidate name to Raghvendra Sahu with lowercase and "my name" prompt', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'change my name to  raghvendra sahu');
  assert.ok(res.updatedLatex.includes('Raghvendra Sahu'));
  const parsed = parseLatexToResumeData(res.updatedLatex, SAMPLE_RESUME_DATA);
  assert.equal(parsed.basics.name, 'Raghvendra Sahu');
});

test('AI LaTeX Engine: Modifies candidate location and phone and verifies ATS sync', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res1 = localTransformLatex(latex, 'Change location to Mumbai, India');
  const parsed1 = parseLatexToResumeData(res1.updatedLatex, SAMPLE_RESUME_DATA);
  assert.equal(parsed1.basics.location, 'Mumbai, India');

  const res2 = localTransformLatex(latex, 'Change my phone number to +91 91234 56789');
  const parsed2 = parseLatexToResumeData(res2.updatedLatex, SAMPLE_RESUME_DATA);
  assert.equal(parsed2.basics.phone, '+91 91234 56789');
});

test('AI LaTeX Engine: Updates custom professional summary and verifies ATS sync', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const customSummary = 'High-impact distributed systems engineer with deep expertise in Raft consensus, Go, and low-latency stream processing.';
  const res = localTransformLatex(latex, `Make summary: ${customSummary}`);
  const parsed = parseLatexToResumeData(res.updatedLatex, SAMPLE_RESUME_DATA);
  assert.equal(parsed.summary, customSummary);
});

test('AI LaTeX Engine: Removes a project and verifies it disappears from ATS parsed data', () => {
  const latex = generateLatexSource(SAMPLE_RESUME_DATA, 'classic-single');
  const res = localTransformLatex(latex, 'Remove Cloud Key-Value Store project');
  const parsed = parseLatexToResumeData(res.updatedLatex, SAMPLE_RESUME_DATA);
  const found = parsed.projects.some((p) => p.title.includes('Cloud Key-Value Store'));
  assert.equal(found, false);
});
