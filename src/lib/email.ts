import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const fromAddress = `RoboResume <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`

const colors = {
  primary: '#d4a373',
  primaryDark: '#b8894f',
  cream: '#fefae0',
  beige: '#e9edc9',
  dark: '#3a3226',
  subtle: '#6f6454',
  border: '#ccd5ae',
}

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.cream};">
	<table role="presentation" width="100%" style="border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 16px;">
				<!-- Logo -->
				<table role="presentation" width="560" style="border-collapse: collapse; max-width: 560px;">
					<tr>
						<td align="center" style="padding-bottom: 24px;">
							<table role="presentation" style="border-collapse: collapse;">
								<tr>
									<td style="background-color: ${colors.primary}; border-radius: 10px; padding: 8px 14px;">
										<span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">R</span>
									</td>
									<td style="padding-left: 10px;">
										<span style="color: ${colors.dark}; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">RoboResume</span>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>

				<!-- Card -->
				<table role="presentation" width="560" style="border-collapse: collapse; max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid ${colors.border}; overflow: hidden;">
					${content}
				</table>

				<!-- Footer -->
				<table role="presentation" width="560" style="border-collapse: collapse; max-width: 560px;">
					<tr>
						<td align="center" style="padding: 24px 0 0 0;">
							<p style="margin: 0; color: ${colors.subtle}; font-size: 12px; line-height: 18px;">
								&copy; 2025 RoboResume. All rights reserved.
							</p>
							<p style="margin: 6px 0 0 0; color: ${colors.subtle}; font-size: 12px; line-height: 18px;">
								Questions? Contact us at <a href="mailto:alexander@asys.sh" style="color: ${colors.primary}; text-decoration: none;">alexander@asys.sh</a>
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`
}

interface SendVerificationEmailParams {
  email: string
  token: string
  name?: string
}

export async function sendVerificationEmail({ email, token, name }: SendVerificationEmailParams) {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  const content = `
		<!-- Accent bar -->
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>

		<!-- Body -->
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">
					Verify your email
				</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}! ` : ''}Thanks for signing up. Tap the button below to confirm your email and get started.
				</p>
			</td>
		</tr>

		<!-- Button -->
		<tr>
			<td align="center" style="padding: 32px 40px;">
				<table role="presentation" style="border-collapse: collapse;">
					<tr>
						<td style="border-radius: 10px; background-color: ${colors.primary};">
							<a href="${verifyUrl}" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
								Verify Email Address
							</a>
						</td>
					</tr>
				</table>
			</td>
		</tr>

		<!-- Link fallback -->
		<tr>
			<td style="padding: 0 40px 32px 40px;">
				<div style="background-color: ${colors.cream}; border-radius: 8px; padding: 16px;">
					<p style="margin: 0 0 6px 0; color: ${colors.subtle}; font-size: 12px;">
						Or copy this link into your browser:
					</p>
					<p style="margin: 0; font-size: 13px; word-break: break-all;">
						<a href="${verifyUrl}" style="color: ${colors.primary}; text-decoration: none;">${verifyUrl}</a>
					</p>
				</div>
			</td>
		</tr>

		<!-- Expiry notice -->
		<tr>
			<td style="padding: 0 40px 40px 40px;">
				<p style="margin: 0; color: ${colors.subtle}; font-size: 13px; line-height: 20px;">
					This link expires in <strong style="color: ${colors.dark};">24 hours</strong>. If you didn't create an account on RoboResume, you can safely ignore this email.
				</p>
			</td>
		</tr>`

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: 'Verify Your Email — RoboResume',
      html: emailLayout(content),
    })

    if (error) {
      console.error('Error sending verification email:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { success: false, error }
  }
}

interface SendWelcomeEmailParams {
  email: string
  name?: string
}

export async function sendWelcomeEmail({ email, name }: SendWelcomeEmailParams) {
  const dashboardUrl = `${process.env.APP_URL}/dashboard`

  const content = `
		<!-- Accent bar -->
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>

		<!-- Body -->
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">
					Welcome to RoboResume!
				</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}! ` : ''}You're all set. Start building your resume and land your next job.
				</p>
			</td>
		</tr>

		<!-- Button -->
		<tr>
			<td align="center" style="padding: 32px 40px 40px 40px;">
				<table role="presentation" style="border-collapse: collapse;">
					<tr>
						<td style="border-radius: 10px; background-color: ${colors.primary};">
							<a href="${dashboardUrl}" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
								Go to Dashboard
							</a>
						</td>
					</tr>
				</table>
			</td>
		</tr>`

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: 'Welcome to RoboResume!',
      html: emailLayout(content),
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error }
  }
}

interface SendPasswordResetEmailParams {
  email: string
  token: string
  name?: string
}

export async function sendPasswordResetEmail({ email, token, name }: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`

  const content = `
		<!-- Accent bar -->
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>

		<!-- Body -->
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">
					Reset your password
				</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}, we` : 'We'} received a request to reset your password. If this was you, tap the button below to choose a new one.
				</p>
			</td>
		</tr>

		<!-- Button -->
		<tr>
			<td align="center" style="padding: 32px 40px;">
				<table role="presentation" style="border-collapse: collapse;">
					<tr>
						<td style="border-radius: 10px; background-color: ${colors.primary};">
							<a href="${resetUrl}" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
								Reset Password
							</a>
						</td>
					</tr>
				</table>
			</td>
		</tr>

		<!-- Link fallback -->
		<tr>
			<td style="padding: 0 40px 32px 40px;">
				<div style="background-color: ${colors.cream}; border-radius: 8px; padding: 16px;">
					<p style="margin: 0 0 6px 0; color: ${colors.subtle}; font-size: 12px;">
						Or copy this link into your browser:
					</p>
					<p style="margin: 0; font-size: 13px; word-break: break-all;">
						<a href="${resetUrl}" style="color: ${colors.primary}; text-decoration: none;">${resetUrl}</a>
					</p>
				</div>
			</td>
		</tr>

		<!-- Expiry notice -->
		<tr>
			<td style="padding: 0 40px 40px 40px;">
				<p style="margin: 0; color: ${colors.subtle}; font-size: 13px; line-height: 20px;">
					This link expires in <strong style="color: ${colors.dark};">30 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
				</p>
			</td>
		</tr>`

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: 'Reset Your Password — RoboResume',
      html: emailLayout(content),
    })

    if (error) {
      console.error('Error sending password reset email:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }
}
