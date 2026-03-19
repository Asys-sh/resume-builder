import type { ResumeData } from '@/stores/builder'

export interface Template {
  id: string
  name: string
  description: string
  component: React.ComponentType<{ resumeData: ResumeData }>
  previewComponent: React.ReactNode
}

interface TemplateStyleConfig {
  header: {
    container: string
    name: string
    headline: string
    contactRow: string
    linksRow: string
  }
  section: {
    title: string
    container: string
  }
  experience: {
    role: string
    dateRange: string
    company: string
    description: string
  }
  project: {
    title: string
    description: string
    technologies: string
    link: string
  }
  award: {
    name: string
    details: string
  }
  skills: {
    text: string
    label: string
  }
  education: {
    degree: string
    dateRange: string
    school: string
    gpa: string
  }
  layout?: 'single-column' | 'sidebar'
  sidebar?: {
    container: string
    sectionTitle: string
    contactItem: string
    skillItem: string
  }
  mainContent?: {
    container: string
  }
  sidebarSectionLabels?: {
    contact?: string
    skills?: string
    certifications?: string
    languages?: string
  }
}

/** Shared Resume Layout Component */
function BaseResumeLayout({
  resumeData,
  styles,
}: {
  resumeData: ResumeData
  styles: TemplateStyleConfig
}) {
  const {
    contactInfo,
    summary,
    experiences,
    skills,
    education,
    projects,
    certifications,
    languages,
    awards,
  } = resumeData

  const hasSummary = summary.trim().length > 0

  // Sidebar section labels with defaults
  const sidebarLabels = {
    contact: styles.sidebarSectionLabels?.contact ?? 'Contact',
    skills: styles.sidebarSectionLabels?.skills ?? 'Skills',
    certifications: styles.sidebarSectionLabels?.certifications ?? 'Certifications',
    languages: styles.sidebarSectionLabels?.languages ?? 'Languages',
  }

  // Sidebar layout rendering
  if (styles.layout === 'sidebar' && styles.sidebar && styles.mainContent) {
    const sidebarStyles = styles.sidebar
    return (
      <div className="bg-white grid grid-cols-3 gap-0 min-h-full">
        {/* Sidebar (Left Column) */}
        <div className={sidebarStyles.container}>
          {/* Contact Info */}
          <div className="mb-6">
            <h1 className={styles.header.name}>{contactInfo.fullName || 'Your Name'}</h1>
            {contactInfo.headline && (
              <p className={styles.header.headline}>{contactInfo.headline}</p>
            )}
          </div>

          <div className="space-y-6">
            {/* Contact Details */}
            {(contactInfo.phone ||
              contactInfo.email ||
              contactInfo.address ||
              contactInfo.linkedin ||
              contactInfo.website) && (
              <div>
                <h2 className={sidebarStyles.sectionTitle}>{sidebarLabels.contact}</h2>
                <div className="mt-3 space-y-2">
                  {contactInfo.phone && (
                    <div className={sidebarStyles.contactItem}>{contactInfo.phone}</div>
                  )}
                  {contactInfo.email && (
                    <div className={sidebarStyles.contactItem}>{contactInfo.email}</div>
                  )}
                  {contactInfo.address && (
                    <div className={sidebarStyles.contactItem}>{contactInfo.address}</div>
                  )}
                  {contactInfo.linkedin && (
                    <div className={sidebarStyles.contactItem}>
                      <a
                        href={contactInfo.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline break-all"
                      >
                        {contactInfo.linkedin}
                      </a>
                    </div>
                  )}
                  {contactInfo.website && (
                    <div className={sidebarStyles.contactItem}>
                      <a
                        href={contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline break-all"
                      >
                        {contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h2 className={sidebarStyles.sectionTitle}>{sidebarLabels.skills}</h2>
                <div className="mt-3 space-y-1">
                  {skills.map((skill, index) => (
                    <div key={index} className={sidebarStyles.skillItem}>
                      {skill.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <h2 className={sidebarStyles.sectionTitle}>{sidebarLabels.certifications}</h2>
                <div className="mt-3 space-y-1">
                  {certifications.map((cert, index) => (
                    <div key={index} className={sidebarStyles.skillItem}>
                      {cert.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div>
                <h2 className={sidebarStyles.sectionTitle}>{sidebarLabels.languages}</h2>
                <div className="mt-3 space-y-1">
                  {languages.map((lang, index) => (
                    <div key={index} className={sidebarStyles.skillItem}>
                      {lang.name} ({lang.proficiency})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content (Right Column) */}
        <div className={`col-span-2 ${styles.mainContent.container}`}>
          {/* Summary Section */}
          {hasSummary && (
            <section className={styles.section.container}>
              <h2 className={styles.section.title}>Summary</h2>
              <p className="text-sm text-text-main mt-3 leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Experience Section */}
          {experiences.length > 0 && (
            <section className={styles.section.container}>
              <h2 className={styles.section.title}>Experience</h2>
              {experiences.map((exp, index) => {
                const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''
                const endDate = exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''
                const displayEndDate = endDate || 'Present'

                return (
                  <div key={index} className="mt-3">
                    <div className="flex justify-between items-center">
                      <h3 className={styles.experience.role}>{exp.role}</h3>
                      {startDate && (
                        <span className={styles.experience.dateRange}>
                          {startDate} - {displayEndDate}
                        </span>
                      )}
                    </div>
                    <p className={styles.experience.company}>
                      {exp.company}
                      {exp.location && ` | ${exp.location}`}
                    </p>
                    {exp.description && typeof exp.description === 'string' && (
                      <ul className={styles.experience.description}>
                        {exp.description
                          .split('\n')
                          .filter((line) => line.trim())
                          .map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </section>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <section className={styles.section.container}>
              <h2 className={styles.section.title}>Projects</h2>
              {projects.map((project, index) => (
                <div key={index} className="mt-3">
                  <h3 className={styles.project.title}>{project.title}</h3>
                  {project.description && (
                    <p className={styles.project.description}>{project.description}</p>
                  )}
                  {project.technologies && (
                    <p className={styles.project.technologies}>
                      Technologies: {project.technologies}
                    </p>
                  )}
                  {project.link && (
                    <a
                      href={
                        project.link.startsWith('http') ? project.link : `https://${project.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.project.link}
                    >
                      {project.link}
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Awards Section */}
          {awards.length > 0 && (
            <section className={styles.section.container}>
              <h2 className={styles.section.title}>Awards</h2>
              {awards.map((award, index) => (
                <div key={index} className="mt-3">
                  <h3 className={styles.award.name}>{award.name}</h3>
                  {(award.issuer || award.date) && (
                    <p className={styles.award.details}>
                      {award.issuer && award.date
                        ? `${award.issuer} | ${award.date}`
                        : award.issuer || award.date}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <section className={styles.section.container}>
              <h2 className={styles.section.title}>Education</h2>
              {education.map((edu, index) => (
                <div key={index} className="mt-3">
                  <div className="flex justify-between items-center">
                    <h3 className={styles.education.degree}>
                      {edu.degree}
                      {edu.fieldOfStudy ? ` - ${edu.fieldOfStudy}` : ''}
                    </h3>
                    <span className={styles.education.dateRange}>
                      {edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ''} -{' '}
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
                    </span>
                  </div>
                  <p className={styles.education.school}>{edu.school}</p>
                  {edu.gpa && <p className={styles.education.gpa}>GPA: {edu.gpa}</p>}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    )
  }

  // Single-column layout rendering (existing implementation)
  return (
    <div className="bg-white p-12">
      {/* Header Section */}
      <header className={styles.header.container}>
        <h1 className={styles.header.name}>{contactInfo.fullName || 'Your Name'}</h1>
        {contactInfo.headline && <p className={styles.header.headline}>{contactInfo.headline}</p>}

        {/* Contact Info Row */}
        <div className={styles.header.contactRow}>
          {contactInfo.phone && <span>{contactInfo.phone}</span>}
          {contactInfo.phone && contactInfo.email && <span>|</span>}
          {contactInfo.email && <span>{contactInfo.email}</span>}
          {contactInfo.email && contactInfo.address && <span>|</span>}
          {contactInfo.address && <span>{contactInfo.address}</span>}
        </div>

        {/* Links Row */}
        {(contactInfo.linkedin || contactInfo.website) && (
          <div className={styles.header.linksRow}>
            {contactInfo.linkedin && (
              <a
                href={contactInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {contactInfo.linkedin}
              </a>
            )}
            {contactInfo.website && (
              <a
                href={contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {contactInfo.website}
              </a>
            )}
          </div>
        )}
      </header>

      {/* Summary Section */}
      {hasSummary && (
        <section className={styles.section.container}>
          <h2 className={styles.section.title}>Summary</h2>
          <p className="text-sm text-text-main mt-3 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Experience Section */}
      {experiences.length > 0 && (
        <section className={styles.section.container}>
          <h2 className={styles.section.title}>Experience</h2>
          {experiences.map((exp, index) => {
            const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''
            const endDate = exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''
            const displayEndDate = endDate || 'Present'

            return (
              <div key={index} className="mt-3">
                <div className="flex justify-between items-center">
                  <h3 className={styles.experience.role}>{exp.role}</h3>
                  {startDate && (
                    <span className={styles.experience.dateRange}>
                      {startDate} - {displayEndDate}
                    </span>
                  )}
                </div>
                <p className={styles.experience.company}>
                  {exp.company}
                  {exp.location && ` | ${exp.location}`}
                </p>
                {exp.description && typeof exp.description === 'string' && (
                  <ul className={styles.experience.description}>
                    {exp.description
                      .split('\n')
                      .filter((line) => line.trim())
                      .map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                  </ul>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* Projects Section */}
      {projects.length > 0 && (
        <section className={styles.section.container}>
          <h2 className={styles.section.title}>Projects</h2>
          {projects.map((project, index) => (
            <div key={index} className="mt-3">
              <h3 className={styles.project.title}>{project.title}</h3>
              {project.description && (
                <p className={styles.project.description}>{project.description}</p>
              )}
              {project.technologies && (
                <p className={styles.project.technologies}>Technologies: {project.technologies}</p>
              )}
              {project.link && (
                <a
                  href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.project.link}
                >
                  {project.link}
                </a>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Awards Section */}
      {awards.length > 0 && (
        <section className={styles.section.container}>
          <h2 className={styles.section.title}>Awards</h2>
          {awards.map((award, index) => (
            <div key={index} className="mt-3">
              <h3 className={styles.award.name}>{award.name}</h3>
              {(award.issuer || award.date) && (
                <p className={styles.award.details}>
                  {award.issuer && award.date
                    ? `${award.issuer} | ${award.date}`
                    : award.issuer || award.date}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills, Certifications & Languages Section */}
      {(skills.length > 0 || certifications.length > 0 || languages.length > 0) && (
        <section className={styles.section.container}>
          <h2 className={styles.section.title}>
            {(() => {
              if (skills.length > 0 && certifications.length > 0) {
                return 'Skills & Certifications'
              }
              if (skills.length > 0) {
                return 'Skills'
              }
              if (certifications.length > 0 && languages.length > 0) {
                return 'Certifications & Languages'
              }
              if (certifications.length > 0) {
                return 'Certifications'
              }
              return 'Languages'
            })()}
          </h2>
          <div className="mt-3">
            {skills.length > 0 && (
              <p className={styles.skills.text}>{skills.map((skill) => skill.name).join(', ')}</p>
            )}
            {certifications.length > 0 && (
              <p className={`${styles.skills.text} mt-2`}>
                <span className={styles.skills.label}>Certifications:</span>{' '}
                {certifications.map((cert) => cert.name).join(', ')}
              </p>
            )}
            {languages.length > 0 && (
              <p className={`${styles.skills.text} mt-2`}>
                <span className={styles.skills.label}>Languages:</span>{' '}
                {languages.map((lang) => `${lang.name} (${lang.proficiency})`).join(', ')}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Education Section */}
      {education.length > 0 && (
        <section className={styles.section.container}>
          <h2 className={styles.section.title}>Education</h2>
          {education.map((edu, index) => (
            <div key={index} className="mt-3">
              <div className="flex justify-between items-center">
                <h3 className={styles.education.degree}>
                  {edu.degree}
                  {edu.fieldOfStudy ? ` - ${edu.fieldOfStudy}` : ''}
                </h3>
                <span className={styles.education.dateRange}>
                  {edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ''} -{' '}
                  {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
                </span>
              </div>
              <p className={styles.education.school}>{edu.school}</p>
              {edu.gpa && <p className={styles.education.gpa}>GPA: {edu.gpa}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

/** Modern Template Component */
function ModernTemplate({ resumeData }: { resumeData: ResumeData }) {
  const modernStyles: TemplateStyleConfig = {
    header: {
      container: 'text-center border-b-2 border-border-color pb-4',
      name: 'text-4xl font-bold text-text-main tracking-tight',
      headline: 'text-lg text-primary font-medium mt-1',
      contactRow:
        'flex justify-center items-center gap-x-6 gap-y-1 text-sm text-text-subtle mt-3 flex-wrap',
      linksRow: 'flex justify-center items-center gap-x-6 text-sm mt-2 flex-wrap',
    },
    section: {
      title:
        'text-xl font-bold text-primary tracking-wide uppercase border-b-2 border-border-color pb-1',
      container: 'mt-6',
    },
    experience: {
      role: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      company: 'text-md font-semibold text-text-subtle',
      description: 'list-disc pl-5 mt-2 text-sm text-text-main space-y-1',
    },
    project: {
      title: 'text-base font-bold text-text-main',
      description: 'text-sm text-text-main mt-1',
      technologies: 'text-sm text-text-subtle mt-1',
      link: 'text-sm text-primary hover:underline',
    },
    award: {
      name: 'text-base font-bold text-text-main',
      details: 'text-sm text-text-subtle mt-1',
    },
    skills: {
      text: 'text-sm text-text-main',
      label: 'font-semibold',
    },
    education: {
      degree: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      school: 'text-md font-semibold text-text-subtle',
      gpa: 'text-sm text-text-subtle mt-1',
    },
  }

  return <BaseResumeLayout resumeData={resumeData} styles={modernStyles} />
}

/** Classic Template Component */
function ClassicTemplate({ resumeData }: { resumeData: ResumeData }) {
  const classicStyles: TemplateStyleConfig = {
    header: {
      container: 'text-left border-b-2 border-border-color pb-4',
      name: 'text-4xl font-bold text-text-main tracking-tight',
      headline: 'text-lg text-primary font-medium mt-1',
      contactRow:
        'flex justify-start items-center gap-x-6 gap-y-1 text-sm text-text-subtle mt-3 flex-wrap',
      linksRow: 'flex justify-start items-center gap-x-6 text-sm mt-2 flex-wrap',
    },
    section: {
      title:
        'text-xl font-bold text-text-main tracking-wide uppercase border-b border-border-color pb-1',
      container: 'mt-6',
    },
    experience: {
      role: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      company: 'text-md font-semibold text-text-subtle',
      description: 'list-disc pl-5 mt-2 text-sm text-text-main space-y-1',
    },
    project: {
      title: 'text-base font-bold text-text-main',
      description: 'text-sm text-text-main mt-1',
      technologies: 'text-sm text-text-subtle mt-1',
      link: 'text-sm text-primary hover:underline',
    },
    award: {
      name: 'text-base font-bold text-text-main',
      details: 'text-sm text-text-subtle mt-1',
    },
    skills: {
      text: 'text-sm text-text-main',
      label: 'font-semibold',
    },
    education: {
      degree: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      school: 'text-md font-semibold text-text-subtle',
      gpa: 'text-sm text-text-subtle mt-1',
    },
  }

  return <BaseResumeLayout resumeData={resumeData} styles={classicStyles} />
}

/** Minimalist Template Component */
function MinimalistTemplate({ resumeData }: { resumeData: ResumeData }) {
  const minimalistStyles: TemplateStyleConfig = {
    header: {
      container: 'text-center border-b border-border-color/50 pb-4',
      name: 'text-3xl font-bold text-text-main tracking-tight',
      headline: 'text-lg text-primary font-medium mt-1',
      contactRow:
        'flex justify-center items-center gap-x-6 gap-y-1 text-sm text-text-subtle mt-3 flex-wrap',
      linksRow: 'flex justify-center items-center gap-x-6 text-sm mt-2 flex-wrap',
    },
    section: {
      title: 'text-lg font-bold text-text-main uppercase pb-1',
      container: 'mt-6',
    },
    experience: {
      role: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      company: 'text-md font-semibold text-text-subtle',
      description: 'list-disc pl-5 mt-2 text-sm text-text-main space-y-1',
    },
    project: {
      title: 'text-base font-bold text-text-main',
      description: 'text-sm text-text-main mt-1',
      technologies: 'text-sm text-text-subtle mt-1',
      link: 'text-sm text-primary hover:underline',
    },
    award: {
      name: 'text-base font-bold text-text-main',
      details: 'text-sm text-text-subtle mt-1',
    },
    skills: {
      text: 'text-sm text-text-main',
      label: 'font-semibold',
    },
    education: {
      degree: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      school: 'text-md font-semibold text-text-subtle',
      gpa: 'text-sm text-text-subtle mt-1',
    },
  }

  return <BaseResumeLayout resumeData={resumeData} styles={minimalistStyles} />
}

/** Creative Template Component */
function CreativeTemplate({ resumeData }: { resumeData: ResumeData }) {
  const creativeStyles: TemplateStyleConfig = {
    layout: 'sidebar',
    header: {
      container: 'text-center mb-6',
      name: 'text-2xl font-bold text-white tracking-tight',
      headline: 'text-sm text-white/90 font-medium mt-2',
      contactRow:
        'flex justify-center items-center gap-x-6 gap-y-1 text-sm text-text-subtle mt-3 flex-wrap',
      linksRow: 'flex justify-center items-center gap-x-6 text-sm mt-2 flex-wrap',
    },
    sidebar: {
      container: 'bg-primary text-white p-8',
      sectionTitle: 'text-lg font-bold border-b-2 border-white/30 pb-2 mb-3',
      contactItem: 'text-sm mb-2',
      skillItem: 'text-sm mb-1',
    },
    mainContent: {
      container: 'p-8 bg-white',
    },
    section: {
      title:
        'text-xl font-bold text-primary tracking-wide uppercase border-b-2 border-primary pb-1',
      container: 'mt-6',
    },
    experience: {
      role: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      company: 'text-md font-semibold text-text-subtle',
      description: 'list-disc pl-5 mt-2 text-sm text-text-main space-y-1',
    },
    project: {
      title: 'text-base font-bold text-text-main',
      description: 'text-sm text-text-main mt-1',
      technologies: 'text-sm text-text-subtle mt-1',
      link: 'text-sm text-primary hover:underline',
    },
    award: {
      name: 'text-base font-bold text-text-main',
      details: 'text-sm text-text-subtle mt-1',
    },
    skills: {
      text: 'text-sm text-text-main',
      label: 'font-semibold',
    },
    education: {
      degree: 'text-lg font-bold text-text-main',
      dateRange: 'text-sm font-medium text-text-subtle',
      school: 'text-md font-semibold text-text-subtle',
      gpa: 'text-sm text-text-subtle mt-1',
    },
  }

  return <BaseResumeLayout resumeData={resumeData} styles={creativeStyles} />
}

/** Preview Components */
const ModernPreview = (
  <div className="aspect-[8.5/11] bg-white rounded border overflow-hidden flex flex-col text-[0px]">
    {/* Header — centered, primary name */}
    <div className="px-4 pt-4 pb-2.5 flex flex-col items-center gap-1.5">
      <div className="w-1/2 h-2.5 bg-primary rounded" />
      <div className="w-1/3 h-1.5 bg-text-subtle/35 rounded" />
      <div className="flex gap-2 mt-0.5">
        <div className="w-10 h-1 bg-text-subtle/20 rounded" />
        <div className="w-10 h-1 bg-text-subtle/20 rounded" />
        <div className="w-10 h-1 bg-text-subtle/20 rounded" />
      </div>
    </div>
    <div className="h-px bg-primary/25 mx-4" />
    {/* Summary */}
    <div className="px-4 pt-2.5 space-y-1">
      <div className="w-14 h-1.5 bg-primary/55 rounded" />
      <div className="w-full h-1 bg-text-subtle/15 rounded" />
      <div className="w-4/5 h-1 bg-text-subtle/15 rounded" />
    </div>
    {/* Experience */}
    <div className="px-4 pt-2.5 space-y-1">
      <div className="w-20 h-1.5 bg-primary/55 rounded" />
      <div className="flex justify-between mt-0.5">
        <div className="w-1/3 h-1.5 bg-text-subtle/30 rounded" />
        <div className="w-1/5 h-1 bg-text-subtle/20 rounded" />
      </div>
      <div className="w-full h-1 bg-text-subtle/15 rounded" />
      <div className="w-full h-1 bg-text-subtle/15 rounded" />
      <div className="w-3/4 h-1 bg-text-subtle/15 rounded" />
    </div>
    {/* Skills */}
    <div className="px-4 pt-2.5 space-y-1.5">
      <div className="w-10 h-1.5 bg-primary/55 rounded" />
      <div className="flex flex-wrap gap-1">
        <div className="w-9 h-2 bg-primary/12 rounded-full" />
        <div className="w-12 h-2 bg-primary/12 rounded-full" />
        <div className="w-8 h-2 bg-primary/12 rounded-full" />
        <div className="w-11 h-2 bg-primary/12 rounded-full" />
        <div className="w-9 h-2 bg-primary/12 rounded-full" />
      </div>
    </div>
  </div>
)

const ClassicPreview = (
  <div className="aspect-[8.5/11] bg-white rounded border overflow-hidden flex flex-col p-4 gap-2 text-[0px]">
    {/* Header — left aligned, dark name */}
    <div className="flex flex-col gap-1">
      <div className="w-2/5 h-2.5 bg-text-main rounded" />
      <div className="w-1/3 h-1.5 bg-text-subtle/35 rounded" />
      <div className="flex gap-2 mt-0.5">
        <div className="w-10 h-1 bg-text-subtle/20 rounded" />
        <div className="w-10 h-1 bg-text-subtle/20 rounded" />
      </div>
    </div>
    <div className="h-px bg-text-main/35" />
    {/* Experience */}
    <div className="space-y-1">
      <div className="w-20 h-1.5 bg-text-main/60 rounded" />
      <div className="flex justify-between">
        <div className="w-1/3 h-1.5 bg-text-subtle/30 rounded" />
        <div className="w-1/5 h-1 bg-text-subtle/20 rounded" />
      </div>
      <div className="w-full h-1 bg-text-subtle/15 rounded" />
      <div className="w-full h-1 bg-text-subtle/15 rounded" />
      <div className="w-4/5 h-1 bg-text-subtle/15 rounded" />
    </div>
    <div className="h-px bg-text-main/15" />
    {/* Education */}
    <div className="space-y-1">
      <div className="w-16 h-1.5 bg-text-main/60 rounded" />
      <div className="w-2/5 h-1.5 bg-text-subtle/25 rounded" />
      <div className="w-1/3 h-1 bg-text-subtle/15 rounded" />
    </div>
    <div className="h-px bg-text-main/15" />
    {/* Skills */}
    <div className="space-y-1">
      <div className="w-10 h-1.5 bg-text-main/60 rounded" />
      <div className="w-full h-1 bg-text-subtle/15 rounded" />
      <div className="w-2/3 h-1 bg-text-subtle/15 rounded" />
    </div>
  </div>
)

const MinimalistPreview = (
  <div className="aspect-[8.5/11] bg-white rounded border overflow-hidden flex flex-col p-5 gap-2.5 text-[0px]">
    {/* Header — minimal, just name + thin contact line */}
    <div className="flex flex-col gap-1.5">
      <div className="w-2/5 h-2 bg-text-main rounded" />
      <div className="flex gap-2">
        <div className="w-14 h-0.5 bg-text-subtle/30 rounded" />
        <div className="w-14 h-0.5 bg-text-subtle/30 rounded" />
        <div className="w-14 h-0.5 bg-text-subtle/30 rounded" />
      </div>
    </div>
    <div className="h-px bg-text-subtle/20" />
    <div className="space-y-1">
      <div className="w-14 h-1 bg-text-subtle/45 rounded" />
      <div className="w-full h-0.5 bg-text-subtle/15 rounded" />
      <div className="w-full h-0.5 bg-text-subtle/15 rounded" />
      <div className="w-4/5 h-0.5 bg-text-subtle/15 rounded" />
    </div>
    <div className="h-px bg-text-subtle/20" />
    <div className="space-y-1">
      <div className="w-18 h-1 bg-text-subtle/45 rounded" />
      <div className="flex justify-between">
        <div className="w-1/3 h-0.5 bg-text-subtle/25 rounded" />
        <div className="w-1/5 h-0.5 bg-text-subtle/20 rounded" />
      </div>
      <div className="w-full h-0.5 bg-text-subtle/15 rounded" />
      <div className="w-3/4 h-0.5 bg-text-subtle/15 rounded" />
    </div>
    <div className="h-px bg-text-subtle/20" />
    <div className="space-y-1">
      <div className="w-10 h-1 bg-text-subtle/45 rounded" />
      <div className="flex gap-1.5 flex-wrap">
        <div className="w-9 h-0.5 bg-text-subtle/15 rounded" />
        <div className="w-12 h-0.5 bg-text-subtle/15 rounded" />
        <div className="w-8 h-0.5 bg-text-subtle/15 rounded" />
      </div>
    </div>
  </div>
)

const CreativePreview = (
  <div className="aspect-[8.5/11] bg-white rounded border overflow-hidden flex text-[0px]">
    {/* Sidebar — primary color */}
    <div className="w-[34%] bg-primary flex flex-col p-2.5 gap-2">
      <div className="w-full h-2.5 bg-white/80 rounded" />
      <div className="w-2/3 h-1.5 bg-white/50 rounded" />
      <div className="mt-1 space-y-1">
        <div className="w-3/4 h-1 bg-white/35 rounded" />
        <div className="w-full h-1 bg-white/25 rounded" />
        <div className="w-2/3 h-1 bg-white/25 rounded" />
      </div>
      <div className="mt-1 space-y-1">
        <div className="w-1/2 h-1 bg-white/55 rounded" />
        <div className="flex flex-wrap gap-1">
          <div className="w-8 h-1.5 bg-white/20 rounded" />
          <div className="w-10 h-1.5 bg-white/20 rounded" />
          <div className="w-7 h-1.5 bg-white/20 rounded" />
          <div className="w-9 h-1.5 bg-white/20 rounded" />
        </div>
      </div>
    </div>
    {/* Main content */}
    <div className="flex-1 p-2.5 flex flex-col gap-2">
      <div className="space-y-1">
        <div className="w-1/2 h-1.5 bg-primary/50 rounded" />
        <div className="w-full h-1 bg-text-subtle/15 rounded" />
        <div className="w-4/5 h-1 bg-text-subtle/15 rounded" />
      </div>
      <div className="space-y-1">
        <div className="w-1/3 h-1.5 bg-primary/50 rounded" />
        <div className="flex justify-between">
          <div className="w-2/5 h-1 bg-text-subtle/25 rounded" />
          <div className="w-1/5 h-1 bg-text-subtle/15 rounded" />
        </div>
        <div className="w-full h-1 bg-text-subtle/15 rounded" />
        <div className="w-full h-1 bg-text-subtle/15 rounded" />
        <div className="w-3/4 h-1 bg-text-subtle/15 rounded" />
      </div>
      <div className="space-y-1">
        <div className="w-1/3 h-1.5 bg-primary/50 rounded" />
        <div className="w-2/3 h-1 bg-text-subtle/20 rounded" />
        <div className="w-1/2 h-1 bg-text-subtle/15 rounded" />
      </div>
    </div>
  </div>
)

/** Templates Array */
export const TEMPLATES: Template[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with bold typography and primary color accents',
    component: ModernTemplate,
    previewComponent: ModernPreview,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional resume format with left-aligned header and conservative styling',
    component: ClassicTemplate,
    previewComponent: ClassicPreview,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean and simple design with thin dividers and restrained typography',
    component: MinimalistTemplate,
    previewComponent: MinimalistPreview,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Two-column layout with primary-colored sidebar and bold visual hierarchy',
    component: CreativeTemplate,
    previewComponent: CreativePreview,
  },
]
