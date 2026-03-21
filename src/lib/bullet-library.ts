export interface BulletCategory {
  id: string
  label: string
  keywords: string[] // matched against experience.role (lowercase)
  bullets: string[]
}

export const BULLET_CATEGORIES: BulletCategory[] = [
  {
    id: 'software',
    label: 'Software Engineering',
    keywords: ['software', 'engineer', 'developer', 'programmer', 'full stack', 'fullstack', 'backend', 'frontend', 'web'],
    bullets: [
      'Architected event-driven microservices system processing 5M+ daily events with 99.95% uptime',
      'Reduced API response time by 45% through query optimization and Redis caching, handling 2M+ daily requests',
      'Led migration of monolithic application to microservices, reducing deployment time from 2 hours to 8 minutes',
      'Designed and implemented GraphQL API layer consumed by 12 downstream services, reducing over-fetching by 60%',
      'Introduced automated code review tooling and enforced coding standards, cutting bug escape rate by 38%',
      'Delivered 14 production releases per quarter with zero critical incidents by championing trunk-based development and CI/CD best practices',
      'Refactored legacy authentication module to OAuth 2.0 / OIDC, eliminating 3 known CVEs and reducing login latency by 220 ms',
      'Built internal developer platform used by 80+ engineers, standardizing service scaffolding and cutting onboarding time by 50%',
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend Development',
    keywords: ['frontend', 'front-end', 'react', 'vue', 'angular', 'ui developer', 'web developer'],
    bullets: [
      'Rebuilt core product UI in React 18 with server components, reducing Time to Interactive by 52% and improving Lighthouse score from 61 to 94',
      'Implemented design system of 70+ reusable components adopted across 5 product teams, cutting new-feature UI dev time by 35%',
      'Improved Largest Contentful Paint from 4.1 s to 1.6 s by introducing image optimization, lazy loading, and CDN caching',
      'Migrated 120 k-line JavaScript codebase to TypeScript with strict mode, surfacing and fixing 340 latent type errors pre-production',
      'Integrated real-time data streaming via WebSockets, delivering live dashboard updates to 15,000+ concurrent users with sub-100 ms latency',
      'Reduced bundle size by 41% through code-splitting, tree-shaking, and replacing moment.js with date-fns',
      'Achieved 92% unit and integration test coverage on critical user flows using Vitest and Playwright, eliminating regression incidents',
      'Owned end-to-end accessibility overhaul bringing 8 core pages to WCAG 2.1 AA compliance and expanding addressable user base by ~12%',
    ],
  },
  {
    id: 'devops',
    label: 'DevOps & Cloud',
    keywords: ['devops', 'cloud', 'infrastructure', 'sre', 'platform', 'reliability'],
    bullets: [
      'Designed and maintained multi-region AWS infrastructure using Terraform, achieving 99.99% availability across 4 production services',
      'Implemented GitOps deployment pipeline with ArgoCD and Kubernetes, reducing mean time to deploy from 45 min to under 6 min',
      'Reduced cloud infrastructure costs by $420 k annually through right-sizing, reserved instance purchasing, and spot-instance migration',
      'Built centralized observability stack (Prometheus, Grafana, Loki) with 200+ alerts, cutting mean time to detect incidents by 65%',
      'Automated disaster recovery runbooks, reducing RTO from 4 hours to 22 minutes and achieving RPO < 5 minutes',
      'Led SOC 2 Type II infrastructure compliance effort, implementing network segmentation, secrets management, and audit logging',
      'Containerized 30 legacy services with Docker and migrated to EKS, improving resource utilization by 55% and eliminating 6 VM instances',
      'Established SLI/SLO framework across 8 critical services, aligning engineering and business on reliability targets and reducing toil by 40%',
    ],
  },
  {
    id: 'data',
    label: 'Data & Machine Learning',
    keywords: ['data', 'machine learning', 'ml', 'ai', 'scientist', 'analyst', 'analytics', 'bi'],
    bullets: [
      'Built real-time churn prediction model (XGBoost) with 87% precision, enabling proactive outreach that reduced monthly churn by 18%',
      'Designed and deployed end-to-end ML pipeline on Vertex AI processing 50M+ records daily, reducing inference latency by 70%',
      'Created self-service analytics platform in Looker used by 200+ stakeholders, reducing ad-hoc data requests to the data team by 60%',
      'Engineered feature store consolidating 300+ features from 12 upstream sources, cutting model training time from 6 hours to 40 minutes',
      'Implemented A/B testing framework supporting 25 simultaneous experiments, directly attributing $3.2M in incremental annual revenue',
      'Migrated 4 TB data warehouse from Redshift to BigQuery, reducing query costs by 47% and average query time by 35%',
      'Developed NLP pipeline for support ticket classification (BERT fine-tune, 91% accuracy) that automated routing for 70% of inbound tickets',
      'Produced executive KPI dashboard tracking 40 business metrics with automated anomaly alerts, reducing reporting cycle from weekly to daily',
    ],
  },
  {
    id: 'product',
    label: 'Product Management',
    keywords: ['product manager', 'product owner', 'pm ', 'program manager'],
    bullets: [
      'Defined and shipped 0-to-1 mobile product from discovery to GA in 9 months, reaching 100 k MAU within 6 months of launch',
      'Prioritized and delivered roadmap of 22 features across 3 squads using continuous discovery, increasing NPS from 32 to 61',
      'Led cross-functional team of 18 (engineering, design, data, marketing) to launch checkout redesign that lifted conversion rate by 23%',
      'Reduced time-to-first-value for new users from 14 days to 3 days through onboarding redesign informed by 40+ user interviews',
      'Negotiated scope and delivery milestones with executive stakeholders, maintaining on-time delivery rate of 94% across 3 quarters',
      'Introduced Jobs-to-be-Done framework to discovery process, cutting feature churn post-launch by 35% over two planning cycles',
      'Partnered with data science team to build experimentation culture, growing number of monthly A/B tests from 2 to 18 in one year',
      'Synthesized competitive analysis across 11 market players to identify two differentiating feature opportunities contributing to 15% ARR growth',
    ],
  },
  {
    id: 'design',
    label: 'Design & UX',
    keywords: ['design', 'ux', 'ui', 'designer', 'creative'],
    bullets: [
      'Redesigned onboarding flow through 6 rounds of usability testing, reducing drop-off by 34% and increasing activation rate to 78%',
      'Built and maintained design system of 120+ components in Figma, adopted by 4 product teams and cutting design-to-dev handoff time by 45%',
      'Led end-to-end UX research program — 80 interviews, 5 diary studies — producing strategic insights that shaped the 18-month product roadmap',
      'Increased task completion rate on core workflow from 61% to 89% by simplifying navigation and reducing steps from 9 to 4',
      'Conducted accessibility audit of 15 key screens, identified 60+ WCAG violations, and partnered with engineering to remediate within one quarter',
      'Facilitated 12 design sprints across 3 product lines, generating and validating 6 new concepts that proceeded to development',
      'Produced motion design language and micro-interaction library that reduced user-reported confusion by 28% in post-launch surveys',
      'Established user research repository in Notion consolidating 200+ insights, reducing duplicated research efforts by 50%',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Growth',
    keywords: ['marketing', 'growth', 'seo', 'content', 'brand', 'demand gen'],
    bullets: [
      'Grew organic search traffic by 210% YoY through a programmatic SEO strategy targeting 1,200 long-tail keywords',
      'Launched and managed $2.4M annual paid acquisition budget across Google and Meta, achieving blended CAC 22% below target',
      'Built demand-gen engine from zero to $8M attributed pipeline within 12 months through webinars, content, and partner co-marketing',
      'Increased email open rates from 18% to 34% and click-through rates from 2.1% to 6.8% via segmentation and A/B-tested subject lines',
      'Developed brand refresh across all digital and print touchpoints, contributing to 19-point brand awareness lift in quarterly survey',
      'Executed product-led growth loop that drove 40% of new MRR through in-product referrals, reducing blended CAC by 31%',
      'Produced 48 long-form content assets per year generating 320 k organic visits and 4,200 MQL conversions annually',
      'Managed influencer and affiliate program of 85 partners, generating $1.1M in tracked revenue at 5× ROAS',
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Business Development',
    keywords: ['sales', 'account', 'business development', 'bdr', 'sdr', 'revenue'],
    bullets: [
      'Exceeded annual quota of $2.8M by 127%, closing 34 net-new enterprise accounts in a competitive mid-market segment',
      'Built and managed strategic partnerships with 8 GSIs and VARs, generating $4.5M in influenced pipeline within 10 months',
      'Reduced average sales cycle from 94 days to 61 days by introducing mutual action plans and executive sponsorship frameworks',
      'Grew existing account portfolio from $1.2M to $3.1M ARR through upsell and cross-sell motions, achieving 158% NRR',
      'Sourced and qualified 220+ outbound opportunities per quarter through multi-channel prospecting (cold call, email, LinkedIn), maintaining 32% connect rate',
      'Negotiated and closed 5 seven-figure deals in a single fiscal year, each requiring executive alignment across procurement, legal, and IT',
      'Implemented MEDDIC qualification framework across a 12-rep team, improving forecast accuracy from 58% to 84% within two quarters',
      'Launched channel sales program from scratch, onboarding 15 reseller partners and generating $900 k in first-year partner-sourced revenue',
    ],
  },
  {
    id: 'leadership',
    label: 'Leadership & Management',
    keywords: ['manager', 'director', 'lead', 'vp ', 'head of', 'chief', 'cto', 'ceo', 'coo'],
    bullets: [
      'Built and scaled engineering team from 4 to 22 engineers across 3 time zones in 18 months while maintaining team eNPS above 75',
      'Defined 3-year technical strategy and secured $6M board approval for platform modernization initiative, delivering on-schedule and 8% under budget',
      'Grew department revenue from $12M to $31M over two years by restructuring go-to-market territories and introducing performance-based incentives',
      'Reduced voluntary attrition from 28% to 11% by overhauling career laddering, introducing structured 1:1 coaching, and expanding L&D budget',
      'Established OKR process across 6 teams and 80+ employees, improving cross-functional alignment and on-time goal achievement from 52% to 79%',
      'Navigated organizational restructuring affecting 120 employees, maintaining productivity targets and completing all critical projects without delays',
      'Mentored 11 individual contributors to promotion within 18 months through deliberate stretch assignments and bi-weekly coaching sessions',
      'Led company-wide incident response during critical data breach, coordinating legal, security, and comms teams to contain and disclose within 72 hours',
    ],
  },
  {
    id: 'finance',
    label: 'Finance & Accounting',
    keywords: ['finance', 'accounting', 'accountant', 'financial', 'cfo', 'controller', 'treasurer'],
    bullets: [
      'Led financial close process for a $450M revenue business, reducing monthly close cycle from 12 days to 5 days through automation and process redesign',
      'Built 5-year financial model underpinning a $120M Series C raise, presenting to 30+ institutional investors across 3 roadshow cities',
      'Identified $7.2M in cost reduction opportunities through zero-based budgeting exercise across 6 business units, implementing $5.4M within one fiscal year',
      'Managed $85M investment portfolio with Sharpe ratio of 1.42, outperforming benchmark index by 310 bps over a 3-year period',
      'Implemented automated revenue recognition engine compliant with ASC 606, reducing manual journal entries by 80% and audit findings by 100%',
      'Oversaw $220M debt refinancing, negotiating 75 bps reduction in interest rate and saving $4.8M in annual interest expense',
      'Developed rolling 13-week cash flow forecast model with 97% accuracy, providing CFO and board with real-time liquidity visibility',
      'Partnered with external auditors to complete Big 4 audit 3 weeks ahead of schedule for second consecutive year, receiving clean opinion with zero material weaknesses',
    ],
  },
]

/**
 * Returns the best matching category id for a given role string (or null).
 * Checks keywords against the lowercased role; returns the first match found.
 */
export function detectCategory(role: string): string | null {
  if (!role) return null
  const lower = role.toLowerCase()
  for (const category of BULLET_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword)) {
        return category.id
      }
    }
  }
  return null
}

/**
 * Returns filtered bullets.
 * - If search is non-empty, filter bullets by text match across all (or one) category.
 * - If categoryId is set (and no search), return only that category's bullets.
 * - Otherwise return all categories with all bullets.
 */
export function searchBullets(
  search: string,
  categoryId: string | null
): Array<{ category: BulletCategory; bullets: string[] }> {
  const trimmedSearch = search.trim().toLowerCase()

  const categoriesToSearch = categoryId
    ? BULLET_CATEGORIES.filter((c) => c.id === categoryId)
    : BULLET_CATEGORIES

  return categoriesToSearch
    .map((category) => {
      const bullets = trimmedSearch
        ? category.bullets.filter((b) => b.toLowerCase().includes(trimmedSearch))
        : category.bullets
      return { category, bullets }
    })
    .filter(({ bullets }) => bullets.length > 0)
}
