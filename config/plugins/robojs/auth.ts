import EmailPassword from '@robojs/auth/providers/email-password'
import ResendMailer from '@robojs/auth/emails/resend'
import { createPrismaAdapter } from '@robojs/auth'
import type { AuthPluginOptions } from '@robojs/auth'
import { prisma } from '@/lib/prisma'
import {
	welcomeSubject, welcomeHtml, welcomeText,
	verificationSubject, verificationHtml, verificationText,
	resetSubject, resetHtml, resetText,
	signinSubject, signinHtml, signinText
} from '@/lib/email-templates'

const adapter = createPrismaAdapter({ client: prisma, secret: process.env.AUTH_SECRET! })
const mailer = ResendMailer({ apiKey: process.env.RESEND_API_KEY! })

const config: AuthPluginOptions = {
	emails: {
		from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
		mailer,
		templates: {
			'user:created': {
				subject: (ctx) => welcomeSubject(ctx),
				html: (ctx) => welcomeHtml(ctx),
				text: (ctx) => welcomeText(ctx)
			},
			'email:verification-requested': {
				subject: () => verificationSubject(),
				html: (ctx) => verificationHtml(ctx),
				text: (ctx) => verificationText(ctx)
			},
			'password:reset-requested': {
				subject: () => resetSubject(),
				html: (ctx) => resetHtml(ctx),
				text: (ctx) => resetText(ctx)
			},
			'session:created': {
				subject: () => signinSubject(),
				html: (ctx) => signinHtml(ctx),
				text: (ctx) => signinText(ctx)
			}
		}
	},
	pages: {
		signIn: '/auth',
		newUser: '/auth',
	},
	adapter: adapter,
	appName: 'RoboResume',
	providers: [
		EmailPassword({ adapter })
	],
	session: {
		strategy: "jwt"
	},
	cookies: {
		sessionToken: {
			name: 'authjs.session-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: "/",
				secure: process.env.NODE_ENV === 'production'
			}
		}
	},
	secret: process.env.AUTH_SECRET
}

export default config
