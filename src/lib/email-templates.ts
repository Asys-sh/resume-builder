interface EmailContext {
  user: { name?: string | null }
  links?: { verifyEmail?: string; resetPassword?: string }
  tokens?: { verifyEmail?: string; resetPassword?: string }
  session?: { ip?: string; userAgent?: string }
}

const colors = {
  primary: '#d4a373',
  cream: '#fefae0',
  beige: '#e9edc9',
  dark: '#3a3226',
  subtle: '#6f6454',
  border: '#ccd5ae',
}

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.cream};">
	<table role="presentation" width="100%" style="border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 16px;">
				<table role="presentation" width="560" style="border-collapse: collapse; max-width: 560px;">
					<tr>
						<td align="center" style="padding-bottom: 24px;">
							<table role="presentation" style="border-collapse: collapse;">
								<tr>
									<td style="background-color: ${colors.primary}; border-radius: 10px; padding: 8px 14px;">
										<span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">R</span>
									</td>
									<td style="padding-left: 10px;">
										<span style="color: ${colors.dark}; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Landed</span>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
				<table role="presentation" width="560" style="border-collapse: collapse; max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid ${colors.border}; overflow: hidden;">
					${content}
				</table>
				<table role="presentation" width="560" style="border-collapse: collapse; max-width: 560px;">
					<tr>
						<td align="center" style="padding: 24px 0 0 0;">
							<p style="margin: 0; color: ${colors.subtle}; font-size: 12px;">&copy; 2025 Landed. All rights reserved.</p>
							<p style="margin: 6px 0 0 0; color: ${colors.subtle}; font-size: 12px;">
								Questions? <a href="mailto:alexander@asys.sh" style="color: ${colors.primary}; text-decoration: none;">alexander@asys.sh</a>
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

function button(href: string, label: string) {
  return `<table role="presentation" style="border-collapse: collapse;">
		<tr>
			<td style="border-radius: 10px; background-color: ${colors.primary};">
				<a href="${href}" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
					${label}
				</a>
			</td>
		</tr>
	</table>`
}

function linkFallback(url: string) {
  return `<div style="background-color: ${colors.cream}; border-radius: 8px; padding: 16px;">
		<p style="margin: 0 0 6px 0; color: ${colors.subtle}; font-size: 12px;">Or copy this link into your browser:</p>
		<p style="margin: 0; font-size: 13px; word-break: break-all;">
			<a href="${url}" style="color: ${colors.primary}; text-decoration: none;">${url}</a>
		</p>
	</div>`
}

// ── Welcome / Verification ──────────────────────────────────────────────

export function welcomeSubject(ctx: EmailContext): string {
  const name = ctx.user.name?.trim()
  return name ? `Welcome to Landed, ${name}` : 'Welcome to Landed'
}

export function welcomeHtml(ctx: EmailContext): string {
  const name = ctx.user.name?.trim()
  const verifyUrl = ctx.links?.verifyEmail ?? '#'

  return layout(`
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">Verify your email</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}! ` : ''}Thanks for signing up for Landed. Tap the button below to confirm your email and get started.
				</p>
			</td>
		</tr>
		<tr><td align="center" style="padding: 32px 40px;">${button(verifyUrl, 'Verify Email Address')}</td></tr>
		<tr><td style="padding: 0 40px 32px 40px;">${linkFallback(verifyUrl)}</td></tr>
		<tr>
			<td style="padding: 0 40px 40px 40px;">
				<p style="margin: 0; color: ${colors.subtle}; font-size: 13px; line-height: 20px;">
					This link expires in <strong style="color: ${colors.dark};">1 hour</strong>. If you didn't create an account, you can safely ignore this email.
				</p>
			</td>
		</tr>`)
}

export function welcomeText(ctx: EmailContext): string {
  const name = ctx.user.name?.trim() || 'there'
  const link = ctx.links?.verifyEmail ?? ''
  return `Hey ${name}, thanks for signing up for Landed!\n\nVerify your email: ${link}\n\nThis link expires in 1 hour.`
}

// ── Email Verification (separate from welcome) ─────────────────────────

export function verificationSubject(): string {
  return 'Verify your email — Landed'
}

export function verificationHtml(ctx: EmailContext): string {
  const name = ctx.user.name?.trim()
  const verifyUrl = ctx.links?.verifyEmail ?? ctx.tokens?.verifyEmail ?? '#'

  return layout(`
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">Confirm your email</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}, ` : ''}please verify your email to continue using Landed.
				</p>
			</td>
		</tr>
		<tr><td align="center" style="padding: 32px 40px;">${button(verifyUrl, 'Verify Email')}</td></tr>
		<tr><td style="padding: 0 40px 32px 40px;">${linkFallback(verifyUrl)}</td></tr>
		<tr>
			<td style="padding: 0 40px 40px 40px;">
				<p style="margin: 0; color: ${colors.subtle}; font-size: 13px;">
					If you didn't request this, ignore this email.
				</p>
			</td>
		</tr>`)
}

export function verificationText(ctx: EmailContext): string {
  const link = ctx.links?.verifyEmail ?? ctx.tokens?.verifyEmail ?? ''
  return `Verify your email for Landed: ${link}`
}

// ── Password Reset ──────────────────────────────────────────────────────

export function resetSubject(): string {
  return 'Reset your password — Landed'
}

export function resetHtml(ctx: EmailContext): string {
  const name = ctx.user.name?.trim()
  const resetUrl = ctx.links?.resetPassword ?? ctx.tokens?.resetPassword ?? '#'

  return layout(`
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">Reset your password</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}, we` : 'We'} received a request to reset your password. Tap the button below to choose a new one.
				</p>
			</td>
		</tr>
		<tr><td align="center" style="padding: 32px 40px;">${button(resetUrl, 'Reset Password')}</td></tr>
		<tr><td style="padding: 0 40px 32px 40px;">${linkFallback(resetUrl)}</td></tr>
		<tr>
			<td style="padding: 0 40px 40px 40px;">
				<p style="margin: 0; color: ${colors.subtle}; font-size: 13px; line-height: 20px;">
					This link expires in <strong style="color: ${colors.dark};">30 minutes</strong>. If you didn't request this, ignore this email — your password won't change.
				</p>
			</td>
		</tr>`)
}

export function resetText(ctx: EmailContext): string {
  const link = ctx.links?.resetPassword ?? ctx.tokens?.resetPassword ?? ''
  return `Reset your Landed password: ${link}\n\nThis link expires in 30 minutes. If you didn't request this, ignore this email.`
}

// ── Sign-in Alert ────────────────────────────────────────────────────────

export function signinSubject(): string {
  return 'New sign-in to your Landed account'
}

export function signinHtml(ctx: EmailContext): string {
  const name = ctx.user.name?.trim()
  const ip = ctx.session?.ip
  const ua = ctx.session?.userAgent

  const metaRows = [
    ip
      ? `<tr>
			<td style="padding: 8px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.subtle}; font-size: 13px;">
				IP address: <strong style="color: ${colors.dark};">${ip}</strong>
			</td>
		</tr>`
      : '',
    ua
      ? `<tr>
			<td style="padding: 8px 0; color: ${colors.subtle}; font-size: 13px;">
				Device: <strong style="color: ${colors.dark};">${ua}</strong>
			</td>
		</tr>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  return layout(`
		<tr><td style="height: 4px; background: linear-gradient(90deg, ${colors.primary}, ${colors.beige});"></td></tr>
		<tr>
			<td style="padding: 40px 40px 0 40px;">
				<h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 700;">New sign-in detected</h1>
				<p style="margin: 0; color: ${colors.subtle}; font-size: 15px; line-height: 24px;">
					${name ? `Hey ${name}, we` : 'We'} noticed a new sign-in to your Landed account. If this was you, no action is needed.
				</p>
			</td>
		</tr>
		${
      metaRows
        ? `<tr>
			<td style="padding: 24px 40px 0 40px;">
				<table role="presentation" width="100%" style="border-collapse: collapse; background-color: ${colors.cream}; border-radius: 8px; padding: 4px 16px;">
					${metaRows}
				</table>
			</td>
		</tr>`
        : ''
    }
		<tr>
			<td style="padding: 32px 40px 40px 40px;">
				<p style="margin: 0; color: ${colors.subtle}; font-size: 13px; line-height: 20px;">
					If you don't recognize this sign-in, <strong style="color: ${colors.dark};">reset your password immediately</strong> to secure your account.
				</p>
			</td>
		</tr>`)
}

export function signinText(ctx: EmailContext): string {
  const ip = ctx.session?.ip
  const ua = ctx.session?.userAgent
  const lines = [
    'New sign-in detected on your Landed account.',
    ip ? `IP: ${ip}` : undefined,
    ua ? `Device: ${ua}` : undefined,
    '',
    'If this was you, no action is needed. If not, reset your password immediately to secure your account.',
  ].filter(Boolean)
  return lines.join('\n')
}
