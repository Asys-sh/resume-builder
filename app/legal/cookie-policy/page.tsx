import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — Landed',
  description: 'Learn how Landed uses cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <div className="bg-yellow flex flex-col gap-4 p-8">
      <h1>Cookie Policy</h1>
      <p>
        <strong>Last Updated:</strong> March 2026
      </p>

      <p>
        This Cookie Policy explains how Landed (&quot;<strong>Landed</strong>,&quot; &quot;
        <strong>we</strong>,&quot; &quot;<strong>our</strong>,&quot; or &quot;<strong>us</strong>
        &quot;) uses cookies and similar tracking technologies when you visit our website at
        resume.dev (the &quot;<strong>Service</strong>&quot;).
      </p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device when you visit a website. They allow the
        site to remember your preferences and improve your experience. Cookies can be
        &quot;session&quot; cookies (deleted when you close your browser) or &quot;persistent&quot;
        cookies (stored for a set period).
      </p>

      <h2>2. Cookies We Use</h2>

      <h3>Essential Cookies</h3>
      <p>These cookies are required for the Service to function and cannot be disabled.</p>
      <ul>
        <li>
          <strong>Session / Authentication cookies</strong> — Keep you logged in during your visit.
          Set by our authentication system (@robojs/auth). Deleted when you log out or your session
          expires.
        </li>
      </ul>

      <h3>Functional Cookies</h3>
      <p>These cookies remember your preferences to provide a better experience.</p>
      <ul>
        <li>
          <strong>Preference cookies</strong> — Store your resume template selection and builder
          progress so your work is not lost between sessions.
        </li>
      </ul>

      <h3>Third-Party Cookies</h3>
      <p>Some features use third-party services which may set their own cookies:</p>
      <ul>
        <li>
          <strong>Stripe</strong> — Our payment processor may set cookies related to payment
          sessions and fraud prevention. See{' '}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
            Stripe&apos;s Privacy Policy
          </a>
          .
        </li>
      </ul>

      <h2>3. What We Do NOT Use</h2>
      <ul>
        <li>
          We do <strong>not</strong> use advertising or tracking cookies.
        </li>
        <li>
          We do <strong>not</strong> sell or share cookie data with third parties for marketing.
        </li>
        <li>
          We do <strong>not</strong> use analytics cookies (e.g., Google Analytics) at this time.
        </li>
      </ul>

      <h2>4. Your Choices</h2>
      <p>
        You can control or delete cookies through your browser settings. Please note that disabling
        essential cookies will prevent you from logging in or using the Service properly.
      </p>
      <p>Most browsers allow you to:</p>
      <ul>
        <li>View cookies stored on your device</li>
        <li>Delete all or specific cookies</li>
        <li>Block cookies from specific or all websites</li>
      </ul>
      <p>Refer to your browser&apos;s help documentation for instructions.</p>

      <h2>5. EU Cookie Law</h2>
      <p>
        Under EU law, we are required to obtain your consent for non-essential cookies. Since
        Landed currently only uses <strong>essential and functional cookies</strong> necessary
        for the service to operate, no consent banner is required. If we introduce optional
        analytics or advertising cookies in the future, we will update this policy and request your
        consent.
      </p>

      <h2>6. Changes to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. The updated version will be indicated by
        a revised &quot;Last Updated&quot; date at the top of this page.
      </p>

      <h2>7. Contact</h2>
      <p>
        If you have questions about our use of cookies, contact us at:{' '}
        <a href="mailto:alexander@asys.sh">alexander@asys.sh</a>
      </p>
    </div>
  )
}
