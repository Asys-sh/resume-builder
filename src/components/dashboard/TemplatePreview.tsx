import { TEMPLATES } from '@/lib/templates'

export function TemplatePreview({ template }: { template: string }) {
  return <>{TEMPLATES.find((t) => t.id === template)?.previewComponent}</>
}
