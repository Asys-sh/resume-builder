import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type React from 'react'
import { PDF_TEMPLATES } from '@/lib/pdf-templates'
import type { ResumeData } from '@/stores/builder'

interface ResumePDFProps {
  data: ResumeData
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => {
  const {
    contactInfo,
    experiences,
    education,
    skills,
    projects,
    summary,
    certifications,
    languages,
    selectedTemplate,
  } = data

  // Get template config or fallback to modern
  const config = PDF_TEMPLATES[selectedTemplate] || PDF_TEMPLATES['modern']
  const { colors, fonts, spacing, styles: tStyles } = config

  // Dynamic styles based on config
  const styles = StyleSheet.create({
    page: {
      flexDirection: config.layout === 'sidebar' ? 'row' : 'column',
      backgroundColor: colors.background,
      padding: config.layout === 'sidebar' ? 0 : spacing.margin,
      fontFamily: fonts.body,
      fontSize: 10,
      lineHeight: 1.5,
      color: colors.text,
    },
    // Sidebar Styles
    sidebar: {
      width: '30%',
      backgroundColor: colors.sidebarBackground || colors.primary,
      color: colors.sidebarText || '#FFFFFF',
      padding: 20,
      height: '100%',
    },
    mainContent: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    // Header Styles
    header: {
      ...tStyles.header,
      color: config.layout === 'sidebar' ? colors.sidebarText || '#FFFFFF' : colors.text,
    },
    name: {
      fontSize: 24,
      fontFamily: fonts.heading,
      fontWeight: 'bold',
      marginBottom: 4,
      color: config.layout === 'sidebar' ? colors.sidebarText || '#FFFFFF' : colors.text,
    },
    headline: {
      fontSize: 14,
      color: config.layout === 'sidebar' ? colors.sidebarText || '#FFFFFF' : colors.subtext,
      marginBottom: 8,
      opacity: 0.9,
    },
    contactInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: 9,
      color: config.layout === 'sidebar' ? colors.sidebarText || '#FFFFFF' : colors.subtext,
      opacity: 0.8,
      justifyContent: tStyles.header.textAlign === 'center' ? 'center' : 'flex-start',
    },
    // Section Styles
    section: {
      marginBottom: spacing.gap,
    },
    sectionTitle: {
      ...tStyles.sectionTitle,
    },
    // Item Styles
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    role: {
      ...tStyles.role,
    },
    company: {
      ...tStyles.company,
    },
    date: {
      ...tStyles.date,
    },
    description: {
      ...tStyles.description,
      marginTop: 4,
    },
    // Skills
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      backgroundColor: config.layout === 'sidebar' ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 9,
      color: config.layout === 'sidebar' ? colors.sidebarText || '#FFFFFF' : '#374151',
    },
    // Sidebar Specific
    sidebarSection: {
      marginBottom: 20,
    },
    sidebarTitle: {
      fontSize: 12,
      fontFamily: fonts.heading,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.3)',
      paddingBottom: 4,
      marginBottom: 10,
      color: colors.sidebarText || '#FFFFFF',
    },
    sidebarItem: {
      fontSize: 9,
      marginBottom: 4,
      color: colors.sidebarText || '#FFFFFF',
      opacity: 0.9,
    },
  })

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.name}>{contactInfo.fullName}</Text>
      <Text style={styles.headline}>{contactInfo.headline}</Text>
      <View style={styles.contactInfo}>
        {contactInfo.email && <Text>{contactInfo.email}</Text>}
        {contactInfo.phone && <Text>{contactInfo.phone}</Text>}
        {contactInfo.address && <Text>{contactInfo.address}</Text>}
        {contactInfo.linkedin && <Text>{contactInfo.linkedin}</Text>}
        {contactInfo.website && <Text>{contactInfo.website}</Text>}
      </View>
    </View>
  )

  const ExperienceSection = () =>
    experiences.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        {experiences.map((exp) => (
          <View key={exp.id} style={{ marginBottom: 12 }}>
            <View style={styles.jobHeader}>
              <View>
                <Text style={styles.role}>{exp.role}</Text>
                <Text style={styles.company}>
                  {exp.company} {exp.location ? `• ${exp.location}` : ''}
                </Text>
              </View>
              <Text style={styles.date}>
                {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} -{' '}
                {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
              </Text>
            </View>
            <Text style={styles.description}>{exp.description}</Text>
          </View>
        ))}
      </View>
    )

  const EducationSection = () =>
    education.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {education.map((edu) => (
          <View key={edu.id} style={{ marginBottom: 8 }}>
            <View style={styles.jobHeader}>
              <View>
                <Text style={styles.role}>{edu.school}</Text>
                <Text style={styles.company}>
                  {edu.degree} in {edu.fieldOfStudy}
                </Text>
              </View>
              <Text style={styles.date}>
                {edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ''} -{' '}
                {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
              </Text>
            </View>
            {edu.gpa && <Text style={styles.description}>GPA: {edu.gpa}</Text>}
          </View>
        ))}
      </View>
    )

  const SkillsSection = () =>
    skills.length > 0 && (
      <View style={config.layout === 'sidebar' ? styles.sidebarSection : styles.section}>
        <Text style={config.layout === 'sidebar' ? styles.sidebarTitle : styles.sectionTitle}>
          Skills
        </Text>
        <View style={styles.skillsContainer}>
          {skills.map((skill) => (
            <Text key={skill.id} style={styles.skillTag}>
              {skill.name}
            </Text>
          ))}
        </View>
      </View>
    )

  const ProjectsSection = () =>
    projects.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projects</Text>
        {projects.map((project) => (
          <View key={project.id} style={{ marginBottom: 12 }}>
            <View style={styles.jobHeader}>
              <Text style={{ ...styles.role, fontSize: 10 }}>{project.title}</Text>
              {project.link && (
                <Text style={{ ...styles.date, color: colors.primary }}>{project.link}</Text>
              )}
            </View>
            <Text style={styles.description}>{project.description}</Text>
            {project.technologies && (
              <Text
                style={[styles.description, { fontSize: 9, fontStyle: 'italic', marginTop: 2 }]}
              >
                Tech: {project.technologies}
              </Text>
            )}
          </View>
        ))}
      </View>
    )

  const CertsAndLanguages = () => (
    <>
      {certifications.length > 0 && (
        <View style={config.layout === 'sidebar' ? styles.sidebarSection : styles.section}>
          <Text style={config.layout === 'sidebar' ? styles.sidebarTitle : styles.sectionTitle}>
            Certifications
          </Text>
          {certifications.map((cert) => (
            <View key={cert.id} style={{ marginBottom: 4 }}>
              <Text
                style={
                  config.layout === 'sidebar'
                    ? { fontWeight: 'bold', color: colors.sidebarText, fontSize: 9 }
                    : { fontWeight: 'bold', fontSize: 10 }
                }
              >
                {cert.name}
              </Text>
              <Text
                style={
                  config.layout === 'sidebar'
                    ? styles.sidebarItem
                    : { fontSize: 9, color: colors.subtext }
                }
              >
                {cert.issuer} {cert.date ? `• ${cert.date}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {languages.length > 0 && (
        <View style={config.layout === 'sidebar' ? styles.sidebarSection : styles.section}>
          <Text style={config.layout === 'sidebar' ? styles.sidebarTitle : styles.sectionTitle}>
            Languages
          </Text>
          {languages.map((lang) => (
            <View key={lang.id} style={{ marginBottom: 4 }}>
              <Text
                style={
                  config.layout === 'sidebar'
                    ? { fontWeight: 'bold', color: colors.sidebarText, fontSize: 9 }
                    : { fontWeight: 'bold', fontSize: 10 }
                }
              >
                {lang.name}
              </Text>
              <Text
                style={
                  config.layout === 'sidebar'
                    ? styles.sidebarItem
                    : { fontSize: 9, color: colors.subtext }
                }
              >
                {lang.proficiency}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  )

  if (config.layout === 'sidebar') {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            <Header />
            <SkillsSection />
            <CertsAndLanguages />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Summary</Text>
                <Text style={styles.description}>{summary}</Text>
              </View>
            )}
            <ExperienceSection />
            <EducationSection />
            <ProjectsSection />
          </View>
        </Page>
      </Document>
    )
  }

  // Single Column Layout
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header />

        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.description}>{summary}</Text>
          </View>
        )}

        <ExperienceSection />
        <EducationSection />
        <ProjectsSection />
        <SkillsSection />
        <CertsAndLanguages />
      </Page>
    </Document>
  )
}
