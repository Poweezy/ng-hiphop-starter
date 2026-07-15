import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for NG Hip Hop platform.',
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: July 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the NG Hip Hop platform, you agree to be bound by these Terms of Service. If you
            do not agree with any part of these terms, you may not use our services.
          </p>
        </section>

        <section>
          <h2>2. Intellectual Property</h2>
          <p>
            All content published on this platform is licensed, owned, and legally distributed. Unauthorized use,
            reproduction, or distribution of any content is prohibited. Users retain ownership of content they submit,
            but grant us a license to host, display, and moderate such content.
          </p>
        </section>

        <section>
          <h2>3. User Content</h2>
          <p>
            Users may submit quotes, graffiti, lyrics, and other content. By submitting content, you represent that:
          </p>
          <ul>
            <li>You own or have the necessary rights to the content</li>
            <li>The content does not violate any laws or third-party rights</li>
            <li>The content is not harmful, defamatory, or abusive</li>
          </ul>
          <p>We reserve the right to remove or moderate any content that violates these terms.</p>
        </section>

        <section>
          <h2>4. Prohibited Activities</h2>
          <p>You may not:</p>
          <ul>
            <li>Upload malicious files or content</li>
            <li>Attempt to gain unauthorized access to admin areas</li>
            <li>Use the platform for illegal purposes</li>
            <li>Interfere with the platform&apos;s security or functionality</li>
            <li>Scrape or harvest data without permission</li>
          </ul>
        </section>

        <section>
          <h2>5. Disclaimer</h2>
          <p>
            The platform is provided on an &quot;as-is&quot; basis without warranties of any kind. We do not guarantee
            uninterrupted access or error-free operation. We are not liable for any damages arising from your use of
            the platform.
          </p>
        </section>

        <section>
          <h2>6. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            If you have questions about these terms, please contact us through the official channels provided on our
            platform.
          </p>
        </section>

        <div className="legal-nav">
          <Link href="/privacy" className="legal-nav-link">Privacy Policy</Link>
          <Link href="/" className="legal-nav-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
