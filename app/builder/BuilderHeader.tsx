"use client";

import { Download, LayoutDashboard, Save } from "lucide-react";
import Link from "next/link";
import { SnapshotDrawer } from "@/components/builder/SnapshotDrawer";

interface BuilderHeaderProps {
  isSaving: boolean;
  onSave: () => void;
  onDownload: (format: "pdf" | "word" | "text") => void;
  resumeId?: string | null;
}

export function BuilderHeader({
  isSaving,
  onSave,
  onDownload,
  resumeId,
}: BuilderHeaderProps) {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-color/50 px-4 sm:px-6 md:px-10 py-3 bg-background-light sticky top-0 z-20">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 text-text-main hover:opacity-80 transition-opacity"
      >
        <div className="size-7 text-primary">
          <svg
            fill="currentColor"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z M16 24A8 8 0 0 1 32 24A8 8 0 0 1 16 24Z"
            />
          </svg>
        </div>
        <span className="text-lg font-bold leading-tight tracking-tight">
          Landed
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Dashboard link */}
        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium text-text-subtle hover:text-text-main transition-colors px-3 py-2 rounded-lg hover:bg-border-color/30"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* History button */}
        {resumeId && <SnapshotDrawer resumeId={resumeId} />}

        {/* Save button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          aria-label="Save"
          className="flex items-center gap-2 cursor-pointer rounded-xl h-10 px-4 bg-border-color/50 text-text-main text-sm font-semibold hover:bg-border-color/80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isSaving ? "Saving…" : "Save"}
          </span>
        </button>

        {/* Download button */}
        <button
          type="button"
          onClick={() => onDownload("pdf")}
          aria-label="Download PDF"
          className="flex items-center gap-2 cursor-pointer rounded-xl h-10 px-4 bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </button>

        <span aria-live="polite" className="sr-only">
          {isSaving ? "Saving..." : ""}
        </span>
      </div>
    </header>
  );
}
