import { Archive, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen items-center bg-white">
      <div className="w-full px-6 py-12">
        <div className="mx-auto max-w-4xl">
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

          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 xl:text-6xl">
              Terms of
              <br />
              Service{" "}
              <Archive className="mb-2 inline h-12 w-12 text-gray-700" />
            </h1>
            <p className="text-xl leading-relaxed text-gray-600">
              Understanding your rights and responsibilities when using our
              digital disposal space.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: September 2025
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-12">
            {/* Section 1 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                1. Acceptance of Terms
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  By accessing and using our disposal space service, you accept
                  and agree to be bound by the terms and provision of this
                  agreement. If you do not agree to abide by the above, please
                  do not use this service.
                </p>
                <p>
                  Our disposal space is designed for storing digital items you
                  no longer want cluttering your active workspace but may need
                  to recover later. By using this service, you acknowledge the
                  unique nature of digital disposal and recovery.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                2. Service Description
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Our disposal space provides a hidden cloud storage solution
                  where you can:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    Dispose of files, documents, and digital items you want to
                    hide from daily view
                  </li>
                  <li>
                    Organize disposed items in folders and categories for future
                    reference
                  </li>
                  <li>Restore items when needed without permanent deletion</li>
                  <li>Maintain a clean, clutter-free primary workspace</li>
                </ul>
                <p>
                  The service is intended for legitimate disposal and recovery
                  needs. We reserve the right to monitor usage patterns to
                  ensure compliance with these terms.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                3. User Responsibilities
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>When using our disposal space, you agree to:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    Only dispose of content you own or have the right to store
                  </li>
                  <li>
                    Not use the service for illegal, harmful, or malicious
                    content
                  </li>
                  <li>Respect storage limits and usage guidelines</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>
                    Understand that disposed items remain your responsibility
                  </li>
                </ul>
                <p>
                  You acknowledge that while items are &quot;disposed&quot; from
                  your active view, they remain stored and accessible through
                  the disposal space interface.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                4. Data and Privacy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Your disposed items are stored securely with industry-standard
                  encryption. We understand the sensitive nature of items you
                  choose to dispose of and maintain strict privacy standards.
                </p>
                <p>
                  We do not access, read, or analyze your disposed content
                  except as required for service operation or legal compliance.
                  Your disposal patterns and storage usage may be analyzed in
                  aggregate for service improvement.
                </p>
                <p>
                  You retain full ownership of all disposed items and can
                  restore or permanently delete them at any time through your
                  disposal space dashboard.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                5. Service Availability
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We strive to maintain high availability of your disposal
                  space, but cannot guarantee uninterrupted service. Scheduled
                  maintenance and unexpected outages may occur.
                </p>
                <p>
                  We recommend maintaining local backups of critical disposed
                  items, as with any cloud storage service. While we implement
                  robust backup and recovery systems, you remain responsible for
                  your data.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                6. Account Termination
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  You may terminate your account at any time through the
                  settings page. Upon termination, you will have 30 days to
                  export your disposed items before permanent deletion.
                </p>
                <p>
                  We reserve the right to terminate accounts that violate these
                  terms or engage in harmful activities. In such cases, we will
                  provide reasonable notice and opportunity to export data where
                  legally permissible.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                7. Limitation of Liability
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Our disposal space service is provided &quot;as is&quot;
                  without warranties of any kind. We are not liable for any loss
                  of disposed items, service interruptions, or consequential
                  damages.
                </p>
                <p>
                  The unique nature of digital disposal means that recovery of
                  items depends on service availability and your account status.
                  We encourage regular exports of important disposed items.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                8. Changes to Terms
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update these terms to reflect changes in our service or
                  legal requirements. Significant changes will be communicated
                  through your disposal space dashboard and email notifications.
                </p>
                <p>
                  Continued use of the service after term updates constitutes
                  acceptance of the new terms. If you disagree with changes, you
                  may terminate your account as described above.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-gray-200 pt-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Contact Us
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  If you have questions about these terms or our disposal space
                  service, please contact us:
                </p>
                <div className="space-y-2">
                  <p>Email: legal@disposalspace.com</p>
                  <p>Support: help@disposalspace.com</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="mt-16 flex flex-col gap-4 lg:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-4 font-medium text-white transition-colors hover:bg-gray-800"
            >
              <Archive className="mr-2 h-5 w-5" />
              Start Disposing
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
