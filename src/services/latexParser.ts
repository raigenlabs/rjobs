import type {
  ResumeData,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillCategory,
  AchievementEntry,
} from '../models/resume.ts';

/**
 * Extracts balanced curly-braced arguments from a command like \resumeItem{...}
 */
export function extractBalancedCommands(text: string, commandName: string): string[] {
  const results: string[] = [];
  const target = `\\${commandName}{`;
  let idx = 0;

  while ((idx = text.indexOf(target, idx)) !== -1) {
    let depth = 1;
    const start = idx + target.length;
    let i = start;
    while (i < text.length && depth > 0) {
      if (text[i] === '{' && text[i - 1] !== '\\') depth++;
      else if (text[i] === '}' && text[i - 1] !== '\\') depth--;
      i++;
    }
    if (depth === 0) {
      results.push(text.substring(start, i - 1));
      idx = i;
    } else {
      idx += target.length;
    }
  }

  return results;
}

/**
 * Un-escapes LaTeX special characters back to readable plain text
 */
export function unescapeLatex(text: string): string {
  if (!text) return '';
  let out = text
    .replace(/\\vspace\{[^}]+\}/g, '')
    .replace(/\\hspace\{[^}]+\}/g, '')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/--/g, '–');

  // Strip LaTeX formatting commands iteratively
  for (let pass = 0; pass < 3; pass++) {
    out = out
      .replace(/\\textbf\{([^}]+)\}/g, '$1')
      .replace(/\\textit\{([^}]+)\}/g, '$1')
      .replace(/\\emph\{([^}]+)\}/g, '$1')
      .replace(/\\small\{([^}]+)\}/g, '$1')
      .replace(/\\large\{([^}]+)\}/g, '$1')
      .replace(/\\Huge\{([^}]+)\}/g, '$1');
  }

  return out
    .replace(/\\scshape\b/g, '')
    .replace(/\\Huge\b/g, '')
    .replace(/\\large\b/g, '')
    .replace(/\\small\b/g, '')
    .replace(/\\textbf\{/g, '')
    .replace(/\\emph\{/g, '')
    .replace(/\$\|\$/g, '|')
    .trim();
}

/**
 * Parses LaTeX source code back into a structured ResumeData object.
 * If fields cannot be extracted, falls back gracefully to fallbackData.
 */
export function parseLatexToResumeData(
  latex: string,
  fallbackData?: ResumeData
): ResumeData {
  const result: ResumeData = fallbackData
    ? JSON.parse(JSON.stringify(fallbackData))
    : {
        schemaVersion: '1.0.0',
        basics: {
          name: 'Candidate Name',
          email: 'candidate@example.com',
          phone: '+91 98765 43210',
          location: 'Bengaluru, India',
        },
        summary: '',
        education: [],
        experience: [],
        projects: [],
        skills: [],
        achievements: [],
        certifications: [],
        sectionOrder: ['education', 'experience', 'projects', 'skills', 'achievements'],
      };

  if (!latex || typeof latex !== 'string') return result;

  // 1. Extract Name
  const nameMatch = latex.match(/\\textbf\{\\(?:Huge|huge|LARGE|Large|large)(?:\s+\\scshape)?\s+([^\\}]+)\}/i)
    || latex.match(/\\begin\{center\}[\s\S]*?\\textbf\{(?:\\[a-zA-Z]+\s*)*([^\\}]+)\}/i)
    || latex.match(/\\textbf\{([^}]+)\}\s*\\\\\s*(?:\\vspace)?/i);
  if (nameMatch && nameMatch[1].trim()) {
    const rawExtracted = unescapeLatex(nameMatch[1].trim());
    if (rawExtracted && !rawExtracted.includes('\\')) {
      result.basics.name = rawExtracted;
    }
  }

  // 2. Extract Phone, Email, Location
  const emailMatch = latex.match(/\\href\{mailto:([^}]+)\}/i)
    || latex.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.basics.email = (emailMatch[1] || emailMatch[0]).trim();
  }

  const phoneMatch = latex.match(/(?:\+91[\s\-]*)?[6789]\d{4}[\s\-]?\d{5}/)
    || latex.match(/\+?\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,5}[\s\-]?\d{3,5}/);
  if (phoneMatch) {
    result.basics.phone = phoneMatch[0].trim();
  }

  // Links
  const githubMatch = latex.match(/\\href\{([^}]+)\}\{GitHub\}/i);
  if (githubMatch) result.basics.github = githubMatch[1].trim();

  const linkedinMatch = latex.match(/\\href\{([^}]+)\}\{LinkedIn\}/i);
  if (linkedinMatch) result.basics.linkedin = linkedinMatch[1].trim();

  const leetcodeMatch = latex.match(/\\href\{([^}]+)\}\{LeetCode\}/i);
  if (leetcodeMatch) result.basics.leetcode = leetcodeMatch[1].trim();

  const websiteMatch = latex.match(/\\href\{([^}]+)\}\{Portfolio\}/i);
  if (websiteMatch) result.basics.website = websiteMatch[1].trim();

  // Location from header block (strictly from contact line with phone or email, NOT links line)
  const centerBlock = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/i);
  if (centerBlock) {
    const lines = centerBlock[1].split('\\\\');
    for (const l of lines) {
      if ((l.includes('$|$') || l.includes('|')) && (l.includes('@') || l.includes('mailto') || /\d{5}/.test(l))) {
        const parts = l.split(/\$\|\$|\|/).map((s) => unescapeLatex(s.replace(/\\small/g, '').trim()));
        for (const p of parts) {
          const clean = p.trim();
          if (
            clean &&
            !clean.includes('@') &&
            !clean.includes('href') &&
            !clean.includes('mailto') &&
            !/\d{5,}/.test(clean) &&
            !clean.toLowerCase().includes('github') &&
            !clean.toLowerCase().includes('linkedin') &&
            !clean.toLowerCase().includes('leetcode') &&
            !clean.toLowerCase().includes('portfolio')
          ) {
            result.basics.location = clean;
            break;
          }
        }
      }
    }
  }

  // 3. Extract Summary
  const summaryMatch = latex.match(/\\begin\{quote\}\s*(?:\\small\s*)?([\s\S]*?)\\end\{quote\}/i)
    || latex.match(/\\section\{(?:Professional\s+)?Summary\}([\s\S]*?)(?=\\section\{|\\end\{document\}|$)/i);
  if (summaryMatch) {
    result.summary = unescapeLatex(summaryMatch[1].trim());
  }

  // Split document into sections
  const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|\\end\{document\}|$)/gi;
  let match: RegExpExecArray | null;

  const parsedEducations: EducationEntry[] = [];
  const parsedExperiences: ExperienceEntry[] = [];
  const parsedProjects: ProjectEntry[] = [];
  const parsedSkills: SkillCategory[] = [];
  const parsedAchievements: AchievementEntry[] = [];

  while ((match = sectionRegex.exec(latex)) !== null) {
    const rawHeading = match[1].toLowerCase().trim();
    const content = match[2];

    // --- EDUCATION ---
    if (rawHeading.includes('education')) {
      const subheadings = content.split(/\\resumeSubheading/g).slice(1);
      for (const sub of subheadings) {
        const args = extractLatexArgs(sub, 4);
        if (args.length >= 4) {
          const inst = unescapeLatex(args[0]);
          const loc = unescapeLatex(args[1]);
          const degFull = unescapeLatex(args[2]);
          const dates = unescapeLatex(args[3]);

          let degree = degFull;
          let grade = '';
          if (degFull.includes('|')) {
            const split = degFull.split('|').map((s) => s.trim());
            degree = split[0];
            grade = split[1] || '';
          }

          const rawHighlights = extractBalancedCommands(sub, 'resumeItem');
          const highlights = rawHighlights.map((h) => unescapeLatex(h));

          const [startDate, endDate] = dates.split(/[–—-]/).map((d) => d.trim());

          parsedEducations.push({
            id: `edu_parsed_${parsedEducations.length + 1}`,
            institution: inst || 'University',
            degree: degree || 'Bachelor of Technology',
            fieldOfStudy: '',
            location: loc || 'India',
            startDate: startDate || '2022',
            endDate: endDate || '2026',
            grade,
            highlights: highlights.length > 0 ? highlights : undefined,
          });
        }
      }
    }

    // --- EXPERIENCE ---
    else if (rawHeading.includes('experience') || rawHeading.includes('work')) {
      const subheadings = content.split(/\\resumeSubheading/g).slice(1);
      for (const sub of subheadings) {
        const args = extractLatexArgs(sub, 4);
        if (args.length >= 4) {
          const pos = unescapeLatex(args[0]);
          const dates = unescapeLatex(args[1]);
          const comp = unescapeLatex(args[2]);
          const loc = unescapeLatex(args[3]);

          const rawBullets = extractBalancedCommands(sub, 'resumeItem');
          const bullets = rawBullets.map((b) => unescapeLatex(b));

          const [startDate, endDate] = dates.split(/[–—-]/).map((d) => d.trim());
          const isCurrent = (endDate || '').toLowerCase().includes('present');

          parsedExperiences.push({
            id: `exp_parsed_${parsedExperiences.length + 1}`,
            company: comp || 'Tech Company',
            position: pos || 'Software Engineer Intern',
            location: loc || 'Bengaluru, India',
            startDate: startDate || 'May 2025',
            endDate: endDate || 'Present',
            isCurrent,
            bullets: bullets.length > 0 ? bullets : ['Engineered scalable backend services.'],
          });
        }
      }
    }

    // --- PROJECTS ---
    else if (rawHeading.includes('project')) {
      const headings = content.split(/\\resumeProjectHeading/g).slice(1);
      for (const h of headings) {
        const args = extractLatexArgs(h, 2);
        if (args.length >= 2) {
          const titleTech = args[0];
          const dates = unescapeLatex(args[1]);

          let title = '';
          let technologies: string[] = [];

          const titleMatch = titleTech.match(/\\textbf\{([^}]+)\}/);
          if (titleMatch) {
            title = unescapeLatex(titleMatch[1]);
          } else {
            title = unescapeLatex(titleTech.split('$|$')[0] || 'Project');
          }

          const techMatch = titleTech.match(/\\emph\{([^}]+)\}/);
          if (techMatch) {
            technologies = unescapeLatex(techMatch[1])
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
          }

          const rawBullets = extractBalancedCommands(h, 'resumeItem');
          const bullets = rawBullets.map((b) => unescapeLatex(b));

          const [startDate, endDate] = dates.split(/[–—-]/).map((d) => d.trim());

          parsedProjects.push({
            id: `proj_parsed_${parsedProjects.length + 1}`,
            title: title || 'Software Engineering Project',
            subtitle: technologies.join(', '),
            startDate: startDate || '2025',
            endDate: endDate || 'Present',
            technologies: technologies.length > 0 ? technologies : ['Go', 'Docker'],
            bullets: bullets.length > 0 ? bullets : ['Developed high-throughput application.'],
          });
        }
      }
    }

    // --- SKILLS ---
    else if (rawHeading.includes('skill')) {
      const skillLines = content.split(/\\\\|\n/);
      for (const sl of skillLines) {
        const catMatch = sl.match(/\\textbf\{([^}]+)\}:\s*\{?([^\\}]+)\}?/);
        if (catMatch) {
          const categoryName = unescapeLatex(catMatch[1]);
          const skills = unescapeLatex(catMatch[2])
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (skills.length > 0) {
            parsedSkills.push({
              id: `skill_parsed_${parsedSkills.length + 1}`,
              categoryName,
              skills,
            });
          }
        }
      }
    }

    // --- ACHIEVEMENTS ---
    else if (rawHeading.includes('achievement') || rawHeading.includes('honor')) {
      const rawItems = extractBalancedCommands(content, 'resumeItem');
      for (const rawItem of rawItems) {
        const cleanItem = unescapeLatex(rawItem);
        let title = 'Honors';
        let desc = cleanItem;

        if (cleanItem.includes(':')) {
          const colonIdx = cleanItem.indexOf(':');
          title = cleanItem.substring(0, colonIdx).trim();
          desc = cleanItem.substring(colonIdx + 1).trim();
        }

        parsedAchievements.push({
          id: `ach_parsed_${parsedAchievements.length + 1}`,
          title: title || 'Honors & Achievements',
          description: desc,
        });
      }
    }
  }

  if (/\\section\{(?:Technical\s+)?Projects\}/i.test(latex)) {
    result.projects = parsedProjects;
  } else if (parsedProjects.length > 0) {
    result.projects = parsedProjects;
  }

  if (/\\section\{Education\}/i.test(latex)) {
    result.education = parsedEducations;
  } else if (parsedEducations.length > 0) {
    result.education = parsedEducations;
  }

  if (/\\section\{(?:Work\s+)?Experience\}/i.test(latex)) {
    result.experience = parsedExperiences;
  } else if (parsedExperiences.length > 0) {
    result.experience = parsedExperiences;
  }

  if (/\\section\{(?:Technical\s+)?Skills\}/i.test(latex)) {
    result.skills = parsedSkills;
  } else if (parsedSkills.length > 0) {
    result.skills = parsedSkills;
  }

  if (/\\section\{(?:Honors|Achievements)/i.test(latex)) {
    result.achievements = parsedAchievements;
  } else if (parsedAchievements.length > 0) {
    result.achievements = parsedAchievements;
  }

  return result;
}

/**
 * Extracts balanced curly-braced arguments from a LaTeX string
 */
function extractLatexArgs(str: string, count: number): string[] {
  const args: string[] = [];
  let i = 0;

  while (i < str.length && args.length < count) {
    if (str[i] === '{') {
      let depth = 1;
      const start = i + 1;
      i++;
      while (i < str.length && depth > 0) {
        if (str[i] === '{' && str[i - 1] !== '\\') depth++;
        else if (str[i] === '}' && str[i - 1] !== '\\') depth--;
        i++;
      }
      args.push(str.substring(start, i - 1));
    } else {
      i++;
    }
  }

  return args;
}
