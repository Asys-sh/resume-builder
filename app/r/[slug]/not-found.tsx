export default function ResumeNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefae0]">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-3xl font-black text-[#3a3226]">Resume Not Found</h1>
        <p className="text-[#6f6454] text-base">
          This resume is either private or the link has expired.
        </p>
        <a
          href="/"
          className="inline-block mt-2 text-[#d4a373] underline font-semibold hover:text-[#d4a373]/80"
        >
          Go to Landed →
        </a>
      </div>
    </div>
  )
}
