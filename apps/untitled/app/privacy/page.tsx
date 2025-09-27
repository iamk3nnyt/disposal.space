import { Archive, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
              Privacy
              <br />
              Policy <Archive className="mb-2 inline h-12 w-12 text-gray-700" />
            </h1>
            <p className="text-xl leading-relaxed text-gray-600">
              How we protect and handle your disposed items and personal
              information in our digital disposal space.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: September 2025
            </p>
          </div>

          {/* Privacy Content */}
          <div className="space-y-12">
            {/* Section 1 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                1. Information We Collect
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We collect information to provide you with a secure and
                  effective disposal space experience:
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Account Information
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>Email address for account creation and recovery</li>
                      <li>Encrypted password for account security</li>
                      <li>Account preferences and settings</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Disposed Content
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        Files, documents, and digital items you choose to
                        dispose
                      </li>
                      <li>
                        Folder structures and organization you create in your
                        disposal space
                      </li>
                      <li>
                        Metadata such as file names, sizes, and disposal dates
                      </li>
                      <li>
                        Disposal and restoration activity logs for your account
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Usage Information
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>Storage usage and disposal patterns</li>
                      <li>Feature usage and interaction data</li>
                      <li>Device and browser information</li>
                      <li>IP address and general location data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                2. How We Use Your Information
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Your information is used exclusively to provide and improve
                  our disposal space service:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <strong>Service Operation:</strong> Store, organize, and
                    retrieve your disposed items securely
                  </li>
                  <li>
                    <strong>Account Management:</strong> Maintain your account,
                    process authentication, and provide support
                  </li>
                  <li>
                    <strong>Service Improvement:</strong> Analyze usage patterns
                    in aggregate to enhance disposal and recovery features
                  </li>
                  <li>
                    <strong>Security:</strong> Monitor for suspicious activity
                    and protect against unauthorized access
                  </li>
                  <li>
                    <strong>Communication:</strong> Send important service
                    updates, security alerts, and account notifications
                  </li>
                </ul>
                <p className="mt-4 rounded-lg bg-gray-50 p-4">
                  <strong>Important:</strong> We never access, read, or analyze
                  the content of your disposed items except as required for
                  technical service operation or legal compliance.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                3. Data Security and Encryption
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We understand that disposed items are often sensitive or
                  personal. Our security measures include:
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      End-to-End Encryption
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        All disposed items are encrypted before leaving your
                        device
                      </li>
                      <li>
                        256-bit AES encryption protects your data at rest and in
                        transit
                      </li>
                      <li>
                        Encryption keys are managed securely and separately from
                        your data
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Infrastructure Security
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        Data stored in secure, certified cloud infrastructure
                      </li>
                      <li>Regular security audits and penetration testing</li>
                      <li>
                        Multi-factor authentication available for your account
                      </li>
                      <li>Automated backup and disaster recovery systems</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                4. Data Sharing and Disclosure
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We do not sell, rent, or share your personal information or
                  disposed content with third parties, except in these limited
                  circumstances:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <strong>Service Providers:</strong> Trusted partners who
                    help operate our infrastructure, subject to strict
                    confidentiality agreements
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law,
                    court order, or to protect our rights and users&apos; safety
                  </li>
                  <li>
                    <strong>Business Transfer:</strong> In the event of a merger
                    or acquisition, with advance notice to users
                  </li>
                  <li>
                    <strong>Emergency Situations:</strong> To prevent harm to
                    individuals or protect public safety
                  </li>
                </ul>
                <p className="mt-4">
                  In all cases, we will make reasonable efforts to notify you
                  unless prohibited by law or court order.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                5. Your Privacy Rights
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  You have full control over your disposed items and personal
                  information:
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Access and Control
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        View, restore, or permanently delete any disposed items
                      </li>
                      <li>Export all your data in standard formats</li>
                      <li>Update your account information and preferences</li>
                      <li>Delete your account and all associated data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Regional Rights
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        GDPR rights for EU users (access, rectification,
                        erasure, portability)
                      </li>
                      <li>
                        CCPA rights for California users (know, delete, opt-out)
                      </li>
                      <li>
                        Other regional privacy rights as applicable to your
                        location
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                6. Data Retention
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We retain your information only as long as necessary to
                  provide our disposal space service:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <strong>Disposed Items:</strong> Stored until you restore or
                    permanently delete them
                  </li>
                  <li>
                    <strong>Account Data:</strong> Maintained while your account
                    is active
                  </li>
                  <li>
                    <strong>Usage Logs:</strong> Kept for up to 12 months for
                    security and service improvement
                  </li>
                  <li>
                    <strong>After Deletion:</strong> 30-day recovery period,
                    then permanent deletion from all systems
                  </li>
                </ul>
                <p className="mt-4">
                  You can request immediate deletion of specific items or your
                  entire account through your disposal space dashboard.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                7. Cookies and Tracking
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We use minimal tracking to provide essential functionality:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <strong>Essential Cookies:</strong> Required for login,
                    security, and basic functionality
                  </li>
                  <li>
                    <strong>Performance Cookies:</strong> Help us understand how
                    the disposal space is used (anonymized)
                  </li>
                  <li>
                    <strong>No Advertising:</strong> We do not use cookies for
                    advertising or marketing purposes
                  </li>
                </ul>
                <p className="mt-4">
                  You can control cookie preferences through your browser
                  settings, though some features may not work without essential
                  cookies.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                8. Changes to This Policy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update this privacy policy to reflect changes in our
                  practices or legal requirements. Significant changes will be
                  communicated through:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Email notification to your registered address</li>
                  <li>Prominent notice in your disposal space dashboard</li>
                  <li>Updated policy posted on our website</li>
                </ul>
                <p className="mt-4">
                  Continued use of the service after policy updates constitutes
                  acceptance of the new terms.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-gray-200 pt-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Contact Us About Privacy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  If you have questions about this privacy policy or how we
                  handle your disposed items, please contact us:
                </p>
                <div className="space-y-2">
                  <p>Privacy Officer: privacy@disposalspace.com</p>
                  <p>Data Protection: dpo@disposalspace.com</p>
                  <p>General Support: help@disposalspace.com</p>
                </div>
                <p className="mt-4 text-sm">
                  For privacy-related requests, please include &quot;Privacy
                  Request&quot; in your subject line and allow up to 30 days for
                  response.
                </p>
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
              href="/terms"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              View Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
