import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import ScreenShell from '../components/ScreenShell';
import ScreenHeader from '../components/ScreenHeader';

export default function TermsScreen() {
  const navigate = useNavigate();

  return (
    <ScreenShell>
      <ScreenHeader
        left={
          <button onClick={() => navigate(-1)} className="text-accent">
            <ArrowLeft size={24} weight="bold" />
          </button>
        }
        center={<span className="text-sm font-medium tracking-wider">Terms of Service</span>}
      />
      <div className="flex-1 overflow-y-auto px-5 pb-16" style={{ textTransform: 'none', letterSpacing: 0 }}>
        <div className="max-w-[640px] mx-auto space-y-6 text-[13px] leading-relaxed text-accent/80">
          <p className="text-muted text-[11px]">Last updated: March 25, 2026</p>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Solaire at solaire.pics (the "Service"), you agree to be bound
              by these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">2. Description of Service</h2>
            <p>
              Solaire is a browser-based photo editor and camera application that applies cinematic
              color grading (LUT filters) to your photos. The Service is provided as a progressive
              web app (PWA) and works on modern browsers and mobile devices.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">3. User Accounts</h2>
            <p>
              You may use the Service as a guest or sign in with your Google account. Signing in
              enables cloud syncing of your photos and edits across devices. You are responsible
              for maintaining the security of your Google account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">4. Your Content</h2>
            <p className="mb-2">
              You retain full ownership of all photos and content you create, import, or edit
              using the Service. We do not claim any rights to your content.
            </p>
            <p>
              You are solely responsible for ensuring you have the right to use any photos you
              import into the Service.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer, decompile, or extract the source code of our proprietary LUT filters</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Circumvent any access restrictions or security measures</li>
              <li>Use automated tools to scrape or access the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">6. Intellectual Property</h2>
            <p>
              The Solaire name, logo, LUT filter packs, user interface design, and all related
              intellectual property are owned by us. You may not copy, modify, distribute, or
              create derivative works from our proprietary materials without permission.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">7. Watermark</h2>
            <p>
              Photos exported from the free tier of the Service may include a visible watermark.
              The watermark is part of the Service and may not be removed, obscured, or altered
              except through features explicitly provided within the app.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">8. Availability & Changes</h2>
            <p>
              We strive to keep the Service available at all times but do not guarantee
              uninterrupted access. We reserve the right to modify, suspend, or discontinue any
              part of the Service at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind,
              whether express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of data or
              photos, arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">11. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service at our sole discretion,
              without notice, for conduct that we believe violates these Terms or is harmful to
              other users or us.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Changes will be posted on this page
              with an updated date. Continued use of the Service after changes constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-accent font-semibold text-sm mb-2">13. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
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
