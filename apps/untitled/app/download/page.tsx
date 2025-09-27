import { Archive, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen items-center bg-white">
      <div className="w-full px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {/* Back Link */}
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 xl:text-6xl">
            App Coming
            <br />
            Soon
          </h1>

          {/* Description */}
          <p className="mb-8 text-xl leading-relaxed text-gray-600">
            We&apos;re building a native app for your disposal space. While we
            work on it, you can use the full experience in your browser.
          </p>

          {/* Expected Launch */}
          <div className="mb-12">
            <p className="text-sm font-medium tracking-wider text-gray-500 uppercase">
              Expected Launch
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">Q2 2026</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 lg:flex-row">
            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-4 font-medium text-white transition-colors hover:bg-gray-800"
            >
              <Archive className="mr-2 h-5 w-5" />
              Start Disposing
            </Link>
            <a
              href="/waitlist"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              Get notified
            </a>
          </div>

          {/* Footer Note */}
          <div className="mt-12">
            <p className="text-sm text-gray-500">
              Start using the web version and we&apos;ll notify you when the app
              is ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
