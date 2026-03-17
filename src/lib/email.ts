import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendVerificationEmailParams {
	email: string
	token: string
	name?: string
}

export async function sendVerificationEmail({ email, token, name }: SendVerificationEmailParams) {
	const verifyUrl = `${process.env.APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

	try {
		const { data, error } = await resend.emails.send({
			from: 'RoboResume <robo-resume@resume.dev>',
			to: [email],
			subject: 'Verify Your Email - RoboResume',
			html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 0;">
				<table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 20px 40px; text-align: center;">
							<h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 0 40px 40px 40px;">
							<p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 24px;">
								${name ? `Hi ${name},` : 'Hi there,'}
							</p>
							<p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 24px;">
								Thanks for signing up for RoboResume! Please verify your email address to activate your account.
							</p>

							<!-- Button -->
							<table role="presentation" style="margin: 30px 0; border-collapse: collapse; width: 100%;">
								<tr>
									<td align="center">
										<a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background-color: #d4a373; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
											Verify Email Address
										</a>
									</td>
								</tr>
							</table>

							<p style="margin: 20px 0 0 0; color: #475569; font-size: 14px; line-height: 20px;">
								Or copy and paste this URL into your browser:
							</p>
							<p style="margin: 8px 0 0 0; color: #d4a373; font-size: 14px; word-break: break-all;">
								${verifyUrl}
							</p>

							<!-- Important Info -->
							<div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
								<p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
									<strong>⚠️ Important:</strong> This link will expire in 24 hours.
								</p>
							</div>

							<p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 20px;">
								If you didn't create an account on RoboResume, you can safely ignore this email.
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
							<p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 18px;">
								This email was sent by RoboResume. If you have questions, contact us at support@resume.dev
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
			`
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

interface SendPasswordResetEmailParams {
	email: string
	token: string
	name?: string
}

export async function sendPasswordResetEmail({ email, token, name }: SendPasswordResetEmailParams) {
	const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`

	try {
		const { data, error } = await resend.emails.send({
			from: 'RoboResume <robo-resume@resume.dev>',
			to: [email],
			subject: 'Reset Your Password - RoboResume',
			html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 0;">
				<table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 20px 40px; text-align: center;">
							<h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 0 40px 40px 40px;">
							<p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 24px;">
								${name ? `Hi ${name},` : 'Hi there,'}
							</p>
							<p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 24px;">
								We received a request to reset your password for your RoboResume account. Click the button below to create a new password:
							</p>

							<!-- Button -->
							<table role="presentation" style="margin: 30px 0; border-collapse: collapse;">
								<tr>
									<td align="center">
										<a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
											Reset Password
										</a>
									</td>
								</tr>
							</table>

							<p style="margin: 20px 0 0 0; color: #475569; font-size: 14px; line-height: 20px;">
								Or copy and paste this URL into your browser:
							</p>
							<p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
								${resetUrl}
							</p>

							<!-- Important Info -->
							<div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
								<p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
									<strong>⚠️ Important:</strong> This link will expire in 30 minutes for security reasons.
								</p>
							</div>

							<p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 20px;">
								If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
							<p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 18px;">
								This email was sent by RoboResume. If you have questions, contact us at support@resume.dev
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
			`
		})

		if (error) {
			console.error('Error sending password reset email:', error)
			return { success: false, error }
		}

		console.log('Password reset email sent:', data)
		return { success: true, data }
	} catch (error) {
		console.error('Error sending password reset email:', error)
		return { success: false, error }
	}
}
