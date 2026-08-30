import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for the Nerd Gauge platform.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: July 2026</p>

        <nav className="legal-toc" aria-label="Table of contents">
          <h2>Contents</h2>
          <ol>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#information-we-collect">Information We Collect</a></li>
            <li><a href="#how-we-use">How We Use Your Information</a></li>
            <li><a href="#data-retention">Data Retention</a></li>
            <li><a href="#your-rights">Your Rights</a></li>
            <li><a href="#security">Security</a></li>
            <li><a href="#contact">Contact</a></li>
          </ol>
        </nav>

        <section id="introduction">
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy describes how Nerd Gauge (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects,
            uses, and protects your personal information when you use our platform. By using our services, you agree
            to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section id="information-we-collect">
          <h2>2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li>
              <strong>Account Information:</strong> email address, role, and hashed credentials when you create an
              account.
            </li>
            <li>
              <strong>User-Generated Content:</strong> quotes, graffiti, lyrics, and other content you submit through
              the platform.
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type, device information, and usage logs for
              security and analytics purposes.
            </li>
            <li>
              <strong>Cookies:</strong> We use necessary cookies for authentication and optional cookies for analytics
              and performance. See our Cookie Preferences for details.
            </li>
          </ul>
        </section>

        <section id="how-we-use">
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain our services</li>
            <li>To authenticate users and secure the platform</li>
            <li>To moderate user-submitted content</li>
            <li>To improve platform performance and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section id="data-retention">
          <h2>4. Data Retention</h2>
          <p>
            We retain personal data only as long as necessary to provide our services and comply with legal
            obligations. You may request deletion of your account and associated data at any time by contacting us
            through the data deletion request process.
          </p>
        </section>

        <section id="your-rights">
          <h2>5. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul>
            <li>
              <strong>Right to Access:</strong> Request a copy of your personal data.
            </li>
            <li>
              <strong>Right to Rectification:</strong> Request correction of inaccurate data.
            </li>
            <li>
              <strong>Right to Erasure:</strong> Request deletion of your personal data.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> Request your data in a structured, portable format.
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> Withdraw consent for optional cookies and analytics at any
              time.
            </li>
          </ul>
        </section>

        <section id="security">
          <h2>6. Security</h2>
          <p>
            We implement industry-standard security measures including HTTPS, secure cookies, input validation, rate
            limiting, and file upload scanning. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section id="contact">
          <h2>7. Contact</h2>
          <p>
            For privacy-related inquiries, data requests, or to report a concern, please use the contact information
            provided on our platform or reach out through our official channels.
          </p>
        </section>

        <div className="legal-nav">
          <Link href="/terms" className="legal-nav-link">Terms of Service</Link>
          <Link href="/" className="legal-nav-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
