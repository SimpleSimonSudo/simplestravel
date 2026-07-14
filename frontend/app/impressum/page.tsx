import { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, User, FileText, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Notice (Impressum)",
  description: "Legal disclosures and editorial information according to § 5 DDG and § 18 MStV.",
};

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <span className="overline block mb-3">Legal Disclosure</span>
          <h1 className="font-display font-black text-5xl md:text-6xl text-ink mb-4">
            Legal Notice
          </h1>
          <p className="font-body text-dust text-sm md:text-base max-w-2xl leading-relaxed">
            Information according to § 5 Digital Services Act (DDG) and editorial responsibility 
            according to § 18 Section 2 Media State Treaty (MStV).
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Main details card */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Operator Information */}
            <div className="bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <h2 className="font-display font-bold text-2xl text-ink mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-amber" />
                <span>Information about the Publisher</span>
              </h2>
              <div className="font-body text-sm text-ink leading-relaxed space-y-4">
                <p>
                  The website <span className="font-semibold italic">traveling planet earth</span> is operated and published by:
                </p>
                <div className="pl-4 border-l-2 border-amber/30 py-2 space-y-2">
                  <div className="font-semibold text-base text-ink bg-amber/5 px-2.5 py-1 rounded inline-block border border-amber/10">
                    Simon Sebastian Schneider
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-dust shrink-0 mt-1" />
                    <span className="bg-amber/5 px-2.5 py-1.5 rounded border border-amber/10 inline-block font-mono text-xs">
                      Pappelweg 8, 86391 Stadtbergen, Germany
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Responsibility */}
            <div className="bg-white border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:border-amber/35 transition-all duration-300">
              <h2 className="font-display font-bold text-2xl text-ink mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber" />
                <span>Editorial Responsibility</span>
              </h2>
              <div className="font-body text-sm text-ink leading-relaxed space-y-4">
                <p>
                  Responsible for the content in accordance with § 18 Section 2 MStV (German Media State Treaty):
                </p>
                <div className="pl-4 border-l-2 border-amber/30 py-2 space-y-2">
                  <div className="font-semibold text-base text-ink bg-amber/5 px-2.5 py-1 rounded inline-block border border-amber/10">
                    Simon Sebastian Schneider
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-dust shrink-0 mt-1" />
                    <span className="bg-amber/5 px-2.5 py-1.5 rounded border border-amber/10 inline-block font-mono text-xs">
                      Pappelweg 8, 86391 Stadtbergen, Germany
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar / Quick contact column */}
          <div className="space-y-6">
            <div className="bg-white border border-ink/5 p-6 rounded-sm shadow-sm">
              <h3 className="font-display font-bold text-xl text-ink mb-4">
                Quick Contact
              </h3>
              <p className="font-body text-xs text-dust mb-6">
                Direct and fast correspondence according to § 5 Section 1 No. 2 DDG:
              </p>
              <div className="space-y-4 font-body text-sm">
                
                {/* Email Address */}
                <div className="flex flex-col gap-1 p-3 bg-cream/10 rounded-sm border border-ink/5">
                  <div className="flex items-center gap-2 text-dust text-xs">
                    <Mail className="w-3.5 h-3.5 text-amber" />
                    <span>E-Mail</span>
                  </div>
                  <a 
                    href="mailto:simonschneider1@gmx.de"
                    className="font-mono text-xs text-ink font-semibold break-all bg-amber/5 p-2 rounded border border-amber/10 mt-1 hover:text-amber hover:border-amber/40 transition-all duration-200 text-center"
                  >
                    simonschneider1@gmx.de
                  </a>
                </div>

              </div>
            </div>

            <div className="bg-cream/10 border border-ink/10 p-6 rounded-sm space-y-4">
              <h4 className="font-display italic text-amber text-lg">Looking for Privacy?</h4>
              <p className="font-body text-xs text-dust leading-relaxed">
                For detailed disclosures on how we handle personal data, cookies, and network traffic, please check out our Privacy Policy.
              </p>
              <Link 
                href="/datenschutz" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold font-body text-ink hover:text-amber transition-colors duration-200"
              >
                <span>Read Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Sections */}
        <div className="mt-12 pt-10 border-t border-ink/10 space-y-8">
          <h2 className="font-display font-black text-3xl text-ink">
            Disclaimers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body text-sm text-ink leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-ink">Liability for Content</h3>
              <p className="text-dust">
                As a service provider, we are responsible for our own content on these pages in accordance with 
                general laws pursuant to § 7 Section 1 DDG. However, according to §§ 8 to 10 DDG, we are not 
                obligated to monitor transmitted or stored external information or to investigate circumstances 
                indicating illegal activity.
              </p>
              <p className="text-dust">
                Obligations to remove or block the use of information under general statutory laws remain unaffected. 
                However, liability in this regard is only possible from the moment of knowledge of a specific 
                legal infringement. Upon notification of corresponding violations, we will remove this content immediately.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-ink">Liability for External Links</h3>
              <p className="text-dust">
                Our service contains links to external third-party websites over whose content we have no influence. 
                Therefore, we cannot assume any liability for these external contents. The respective provider or 
                operator of the pages is always responsible for the content of the linked pages.
              </p>
              <p className="text-dust">
                The linked pages were checked for possible legal violations at the time of linking. Illegal 
                contents were not recognizable at the time of linking. A permanent content control of the linked 
                pages is not reasonable without concrete evidence of a violation of the law. Upon notification of 
                violations, we will remove such links immediately.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h3 className="font-display font-bold text-lg text-ink">Copyright Notice</h3>
              <p className="text-dust">
                The content and works created by the site operators on these pages are subject to German copyright law. 
                The reproduction, editing, distribution, and any kind of utilization outside the limits of copyright 
                law require the written consent of the respective author or creator. Downloads and copies of this site 
                are permitted for private, non-commercial use only.
              </p>
              <p className="text-dust">
                Insofar as the content on this site was not created by the operator, the copyrights of third parties 
                are respected. In particular, third-party content is identified as such. Should you nevertheless become 
                aware of a copyright infringement, please notify us accordingly. Upon notification of violations, we 
                will remove such content immediately.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
