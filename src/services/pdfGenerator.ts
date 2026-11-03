import { jsPDF } from 'jspdf';
import type { ResumeData } from '../models/resume.ts';


export interface PageFitEstimate {
  estimatedPages: number;
  isOverOnePage: boolean;
  totalLines: number;
  recommendations: string[];
}

/**
 * Calculates page fit estimate to warn candidates before PDF compilation.
 */
export function calculatePageFit(data: ResumeData): PageFitEstimate {
  let lineCount = 4; // Header & contact

  if (data.summary) {
    lineCount += Math.ceil(data.summary.length / 90) + 1;
  }

  // Education
  lineCount += 2; // Section header
  data.education.forEach((edu) => {
    lineCount += 2;
    if (edu.highlights) lineCount += edu.highlights.length;
  });

  // Experience
  lineCount += 2; // Section header
  data.experience.forEach((exp) => {
    lineCount += 2;
    exp.bullets.forEach((b) => {
      lineCount += Math.max(1, Math.ceil(b.length / 95));
    });
  });

  // Projects
  lineCount += 2;
  data.projects.forEach((proj) => {
    lineCount += 2;
    proj.bullets.forEach((b) => {
      lineCount += Math.max(1, Math.ceil(b.length / 95));
    });
  });

  // Skills
  lineCount += 2;
  data.skills.forEach(() => {
    lineCount += 1.2;
  });

  // Achievements
  if (data.achievements?.length) {
    lineCount += 2;
    lineCount += data.achievements.length;
  }

  // A standard 1-page ATS resume with 10pt/11pt font holds ~48-52 lines
  const MAX_LINES_ONE_PAGE = 52;
  const estimatedPages = Number((lineCount / MAX_LINES_ONE_PAGE).toFixed(2));
  const isOverOnePage = lineCount > MAX_LINES_ONE_PAGE;

  const recommendations: string[] = [];
  if (isOverOnePage) {
    const extraLines = Math.ceil(lineCount - MAX_LINES_ONE_PAGE);
    recommendations.push(
      `Content extends ~${extraLines} lines onto page 2. Tighten 2-3 bullet points to guarantee single-page ATS compliance.`
    );
    if (data.summary && data.summary.length > 200) {
      recommendations.push('Shorten the summary statement to 1-2 concise lines.');
    }
  }

  return {
    estimatedPages: Math.max(1, estimatedPages),
    isOverOnePage,
    totalLines: Math.round(lineCount),
    recommendations,
  };
}

/**
 * Generates an ATS-compliant PDF document using jsPDF
 */
export function generateResumePdfBlob(
  data: ResumeData,
  templateId: 'classic-single' | 'modern-accent' | 'compact-onepage' | 'academic' | 'minimalist' = 'classic-single'
): Blob {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = templateId === 'compact-onepage' ? 32 : 36;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin + 10;

  const checkPageOverflow = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }
  };

  // Color Palette
  const isModern = templateId === 'modern-accent';
  const primaryColor = isModern ? [30, 41, 59] : [0, 0, 0];
  const accentColor = isModern ? [79, 70, 229] : [0, 0, 0];
  const mutedColor = [80, 80, 80];

  // 1. Header (Name & Contact)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isModern ? 18 : 20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.basics.name, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 16;

  // Contact info line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  const contactText = `${data.basics.phone}  |  ${data.basics.email}  |  ${data.basics.location}`;
  doc.text(contactText, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 12;

  // Links line
  const links: string[] = [];
  if (data.basics.github) links.push(`GitHub: ${data.basics.github.replace('https://', '')}`);
  if (data.basics.linkedin) links.push(`LinkedIn: ${data.basics.linkedin.replace('https://', '')}`);
  if (data.basics.leetcode) links.push(`LeetCode: ${data.basics.leetcode.replace('https://', '')}`);
  if (data.basics.website) links.push(data.basics.website.replace('https://', ''));

  if (links.length > 0) {
    doc.text(links.join('   |   '), pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 14;
  }

  // Summary
  if (data.summary) {
    checkPageOverflow(30);
    cursorY += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    const splitSummary = doc.splitTextToSize(data.summary, contentWidth);
    doc.text(splitSummary, margin, cursorY);
    cursorY += splitSummary.length * 10 + 6;
  }

  // Helper to draw section header with horizontal rule
  const drawSectionHeader = (title: string) => {
    checkPageOverflow(26);
    cursorY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(title.toUpperCase(), margin, cursorY);
    cursorY += 4;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.75);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 10;
  };

  // 2. Education Section
  if (data.education && data.education.length > 0) {
    drawSectionHeader('Education');
    data.education.forEach((edu) => {
      checkPageOverflow(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(edu.institution, margin, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(edu.location, pageWidth - margin, cursorY, { align: 'right' });
      cursorY += 11;

      const degreeStr = `${edu.degree}${edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}`;
      doc.setFont('helvetica', 'italic');
      doc.text(degreeStr, margin, cursorY);

      const dateAndGrade = `${edu.startDate} – ${edu.endDate}${edu.grade ? '  |  ' + edu.grade : ''}`;
      doc.text(dateAndGrade, pageWidth - margin, cursorY, { align: 'right' });
      cursorY += 12;

      if (edu.highlights) {
        edu.highlights.forEach((h) => {
          checkPageOverflow(14);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          const bulletLines = doc.splitTextToSize(`•  ${h}`, contentWidth - 10);
          doc.text(bulletLines, margin + 8, cursorY);
          cursorY += bulletLines.length * 10;
        });
      }
    });
  }

  // 3. Experience Section
  if (data.experience && data.experience.length > 0) {
    drawSectionHeader('Experience');
    data.experience.forEach((exp) => {
      checkPageOverflow(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(exp.position, margin, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate}`, pageWidth - margin, cursorY, {
        align: 'right',
      });
      cursorY += 11;

      doc.setFont('helvetica', 'italic');
      doc.text(exp.company, margin, cursorY);
      doc.text(exp.location, pageWidth - margin, cursorY, { align: 'right' });
      cursorY += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      exp.bullets.forEach((b) => {
        const lines = doc.splitTextToSize(b, contentWidth - 18);
        checkPageOverflow(lines.length * 10 + 4);
        doc.text('•', margin + 6, cursorY);
        doc.text(lines, margin + 14, cursorY);
        cursorY += lines.length * 10 + 2;
      });
      cursorY += 2;
    });
  }

  // 4. Technical Projects
  if (data.projects && data.projects.length > 0) {
    drawSectionHeader('Technical Projects');
    data.projects.forEach((proj) => {
      checkPageOverflow(26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(proj.title, margin, cursorY);

      if (proj.technologies?.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(` |  ${proj.technologies.join(', ')}`, margin + doc.getTextWidth(proj.title) + 4, cursorY);
      }

      if (proj.startDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${proj.startDate} – ${proj.endDate || 'Present'}`, pageWidth - margin, cursorY, {
          align: 'right',
        });
      }
      cursorY += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      proj.bullets.forEach((b) => {
        const lines = doc.splitTextToSize(b, contentWidth - 18);
        checkPageOverflow(lines.length * 10 + 4);
        doc.text('•', margin + 6, cursorY);
        doc.text(lines, margin + 14, cursorY);
        cursorY += lines.length * 10 + 2;
      });
      cursorY += 2;
    });
  }

  // 5. Technical Skills
  if (data.skills && data.skills.length > 0) {
    drawSectionHeader('Technical Skills');
    data.skills.forEach((cat) => {
      checkPageOverflow(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      const catPrefix = `${cat.categoryName}: `;
      doc.text(catPrefix, margin, cursorY);

      doc.setFont('helvetica', 'normal');
      const prefixWidth = doc.getTextWidth(catPrefix);
      const skillsStr = cat.skills.join(', ');
      const skillLines = doc.splitTextToSize(skillsStr, contentWidth - prefixWidth);
      doc.text(skillLines, margin + prefixWidth, cursorY);
      cursorY += skillLines.length * 10 + 2;
    });
  }

  // 6. Achievements
  if (data.achievements && data.achievements.length > 0) {
    drawSectionHeader('Honors & Achievements');
    data.achievements.forEach((ach) => {
      checkPageOverflow(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      const titlePrefix = `•  ${ach.title}: `;
      doc.text(titlePrefix, margin + 4, cursorY);

      doc.setFont('helvetica', 'normal');
      const prefixWidth = doc.getTextWidth(titlePrefix);
      const descLines = doc.splitTextToSize(ach.description, contentWidth - prefixWidth - 4);
      doc.text(descLines, margin + 4 + prefixWidth, cursorY);
      cursorY += descLines.length * 10 + 2;
    });
  }

  return doc.output('blob');
}

/**
 * Initiates direct browser file download for compiled PDF or LaTeX source
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
