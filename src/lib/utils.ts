import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function deleteResume(resumeId: string) {
  const res = await fetch('/api/resumes?resumeId=' + resumeId, {
    method: 'DELETE',
  })

  if (res.ok) {
    return true
  }

  return false
}

/**
 * Builds a formatted resume context string for AI prompts
 */
export function buildResumeContext(params: {
  userName: string | null
  summary: string | null
  experiences: Array<{
    role: string
    company: string
    startDate: Date
    endDate: Date | null
    description: string | null
  }>
  skills: Array<{ name: string }>
  education: Array<{
    degree: string
    school: string
    startDate: Date
    endDate: Date | null
  }>
  projects: Array<{
    title: string
    description: string | null
  }>
}): string {
  const { userName, summary, experiences, skills, education, projects } = params

  return `
Resume Summary:
- Name: ${userName}
- Professional Summary: ${summary || 'N/A'}

Work Experience:
${experiences
  .map(
    (
      exp,
      i,
    ) => `${i + 1}. ${exp.role} at ${exp.company} (${exp.startDate ? new Date(exp.startDate).toLocaleDateString() : 'N/A'} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'})
   ${exp.description || 'No description provided'}`,
  )
  .join('\n')}

Skills: ${skills.map((s) => s.name).join(', ')}

Education:
${education.map((edu, i) => `${i + 1}. ${edu.degree} from ${edu.school} (${edu.startDate ? new Date(edu.startDate).toLocaleDateString() : 'N/A'} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'})`).join('\n')}

Projects:
${projects.map((proj, i) => `${i + 1}. ${proj.title}: ${proj.description || 'No description'}`).join('\n')}
  `.trim()
}

/**
 * Builds a resume improvement prompt for AI
 */
export function buildResumeImprovementPrompt(params: {
  userName: string | null
  jobDescription: string
  resumeContext: string
}): string {
  const { userName, jobDescription, resumeContext } = params
  return `You are an expert resume coach. Review the candidate's resume against the job description and return specific, actionable improvements.

Candidate: ${userName || 'Unknown'}

Job Description:
${jobDescription}

Current Resume:
${resumeContext}

Instructions:
1. Identify 3-5 specific improvements to better match the job description
2. For each, give a short heading and a concrete suggestion (what to add, rephrase, or remove)
3. Keep suggestions practical and direct
4. Return plain text only — no markdown, no bullet symbols, just numbered points

Return your improvements now:`
}

/**
 * Builds a cover letter generation prompt for AI
 */
export function buildCoverLetterPrompt(params: {
  jobTitle?: string
  companyName?: string
  jobDescription: string
  resumeContext: string
}): string {
  const { jobTitle, companyName, jobDescription, resumeContext } = params

  return `You are a professional cover letter writer. Generate a compelling, personalized cover letter for the following job application.

Job Title: ${jobTitle || 'Not specified'}
Company: ${companyName || 'Not specified'}

Job Description:
${jobDescription}

Candidate's Resume:
${resumeContext}

Instructions:
1. Write a professional cover letter that highlights the candidate's relevant experience and skills
2. Tailor the content to match the job description requirements
3. Keep it concise (3-4 paragraphs)
4. Use a professional but warm tone
5. Include a strong opening and closing
6. Do NOT include placeholder text like [Your Name] or [Date] - use the actual candidate name
7. Format it as plain text, ready to be copied

Generate the cover letter now:`
}
