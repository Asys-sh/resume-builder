import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import type { ResumeData } from '@/stores/builder'

export const generateDocx = async (data: ResumeData) => {
  const { contactInfo, experiences, education, skills, projects, summary } = data

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: contactInfo.fullName,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: contactInfo.headline,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: contactInfo.email + ' | ', break: 1 }),
              new TextRun({ text: contactInfo.phone || '' }),
              new TextRun({ text: contactInfo.linkedin ? ' | ' + contactInfo.linkedin : '' }),
              new TextRun({ text: contactInfo.website ? ' | ' + contactInfo.website : '' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Summary
          ...(summary
            ? [
                new Paragraph({
                  text: 'Professional Summary',
                  heading: HeadingLevel.HEADING_2,
                  thematicBreak: true,
                }),
                new Paragraph({
                  text: summary,
                  spacing: { after: 300 },
                }),
              ]
            : []),

          // Experience
          ...(experiences.length > 0
            ? [
                new Paragraph({
                  text: 'Experience',
                  heading: HeadingLevel.HEADING_2,
                  thematicBreak: true,
                }),
                ...experiences.flatMap((exp) => [
                  new Paragraph({
                    children: [
                      new TextRun({ text: exp.role, bold: true, size: 24 }),
                      new TextRun({ text: ` at ${exp.company}`, bold: true }),
                      new TextRun({
                        text: `  (${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'})`,
                        italics: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    text: exp.description || '',
                    spacing: { after: 200 },
                  }),
                ]),
              ]
            : []),

          // Education
          ...(education.length > 0
            ? [
                new Paragraph({
                  text: 'Education',
                  heading: HeadingLevel.HEADING_2,
                  thematicBreak: true,
                  spacing: { before: 300 },
                }),
                ...education.flatMap((edu) => [
                  new Paragraph({
                    children: [
                      new TextRun({ text: edu.school, bold: true, size: 24 }),
                      new TextRun({ text: ` - ${edu.degree} in ${edu.fieldOfStudy}` }),
                      new TextRun({
                        text: `  (${edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'})`,
                        italics: true,
                      }),
                    ],
                  }),
                ]),
              ]
            : []),

          // Skills
          ...(skills.length > 0
            ? [
                new Paragraph({
                  text: 'Skills',
                  heading: HeadingLevel.HEADING_2,
                  thematicBreak: true,
                  spacing: { before: 300 },
                }),
                new Paragraph({
                  text: skills.map((s) => s.name).join(', '),
                }),
              ]
            : []),

          // Projects
          ...(projects.length > 0
            ? [
                new Paragraph({
                  text: 'Projects',
                  heading: HeadingLevel.HEADING_2,
                  thematicBreak: true,
                  spacing: { before: 300 },
                }),
                ...projects.flatMap((proj) => [
                  new Paragraph({
                    children: [
                      new TextRun({ text: proj.title, bold: true, size: 24 }),
                      ...(proj.link
                        ? [new TextRun({ text: ` (${proj.link})`, italics: true })]
                        : []),
                    ],
                  }),
                  new Paragraph({
                    text: proj.description || '',
                  }),
                  ...(proj.technologies
                    ? [
                        new Paragraph({
                          text: `Technologies: ${proj.technologies}`,
                          spacing: { after: 200 },
                        }),
                      ]
                    : []),
                ]),
              ]
            : []),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${contactInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`)
}
