import { Metadata } from "next";
import Link from "next/link";
import { 
  ShieldAlert, 
  User, 
  Server, 
  Cloud, 
  MessageSquare, 
  Lock, 
  UserCheck, 
  ArrowRight 
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy (Datenschutz)",
  description: "Privacy policy and information about data processing according to GDPR and TDDDG.",
};

const SECTIONS = [
  { id: "controller", label: "1. Data Controller", icon: User },
  { id: "hosting", label: "2. Server Log Files", icon: Server },
  { id: "cloudflare", label: "3. Cloudflare CDN", icon: Cloud },
  { id: "comments", label: "4. Comments System", icon: MessageSquare },
  { id: "security", label: "5. SSL/TLS Encryption", icon: Lock },
  { id: "rights", label: "6. Data Subject Rights", icon: UserCheck },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <header className="mb-12 text-center md:text-left">
          <span className="overline block mb-3">Data Protection</span>
          <h1 className="font-display font-black text-5xl md:text-6xl text-ink mb-4">
            Privacy Policy
          </h1>
          <p className="font-body text-dust text-sm md:text-base max-w-2xl leading-relaxed">
            Information on how we handle, process, and protect your personal data in compliance 
            with the General Data Protection Regulation (GDPR) and the Telecommunications-Telemedia 
            Data Protection Act (TDDDG).
          </p>
        </header>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
          
          {/* Sticky Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-32 self-start bg-white border border-ink/5 p-6 rounded-sm shadow-sm">
            <h3 className="font-display font-bold text-lg text-ink mb-4 pb-2 border-b border-ink/5">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-body font-medium text-dust hover:text-amber hover:bg-cream/20 rounded transition-all duration-200 group"
                  >
                    <Icon className="w-3.5 h-3.5 text-dust group-hover:text-amber transition-colors" />
                    <span>{sec.label}</span>
                  </a>
                );
              })}
            </nav>
            <div className="mt-8 pt-6 border-t border-ink/5 space-y-4">
              <h4 className="font-display italic text-amber text-sm">Need Legal Information?</h4>
              <p className="font-body text-[11px] text-dust leading-relaxed">
                For legal disclosures, editorial responsibilities, and site publisher details, please check out the Legal Notice.
              </p>
              <Link 
                href="/impressum" 
                className="inline-flex items-center gap-1 text-[11px] font-semibold font-body text-ink hover:text-amber transition-colors duration-200"
              >
                <span>Read Legal Notice</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* Privacy Policy Sections */}
          <div className="lg:col-span-3 space-y-8 font-body text-sm text-ink leading-relaxed">
            
            {/* Section 1: Data Controller */}
            <section id="controller" className="scroll-mt-32 bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber/5 rounded border border-amber/15">
                  <User className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink">
                  1. Data Controller
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  The "Controller" responsible for data processing on this website (in accordance with Art. 4 No. 7 GDPR) is:
                </p>
                <div className="pl-4 border-l-2 border-amber/30 py-2 space-y-2">
                  <div className="font-semibold text-base text-ink bg-amber/5 px-2.5 py-1 rounded inline-block border border-amber/10">
                    Simon Sebastian Schneider
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <span className="bg-amber/5 px-2.5 py-1.5 rounded border border-amber/10 inline-block font-mono text-xs">
                      Pappelweg 8, 86391 Stadtbergen, Germany
                    </span>
                  </div>
                  <div className="text-xs text-dust pt-1">
                    Email: <a href="mailto:simonschneider1@gmx.de" className="font-mono bg-amber/5 px-1.5 py-0.5 rounded border border-amber/10 text-ink font-semibold hover:text-amber transition-colors">simonschneider1@gmx.de</a>
                  </div>
                </div>
                <p className="text-dust text-xs">
                  The controller is the natural or legal person who, alone or jointly with others, determines the purposes and means of the processing of personal data (e.g., names, email addresses, etc.).
                </p>
              </div>
            </section>

            {/* Section 2: Website Provisioning & Server Log Files */}
            <section id="hosting" className="scroll-mt-32 bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber/5 rounded border border-amber/15">
                  <Server className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink">
                  2. Web Hosting & Server Log Files
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  Every time you visit our website, our system automatically collects data and information from the computer system of the calling device. The following data is temporarily stored in the server's log files:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-dust">
                  <li>Browser type, language, and version used</li>
                  <li>Operating system of the accessing device</li>
                  <li>Internet Service Provider of the user</li>
                  <li>IP address of the user (anonymized/truncated where necessary)</li>
                  <li>Date and time of the request</li>
                  <li>Websites from which the user's system reached our website (referrers)</li>
                  <li>Websites accessed by the user's system through our website</li>
                </ul>
                <p>
                  <strong>Legal Basis:</strong> The processing is carried out pursuant to <strong>Art. 6 Abs. 1 lit. f GDPR</strong> based on our legitimate interest in improving the stability, functionality, and security of our website.
                </p>
                <p>
                  <strong>Purpose of Processing:</strong> Temporary storage of the IP address by the system is necessary to enable delivery of the website to the user's computer. Storage in log files is done to ensure the website's technical operability and to counter network attacks. The log data is deleted as soon as it is no longer required to achieve the purpose of its collection (normally after 7 to 14 days).
                </p>
              </div>
            </section>

            {/* Section 3: Cloudflare CDN & Security Integration */}
            <section id="cloudflare" className="scroll-mt-32 bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber/5 rounded border border-amber/15">
                  <Cloud className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink">
                  3. Cloudflare CDN & Security Proxy
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  We secure and optimize the delivery of this website using services provided by <strong>Cloudflare, Inc.</strong> (101 Townsend St., San Francisco, CA 94107, USA; "Cloudflare").
                </p>
                <p>
                  Cloudflare acts as a security proxy and Content Delivery Network (CDN). This means all network traffic to and from our website is routed through Cloudflare's global infrastructure. During this routing process, Cloudflare analyzes network traffic to block malicious activities, DDoS attacks, and spam bots, and caches static content to reduce page load times.
                </p>
                <p>
                  <strong>Data Processing:</strong> In this context, log files containing IP addresses, device metadata, performance metrics, and request headers may be processed. Because Cloudflare is a US-based company, some of this data may be transferred to servers in the United States.
                </p>
                <p>
                  <strong>Legal Basis:</strong> The integration is based on <strong>Art. 6 Abs. 1 lit. f GDPR</strong>. Our legitimate interest lies in defending our website against malicious cyber attacks (e.g. DDoS, vulnerability exploits) and in providing a fast, reliable, and secure globally distributed browsing experience.
                </p>
                <p>
                  <strong>Safety Safeguards:</strong> We have concluded a <strong>Data Processing Agreement (DPA / Auftragsverarbeitungsvertrag)</strong> with Cloudflare containing the standard contractual clauses (SCCs) approved by the EU Commission, ensuring that Cloudflare handles your data securely and in accordance with European data protection levels. Cloudflare, Inc. is also certified under the EU-US Data Privacy Framework, which guarantees a level of data protection comparable to the EU.
                </p>
                <p>
                  For more details, please review Cloudflare's privacy policy:{" "}
                  <a 
                    href="https://www.cloudflare.com/privacypolicy/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-amber hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Cloudflare Privacy Policy</span>
                    <ArrowRight className="w-3 h-3 inline rotate-45" />
                  </a>.
                </p>
              </div>
            </section>

            {/* Section 4: Comment Functionality */}
            <section id="comments" className="scroll-mt-32 bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber/5 rounded border border-amber/15">
                  <MessageSquare className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink">
                  4. Comment Functionality
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  When you leave a comment on our blog posts, the data you enter into the comment form (including your name/pseudonym, email address, and comment text) is stored on our servers. In addition, your IP address is logged.
                </p>
                <p>
                  <strong>Legal Basis:</strong> Data processing for comments is based on your consent in accordance with <strong>Art. 6 Abs. 1 lit. a GDPR</strong>. By writing a comment and submitting it, you consent to the storage and display of your comment and the associated name or pseudonym.
                </p>
                <p>
                  <strong>Purpose & Safety:</strong> Storing the comment and name is necessary to publish the discussion on the website. Logging the IP address is done for security reasons, enabling us to trace spam or identify and defend against potentially unlawful statements (e.g., hate speech, slander).
                </p>
                <p>
                  <strong>Storage Period:</strong> Comments and the associated data will remain stored on our servers until the commented content has been completely deleted or the comment has to be removed for legal reasons. You can withdraw your consent and request the deletion of your comments at any time by contacting the Data Controller.
                </p>
              </div>
            </section>

            {/* Section 5: SSL/TLS Encryption */}
            <section id="security" className="scroll-mt-32 bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber/5 rounded border border-amber/15">
                  <Lock className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink">
                  5. SSL and TLS Encryption
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  For security reasons and to protect the transmission of confidential content (such as comments or inquiries you send to us as the site operator), this site uses <strong>SSL (Secure Sockets Layer)</strong> or <strong>TLS (Transport Layer Security)</strong> encryption.
                </p>
                <p>
                  You can recognize an encrypted connection by the change in the address line of the browser from <code>http://</code> to <code>https://</code> and by the padlock icon in your browser's address bar.
                </p>
                <p>
                  When SSL or TLS encryption is activated, the data you transmit to us cannot be read by unauthorized third parties.
                </p>
              </div>
            </section>

            {/* Section 6: Rights of Data Subjects */}
            <section id="rights" className="scroll-mt-32 bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber/5 rounded border border-amber/15">
                  <UserCheck className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink">
                  6. Rights of Data Subjects
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  As a data subject, you have the following rights under the GDPR regarding the processing of your personal data:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  <div className="p-4 bg-cream/10 border border-ink/5 rounded-sm">
                    <h4 className="font-display font-semibold text-ink mb-1.5">Right to Access (Art. 15 GDPR)</h4>
                    <p className="text-xs text-dust">
                      You have the right to request confirmation as to whether your personal data is being processed, and to obtain information about it and a copy of the data.
                    </p>
                  </div>

                  <div className="p-4 bg-cream/10 border border-ink/5 rounded-sm">
                    <h4 className="font-display font-semibold text-ink mb-1.5">Right to Rectification (Art. 16 GDPR)</h4>
                    <p className="text-xs text-dust">
                      You have the right to request the rectification of inaccurate personal data or the completion of incomplete data concerning you.
                    </p>
                  </div>

                  <div className="p-4 bg-cream/10 border border-ink/5 rounded-sm">
                    <h4 className="font-display font-semibold text-ink mb-1.5">Right to Erasure (Art. 17 GDPR)</h4>
                    <p className="text-xs text-dust">
                      You have the right to demand that personal data concerning you be deleted immediately (also known as the "right to be forgotten").
                    </p>
                  </div>

                  <div className="p-4 bg-cream/10 border border-ink/5 rounded-sm">
                    <h4 className="font-display font-semibold text-ink mb-1.5">Right to Restriction (Art. 18 GDPR)</h4>
                    <p className="text-xs text-dust">
                      You have the right to request the restriction of processing in certain situations (e.g., while the accuracy of your data is being verified).
                    </p>
                  </div>

                  <div className="p-4 bg-cream/10 border border-ink/5 rounded-sm">
                    <h4 className="font-display font-semibold text-ink mb-1.5">Right to Data Portability (Art. 20 GDPR)</h4>
                    <p className="text-xs text-dust">
                      You have the right to receive your personal data in a structured, commonly used, and machine-readable format.
                    </p>
                  </div>

                  <div className="p-4 bg-cream/10 border border-ink/5 rounded-sm">
                    <h4 className="font-display font-semibold text-ink mb-1.5">Right to Object & Withdraw (Art. 21 & 7 GDPR)</h4>
                    <p className="text-xs text-dust">
                      You have the right to object to data processing based on legitimate interests, and to withdraw your consent to data processing at any time.
                    </p>
                  </div>

                </div>

                <div className="mt-4 p-4 bg-amber/5 border border-amber/20 rounded-sm">
                  <h4 className="font-display font-bold text-ink mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber" />
                    <span>Right to Lodge a Complaint (Art. 77 GDPR)</span>
                  </h4>
                  <p className="text-xs text-dust">
                    Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with a data protection supervisory authority, in particular in the Member State of your habitual residence, place of work, or place of the alleged infringement, if you consider that the processing of personal data relating to you infringes the GDPR.
                  </p>
                </div>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
