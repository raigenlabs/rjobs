import type { CandidateProfile } from '../models/profile.ts';
import type { ResumeDocument } from '../models/resume.ts';
import type { User } from '../models/user.ts';


export const SEED_USERS: Record<string, User> = {
  'aarav-sharma': {
    id: 'user_aarav_01',
    email: 'aarav.sharma@iitd.ac.in',
    name: 'Aarav Sharma',
    role: 'jobseeker',
    college: 'IIT Delhi',
    gradYear: 2026,
    plan: 'pro',
    createdAt: '2025-08-15T10:00:00.000Z',
    emailVerified: true,
  },
  'priya-patel': {
    id: 'user_priya_02',
    email: 'priya.patel@pilani.bits-pilani.ac.in',
    name: 'Priya Patel',
    role: 'jobseeker',
    college: 'BITS Pilani',
    gradYear: 2025,
    plan: 'free',
    createdAt: '2025-09-01T12:00:00.000Z',
    emailVerified: true,
  },
  'admin-user': {
    id: 'user_admin_00',
    email: 'admin@rjobs.dev',
    name: 'Platform Operator',
    role: 'admin',
    plan: 'pro',
    createdAt: '2025-01-01T00:00:00.000Z',
    emailVerified: true,
  },
};

export const SEED_PROFILES: Record<string, CandidateProfile> = {
  'user_aarav_01': {
    userId: 'user_aarav_01',
    headline: 'Pre-final Year B.Tech CSE @ IIT Delhi | Ex-Swiggy SDE Intern | Distributed Systems & High-Throughput Services',
    phone: '+91 98765 43210',
    location: 'New Delhi / Bengaluru, India',
    degree: 'B.Tech in Computer Science and Engineering',
    college: 'Indian Institute of Technology (IIT) Delhi',
    graduationYear: 2026,
    cgpaOrPercentage: '8.84 / 10 CGPA',
    links: {
      github: 'https://github.com/aarav-sharma-iitd',
      linkedin: 'https://linkedin.com/in/aarav-sharma-dev',
      portfolio: 'https://aaravsharma.dev',
      leetcode: 'https://leetcode.com/aarav_codes',
      codeforces: 'https://codeforces.com/profile/aarav_cf',
    },
    targetRoles: ['Software Development Engineer Intern', 'Backend Engineer', 'Systems Engineer'],
    targetLocations: ['Bengaluru', 'Hyderabad', 'Gurugram', 'Remote'],
    experienceLevel: 'internship',
    noticePeriodDays: 0,
    workAuthorization: 'india_citizen',
    preferences: {
      minStipendPerMonthInr: 60000,
      expectedCtcInrLpa: 22,
      remoteAllowed: true,
      jobAlertsEnabled: true,
      alertFrequency: 'instant',
    },
  },
  'user_priya_02': {
    userId: 'user_priya_02',
    headline: '2025 Graduate @ BITS Pilani | Applied ML & Computer Vision | Research Intern @ IISc Bangalore',
    phone: '+91 91234 56789',
    location: 'Bengaluru / Pune, India',
    degree: 'B.E. in Electronics & Communication (Minor in Data Science)',
    college: 'BITS Pilani',
    graduationYear: 2025,
    cgpaOrPercentage: '8.62 / 10 CGPA',
    links: {
      github: 'https://github.com/priyapatel-ml',
      linkedin: 'https://linkedin.com/in/priya-patel-bits',
      portfolio: 'https://priyapatel.ai',
    },
    targetRoles: ['AI/ML Engineer Intern', 'Data Science Associate', 'GenAI Engineer'],
    targetLocations: ['Bengaluru', 'Pune', 'Hyderabad'],
    experienceLevel: 'fresher',
    noticePeriodDays: 15,
    workAuthorization: 'india_citizen',
    preferences: {
      minStipendPerMonthInr: 50000,
      expectedCtcInrLpa: 18,
      remoteAllowed: true,
      jobAlertsEnabled: true,
      alertFrequency: 'daily',
    },
  },
};

export const SEED_MASTER_RESUME: ResumeDocument = {
  id: 'resume_master_aarav',
  userId: 'user_aarav_01',
  title: 'Master Technical Resume 2026',
  templateId: 'classic-single',
  isMaster: true,
  atsScore: 94,
  createdAt: '2025-08-20T10:00:00.000Z',
  updatedAt: '2026-10-15T14:30:00.000Z',
  data: {
    schemaVersion: '1.0.0',
    basics: {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@iitd.ac.in',
      phone: '+91 98765 43210',
      location: 'New Delhi, India',
      website: 'https://aaravsharma.dev',
      linkedin: 'https://linkedin.com/in/aarav-sharma-dev',
      github: 'https://github.com/aarav-sharma-iitd',
      leetcode: 'https://leetcode.com/aarav_codes',
    },
    summary:
      'Computer Science undergraduate at IIT Delhi with proven experience designing fault-tolerant backend microservices and distributed storage systems. Incoming candidate for SDE internship and graduate roles.',
    education: [
      {
        id: 'edu_1',
        institution: 'Indian Institute of Technology (IIT) Delhi',
        degree: 'Bachelor of Technology',
        fieldOfStudy: 'Computer Science and Engineering',
        location: 'New Delhi, India',
        startDate: '2022',
        endDate: '2026',
        grade: '8.84 / 10 CGPA',
        highlights: [
          'Relevant Coursework: Distributed Systems, Operating Systems, Computer Networks, Database Internals, Algorithms.',
          'Recipient of Institute Merit Scholarship (top 5% of department cohort).',
        ],
      },
    ],
    experience: [
      {
        id: 'exp_1',
        company: 'Swiggy',
        position: 'Software Development Engineer Intern',
        location: 'Bengaluru, India',
        startDate: 'May 2025',
        endDate: 'July 2025',
        isCurrent: false,
        bullets: [
          'Engineered an event-driven inventory reconciliation pipeline in Go and Apache Kafka, processing 1.8M events/day with 99.98% delivery reliability.',
          'Optimized PostgreSQL query plans and added Redis cluster caching, reducing p99 latency from 240ms to 42ms for partner store catalog lookup.',
          'Designed stress-testing benchmarks using Locust, discovering and fixing a memory leak in the WebSocket order-tracking worker pool.',
        ],
        techStack: ['Go', 'PostgreSQL', 'Redis', 'Apache Kafka', 'Docker', 'Kubernetes'],
      },
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'ChronoKV: Distributed Raft-based Key-Value Store',
        subtitle: 'Go, Raft Consensus, gRPC, Protobuf',
        github: 'https://github.com/aarav-sharma-iitd/chronokv',
        bullets: [
          'Implemented Raft consensus algorithm from scratch in Go supporting leader election, log replication, and dynamic cluster membership changes.',
          'Benchmarked cluster with Jepsen tests; guaranteed linearizable consistency under 33% node network partitions with under 80ms leader failover.',
          'Built custom write-ahead logging (WAL) engine with snappy compression, yielding 4.2x throughput increase over naive disk sync.',
        ],
        technologies: ['Go', 'gRPC', 'Protobuf', 'Distributed Consensus', 'Linux'],
      },
      {
        id: 'proj_2',
        title: 'L2 Order Book Matching Engine',
        subtitle: 'C++20, Lock-free Ring Buffers, AVX2 SIMD',
        github: 'https://github.com/aarav-sharma-iitd/l2-matching-engine',
        bullets: [
          'Built an ultra-low latency continuous limit order book in C++20 using cache-aligned memory pools and lock-free SPSC ring buffers.',
          'Benchmarked with synthetic market data feeds, achieving median tick-to-trade latency of 480 nanoseconds on AMD Ryzen 9.',
        ],
        technologies: ['C++20', 'Low Latency', 'Lock-Free Data Structures', 'Linux Perf'],
      },
    ],
    skills: [
      {
        id: 'skill_1',
        categoryName: 'Programming Languages',
        skills: ['C++', 'Go', 'Python', 'TypeScript', 'Java', 'SQL'],
      },
      {
        id: 'skill_2',
        categoryName: 'Systems & Backend',
        skills: ['Distributed Systems', 'gRPC', 'Kafka', 'Redis', 'PostgreSQL', 'Docker', 'Linux', 'Git'],
      },
      {
        id: 'skill_3',
        categoryName: 'Core Competencies',
        skills: ['Data Structures & Algorithms', 'Concurrency & Multithreading', 'Low-Latency Design', 'Microservices'],
      },
    ],
    achievements: [
      {
        id: 'ach_1',
        title: 'LeetCode Guardian (Rating 2140+)',
        description: 'Ranked in the top 1.2% globally across 15+ rated contests with 850+ problems solved.',
      },
      {
        id: 'ach_2',
        title: 'ACM ICPC Regionalist 2024 (Amritapuri)',
        description: 'Team ranked 28th out of 450+ qualifying university teams in India.',
      },
    ],
    certifications: [
      'AWS Certified Cloud Practitioner (2024)',
    ],
    sectionOrder: ['education', 'experience', 'projects', 'skills', 'achievements', 'certifications'],
  },
};
