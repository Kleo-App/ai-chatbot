import { Footer } from '@/components/footer';
import { LoggedOutHeader } from '@/components/logged-out-header';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <LoggedOutHeader showJoinWaitlist={false} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-16 pt-24">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-4xl font-medium text-gray-900 mb-8">Privacy Policy</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when you create an account, use our services, or communicate with us.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Name and email address</li>
                <li>Profile information you choose to provide</li>
                <li>Content you create using our AI tools</li>
                <li>Communications with our support team</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">Usage Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>How you interact with our service</li>
                <li>Features you use and content you generate</li>
                <li>Time, frequency, and duration of your activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Develop new features and services</li>
                <li>Protect against fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except as described in this policy.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-3">We may share information:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>With service providers who assist us in operating our platform</li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
                <li>With your consent or at your direction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="text-gray-700">
                However, no method of transmission over the internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Request correction of inaccurate information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this privacy policy, please contact us at support@kleo.so
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 