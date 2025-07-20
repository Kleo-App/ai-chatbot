import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full px-8 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/kleo.svg"
              alt="Kleo"
              width={107}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                Get Started
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-4xl font-medium text-gray-900 mb-8">Terms of Service</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Kleo (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-700">
                These Terms of Service (&quot;Terms&quot;) govern your use of our website located at kleo.ai and our AI-powered content generation service operated by Kleo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Kleo is an AI-powered platform that helps users create engaging content for LinkedIn and other social media platforms. Our service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>AI-generated content suggestions and templates</li>
                <li>Content editing and optimization tools</li>
                <li>Analytics and performance insights</li>
                <li>Collaboration features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Generate content that is illegal, harmful, threatening, abusive, or discriminatory</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others, including intellectual property rights</li>
                <li>Generate spam, misleading, or deceptive content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service for any commercial purpose without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of any content you create using our Service. However, you grant us a limited license to use, process, and improve our AI models using your content in anonymized and aggregated form.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Our Content</h3>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are owned by Kleo and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">AI-Generated Content</h3>
              <p className="text-gray-700">
                Content generated by our AI tools is provided &quot;as is&quot; and you are responsible for reviewing, editing, and ensuring the accuracy and appropriateness of any AI-generated content before use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy Policy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription and Payment</h2>
              <p className="text-gray-700 mb-4">
                Some aspects of the Service may be provided for a fee. You agree to pay all fees associated with your use of paid features.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Subscription fees are billed in advance on a recurring basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change our fees with reasonable notice</li>
                <li>You are responsible for any taxes associated with your use of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
              <p className="text-gray-700">
                You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
              <p className="text-gray-700 mb-4">
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We disclaim all warranties, whether express or implied, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Warranties of merchantability and fitness for a particular purpose</li>
                <li>That the Service will be uninterrupted or error-free</li>
                <li>That defects will be corrected</li>
                <li>That the Service is free of viruses or harmful components</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700">
                In no event shall Kleo be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be interpreted and governed by the laws of Texas, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Texas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms, please contact us at support@kleo.so
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 