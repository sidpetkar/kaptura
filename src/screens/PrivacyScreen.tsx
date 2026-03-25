import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import ScreenShell from '../components/ScreenShell';
import ScreenHeader from '../components/ScreenHeader';

export default function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <ScreenShell>
      <ScreenHeader
        left={
          <button onClick={() => navigate(-1)} className="text-accent">
            <ArrowLeft size={24} weight="bold" />
          </button>
        }
        center={<span className="text-sm font-medium tracking-wider">Privacy Policy</span>}
      />
      <div className="flex-1 overflow-y-auto px-5 pb-16" style={{ textTransform: 'none', letterSpacing: 0 }}>
        <div className="max-w-[640px] mx-auto space-y-6 text-[13px] leading-relaxed text-accent/80">
          <p className="text-muted text-[11px]">Last updated: March 25, 2026</p>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">1. Introduction</h2>
            <p>
              Solaire ("we", "our", or "us") operates the website at solaire.pics and the Solaire
              progressive web application (the "Service"). This Privacy Policy explains how we
              collect, use, and protect your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">2. Information We Collect</h2>
            <p className="mb-2">
              <strong className="text-accent">Account information:</strong> When you sign in with
              Google, we receive your name, email address, and profile photo from your Google
              account. We use this solely to identify you within the app and enable cloud sync.
            </p>
            <p className="mb-2">
              <strong className="text-accent">Photos and edits:</strong> Photos you import or
              capture are stored locally on your device using IndexedDB. If you are signed in,
              edited photos may be synced to cloud storage (Firebase) linked to your account.
            </p>
            <p>
              <strong className="text-accent">Usage data:</strong> We do not use third-party
              analytics trackers. Basic server logs (IP address, browser type) may be collected
              by our hosting providers (Vercel, Cloudflare) as part of standard web infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide and maintain the Service</li>
              <li>To sync your photos and edits across devices when signed in</li>
              <li>To identify your account and display your profile</li>
              <li>To communicate important service updates if necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">4. Data Storage & Security</h2>
            <p>
              Your photos are primarily stored on your device. Cloud-synced data is stored in
              Google Firebase (Firestore and Cloud Storage) under your authenticated user ID.
              We use industry-standard security measures including HTTPS encryption and Firebase
              security rules to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">5. Third-Party Services</h2>
            <p>We rely on the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong className="text-accent">Google Firebase</strong> — authentication, database, and cloud storage</li>
              <li><strong className="text-accent">Vercel</strong> — web hosting and deployment</li>
              <li><strong className="text-accent">Cloudflare</strong> — asset delivery (LUT files)</li>
              <li><strong className="text-accent">Google Gemini AI</strong> — optional AI-powered features</li>
            </ul>
            <p className="mt-2">
              Each of these services has its own privacy policy. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">6. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We do not
              share your photos with anyone. Data is only shared with the third-party services
              listed above as necessary to operate the Service.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">7. Your Rights</h2>
            <p>You can:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Access and export your photos at any time by downloading them</li>
              <li>Delete your locally stored data by clearing your browser storage</li>
              <li>Sign out to stop cloud syncing</li>
              <li>Request deletion of your cloud data by contacting us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">8. Cookies & Local Storage</h2>
            <p>
              We use browser local storage and IndexedDB to save your preferences, session state,
              and photo data. We do not use tracking cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">9. Children's Privacy</h2>
            <p>
              The Service is not directed to children under 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated date. Continued use of the Service after changes constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">11. Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:siddhantpetkar@gmail.com" className="underline text-accent">
                siddhantpetkar@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </ScreenShell>
  );
}
