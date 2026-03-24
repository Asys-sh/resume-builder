export default function Footer() {
  return (
    <footer className="bg-cream flex flex-col gap-8 bg-beige px-5 py-12 text-center">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4 md:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <a className="text-sm text-dark/70 hover:text-primary" href="/about">
            About Us
          </a>
          <a className="text-sm text-dark/70 hover:text-primary" href="/contact">
            Contact
          </a>
          <a className="text-sm text-dark/70 hover:text-primary" href="/legal/privacy_policy">
            Privacy Policy
          </a>
          <a className="text-sm text-dark/70 hover:text-primary" href="/legal/tos">
            Terms of Service
          </a>
          <a className="text-sm text-dark/70 hover:text-primary" href="/legal/cookie-policy">
            Cookie Policy
          </a>
        </div>
        <div className="flex justify-center gap-4 flex-col">
          <span>Connect with us</span>
          <a href="https://discord.gg/roborresume">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-6 w-6 opacity-70 hover:opacity-100"
              alt="Discord logo"
              src="https://www.liblogo.com/img-logo/sml/di392d9d5-discord-logo-discord-logo-logos-icon-free-download-on-iconfinder.webp"
              width={24}
              height={24}
            />
          </a>
        </div>
      </div>
      <p className="text-sm text-dark/70">&copy; 2025 RoboResume. All rights reserved.</p>
    </footer>
  )
}
