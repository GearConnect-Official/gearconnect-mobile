/**
 * Terms and Conditions data
 * Converted from YAML to TypeScript for direct import (no YAML loader needed)
 */

export interface TermsSection {
  title: string;
  content: string;
}

export interface TermsData {
  title: string;
  lastUpdated: string;
  version: string;
  sections: TermsSection[];
}

export const termsAndConditionsData: TermsData = {
  title: "Terms & Conditions",
  lastUpdated: "2024-01-15",
  version: "1.0",
  sections: [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using GearConnect, you accept and agree to be bound by the terms and provision of this agreement.\n\nIf you do not agree to abide by the above, please do not use this service."
    },
    {
      title: "2. Use License",
      content: "Permission is granted to temporarily download one copy of GearConnect for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:\n\n• modify or copy the materials;\n• use the materials for any commercial purpose, or for any public display (commercial or non-commercial);\n• attempt to decompile or reverse engineer any software contained in GearConnect;\n• remove any copyright or other proprietary notations from the materials; or\n• transfer the materials to another person or \"mirror\" the materials on any other server."
    },
    {
      title: "3. User Accounts",
      content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.\n\nYou agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account."
    },
    {
      title: "4. User Content",
      content: "Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (\"Content\"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.\n\nBy posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service."
    },
    {
      title: "5. Prohibited Uses",
      content: "You may not use GearConnect:\n\n• In any way that violates any applicable national or international law or regulation;\n• To transmit, or procure the sending of, any advertising or promotional material without our prior written consent;\n• To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity;\n• In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful."
    },
    {
      title: "6. Intellectual Property",
      content: "The Service and its original content, features, and functionality are and will remain the exclusive property of GearConnect and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent."
    },
    {
      title: "7. Termination",
      content: "We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.\n\nIf you wish to terminate your account, you may simply discontinue using the Service or delete your account through the settings."
    },
    {
      title: "8. Disclaimer",
      content: "The information on this Service is provided on an \"as is\" basis. To the fullest extent permitted by law, this Company:\n\n• Excludes all representations, warranties, conditions and terms relating to our Service;\n• Excludes all liability for damages arising out of or in connection with your use of this Service."
    },
    {
      title: "9. Limitation of Liability",
      content: "In no event shall GearConnect, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service."
    },
    {
      title: "10. Governing Law",
      content: "These Terms shall be interpreted and governed by the laws of the jurisdiction in which GearConnect operates, without regard to its conflict of law provisions."
    },
    {
      title: "11. Changes to Terms",
      content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.\n\nBy continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms."
    },
    {
      title: "12. Contact Information",
      content: "If you have any questions about these Terms and Conditions, please contact us at:\n\nEmail: support@gearconnect.com\nWebsite: https://gearconnect-landing.vercel.app"
    }
  ]
};
