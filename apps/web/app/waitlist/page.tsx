import { Archive, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

export default function WaitlistPage() {
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

          {/* Header Content */}
          <div className="mb-12">
            <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 xl:text-6xl">
              Join the
              <br />
              Disposal{" "}
              <Archive className="mb-2 inline h-12 w-12 text-gray-700" />{" "}
              Waitlist
            </h1>

            <p className="mb-8 text-xl leading-relaxed text-gray-600">
              Be the first to know when our native app launches. We&apos;ll
              notify you as soon as your digital disposal space is ready to
              download.
            </p>
          </div>

          {/* Typeform Embed */}
          <div className="mb-12">
            <div data-tf-live="01K63T0QEKACADFRY383DDGQFA"></div>
            <Script src="//embed.typeform.com/next/embed.js"></Script>
          </div>

          {/* Footer */}
          <div className="mt-12">
            <p className="text-sm text-gray-500">
              Already want to start disposing?{" "}
              <Link
                href="/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 hover:underline"
              >
                Try the web version
              </Link>{" "}
              while you wait.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
