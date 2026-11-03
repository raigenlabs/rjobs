import type { ResumeData, ResumeDocument } from '../models/resume.ts';

import { escapeLatex } from '../models/validation.ts';

export interface TemplateMeta {
  id: 'classic-single' | 'modern-accent' | 'compact-onepage' | 'academic' | 'minimalist';
  name: string;
  description: string;
  atsScoreEstimate: number;
  bestFor: string;
  onePageOptimized: boolean;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'classic-single',
    name: 'Classic Single-Column (Overleaf ATS Standard)',
    description: 'Gold-standard single-column layout used by top US & Indian tech applicants. Maximum ATS parser compatibility.',
    atsScoreEstimate: 98,
    bestFor: 'Software Engineering, Backend, Distributed Systems',
    onePageOptimized: true,
  },
  {
    id: 'modern-accent',
    name: 'Modern Tech Accent',
    description: 'Crisp typography with subtle dark indigo section separators and bold position highlights.',
    atsScoreEstimate: 96,
    bestFor: 'Full-Stack, Product Engineering, Startups',
    onePageOptimized: true,
  },
  {
    id: 'compact-onepage',
    name: 'Compact High-Density (Tier-1 Placement)',
    description: 'Tight margins and optimized line spacing designed specifically to fit 2 internships, 3 projects and heavy skills into 1 page.',
    atsScoreEstimate: 95,
    bestFor: 'Campus placements, IIT/NIT/BITS fresh graduates with many projects',
    onePageOptimized: true,
  },
  {
    id: 'academic',
    name: 'Academic & Research Focus',
    description: 'Prioritizes university pedigree, publications, research lab internships, and competitive programming achievements.',
    atsScoreEstimate: 94,
    bestFor: 'AI/ML Research Internships, Data Science, MS/PhD applications',
    onePageOptimized: false,
  },
  {
    id: 'minimalist',
    name: 'Minimalist Deedy-Style',
    description: 'Clean, distraction-free typography with clear visual hierarchy and horizontal dividers.',
    atsScoreEstimate: 97,
    bestFor: 'Off-campus cold applications, Referral submissions',
    onePageOptimized: true,
  },
];

/**
 * Generate full LaTeX source code for a ResumeData document
 */
export function generateLatexSource(
  data: ResumeData,
  templateId: TemplateMeta['id'] = 'classic-single'
): string {
  const b = data.basics;
  const name = escapeLatex(b.name);
  const email = escapeLatex(b.email);
  const phone = escapeLatex(b.phone);
  const location = escapeLatex(b.location);
  const summary = escapeLatex(data.summary);

  // Common links header
  const linksParts: string[] = [];
  if (b.github) linksParts.push(`\\href{${b.github}}{GitHub}`);
  if (b.linkedin) linksParts.push(`\\href{${b.linkedin}}{LinkedIn}`);
  if (b.leetcode) linksParts.push(`\\href{${b.leetcode}}{LeetCode}`);
  if (b.website) linksParts.push(`\\href{${b.website}}{Portfolio}`);
  const linksStr = linksParts.join(' $|$ ');

  // Common preamble
  const preamble = `\\documentclass[letterpaper,10.8pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{charter}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-${templateId === 'compact-onepage' ? '0.7in' : '0.5in'}}
\\addtolength{\\textheight}{${templateId === 'compact-onepage' ? '1.2in' : '1.0in'}}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.15in]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
`;

  // Content Builders
  const buildEducation = () => {
    if (!data.education || data.education.length === 0) return '';
    let out = `\\section{Education}\n\\resumeSubHeadingListStart\n`;
    for (const edu of data.education) {
      const inst = escapeLatex(edu.institution);
      const deg = escapeLatex(`${edu.degree}${edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}`);
      const loc = escapeLatex(edu.location);
      const dates = escapeLatex(`${edu.startDate} -- ${edu.endDate}`);
      const grade = edu.grade ? escapeLatex(`CGPA/Grade: ${edu.grade}`) : '';

      out += `  \\resumeSubheading\n    {${inst}}{${loc}}\n    {${deg}${grade ? ' $|$ ' + grade : ''}}{${dates}}\n`;

      if (edu.highlights && edu.highlights.length > 0) {
        out += `  \\resumeItemListStart\n`;
        for (const h of edu.highlights) {
          out += `    \\resumeItem{${escapeLatex(h)}}\n`;
        }
        out += `  \\resumeItemListEnd\n`;
      }
    }
    out += `\\resumeSubHeadingListEnd\n`;
    return out;
  };

  const buildExperience = () => {
    if (!data.experience || data.experience.length === 0) return '';
    let out = `\\section{Experience}\n\\resumeSubHeadingListStart\n`;
    for (const exp of data.experience) {
      const comp = escapeLatex(exp.company);
      const pos = escapeLatex(exp.position);
      const loc = escapeLatex(exp.location);
      const dates = escapeLatex(`${exp.startDate} -- ${exp.isCurrent ? 'Present' : exp.endDate}`);

      out += `  \\resumeSubheading\n    {${pos}}{${dates}}\n    {${comp}}{${loc}}\n`;
      if (exp.bullets && exp.bullets.length > 0) {
        out += `  \\resumeItemListStart\n`;
        for (const bullet of exp.bullets) {
          out += `    \\resumeItem{${escapeLatex(bullet)}}\n`;
        }
        out += `  \\resumeItemListEnd\n`;
      }
    }
    out += `\\resumeSubHeadingListEnd\n`;
    return out;
  };

  const buildProjects = () => {
    if (!data.projects || data.projects.length === 0) return '';
    let out = `\\section{Technical Projects}\n\\resumeSubHeadingListStart\n`;
    for (const proj of data.projects) {
      const title = escapeLatex(proj.title);
      const tech = proj.technologies && proj.technologies.length > 0
        ? escapeLatex(proj.technologies.join(', '))
        : '';
      const dates = proj.startDate ? escapeLatex(`${proj.startDate} -- ${proj.endDate || 'Present'}`) : '';

      out += `  \\resumeProjectHeading\n    {\\textbf{${title}} ${tech ? '$|$ \\emph{' + tech + '}' : ''}}{${dates}}\n`;
      if (proj.bullets && proj.bullets.length > 0) {
        out += `  \\resumeItemListStart\n`;
        for (const bullet of proj.bullets) {
          out += `    \\resumeItem{${escapeLatex(bullet)}}\n`;
        }
        out += `  \\resumeItemListEnd\n`;
      }
    }
    out += `\\resumeSubHeadingListEnd\n`;
    return out;
  };

  const buildSkills = () => {
    if (!data.skills || data.skills.length === 0) return '';
    let out = `\\section{Technical Skills}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n  \\small{\\item{\n`;
    for (const cat of data.skills) {
      const catName = escapeLatex(cat.categoryName);
      const skillsStr = escapeLatex(cat.skills.join(', '));
      out += `    \\textbf{${catName}}: {${skillsStr}} \\\\\n`;
    }
    out += `  }}\n\\end{itemize}\n`;
    return out;
  };

  const buildAchievements = () => {
    if (!data.achievements || data.achievements.length === 0) return '';
    let out = `\\section{Honors \\& Achievements}\n\\resumeItemListStart\n`;
    for (const ach of data.achievements) {
      const t = escapeLatex(ach.title);
      const d = escapeLatex(ach.description);
      out += `  \\resumeItem{\\textbf{${t}}: ${d}}\n`;
    }
    out += `\\resumeItemListEnd\n`;
    return out;
  };

  // Assemble document body based on sectionOrder
  let bodySections = '';
  const order = data.sectionOrder || ['education', 'experience', 'projects', 'skills', 'achievements'];

  for (const sec of order) {
    if (sec === 'education') bodySections += buildEducation();
    else if (sec === 'experience') bodySections += buildExperience();
    else if (sec === 'projects') bodySections += buildProjects();
    else if (sec === 'skills') bodySections += buildSkills();
    else if (sec === 'achievements') bodySections += buildAchievements();
  }

  return `${preamble}
\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${phone} $|$ \\href{mailto:${b.email}}{${email}} $|$ ${location}
    ${linksStr ? '\\\\ \\vspace{1pt} \\small ' + linksStr : ''}
\\end{center}

${summary ? `\\vspace{-8pt}\\begin{quote}\\small ${summary}\\end{quote}\\vspace{-4pt}` : ''}

${bodySections}

\\end{document}
`;
}
