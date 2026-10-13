import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

type PolicyType = 'privacy' | 'terms' | 'refund' | null;

interface PolicyModalProps {
  policy: PolicyType;
  onClose: () => void;
}

const POLICY_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    content: (
      <div className="space-y-4 font-sans text-gray-600 leading-relaxed max-w-none">
        <p className="font-semibold text-gray-900">Your privacy is important to us. Learn how we collect, use, and protect your information.</p>
        <p className="text-sm">Last updated: January 2026</p>
        
        <h3 className="text-lg font-bold text-gray-900 mt-6">1. Information We Collect</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Personal Information:</strong> Name, email address, and phone number, account credentials and profile information, payment information (processed securely through third-party providers), and communication preferences.</li>
          <li><strong>Technical Information:</strong> IP address, browser type, device information, usage data and analytics, cookies and similar tracking technologies.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 mt-6">2. How We Use Your Information</h3>
        <p>We use your information to: provide, maintain, and improve our services; process transactions and manage your account; send important notifications and updates; respond to your inquiries and provide customer support; analyze usage patterns to enhance user experience; and comply with legal obligations and protect our rights.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">3. Information Sharing and Disclosure</h3>
        <p>We do not sell, trade, or rent your personal information. We may share your information only with service providers who assist us in operating our platform, when required by law or to protect our legal rights, in connection with a business transfer or acquisition, or with your explicit consent.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">4. Data Security</h3>
        <p>We implement appropriate technical and organizational security measures to protect your personal information, including encryption of data in transit and at rest, regular security assessments, access controls, and employee training. However, no method of transmission over the internet is 100% secure.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">5. Cookies and Tracking Technologies</h3>
        <p>We use cookies and similar technologies to remember your preferences, analyze website traffic, provide personalized content, and improve our services. You can control cookie settings through your browser preferences.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">6. Your Rights and Choices</h3>
        <p>You have the right to access, review, and request corrections or deletion of your personal information, opt-out of marketing communications, and withdraw consent. To exercise these rights, please contact us at support@onedexo.com.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">7. Data Retention & Third Parties</h3>
        <p>We retain your personal information only as long as necessary. Our website may contain links to third-party websites or services, and we are not responsible for their privacy practices.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">Contact Us</h3>
        <p>Onedexo<br/>support@onedexo.com<br/>https://www.onedexo.com</p>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <div className="space-y-4 font-sans text-gray-600 leading-relaxed max-w-none">
        <p className="font-semibold text-gray-900">Please read these terms carefully before using our services.</p>
        <p className="text-sm">Last updated: January 2026</p>
        
        <p>Welcome to Onedexo ("we," "our," "us"). These Terms of Service ("Terms") govern your access to and use of the Onedexo website, platform, products, and services (collectively, the "Services"). By using our Services, you agree to comply with these Terms.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">1. Eligibility & Account Registration</h3>
        <p>You must be at least 18 years old to use our Services. You must provide accurate, complete, and up-to-date information when creating your account. You are responsible for maintaining the confidentiality of your login credentials.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">2. Use of Services & IP</h3>
        <p>You agree to use the Services only for lawful purposes. You may not engage in fraudulent activities, reverse-engineer any part of the Services, or interfere with security. All content and code associated with Onedexo are owned by us.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">3. Payment & Subscriptions</h3>
        <p>Certain features may require a paid subscription. All fees are stated in NPR and are non-refundable except as required by law. We reserve the right to change pricing with prior notice.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">4. Termination & Liability</h3>
        <p>We may suspend or terminate your account if you violate these Terms. The Services are provided on an "AS IS" basis. We are not liable for indirect, incidental, special, or consequential damages arising from your use of the Services.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">Contact Us</h3>
        <p>Onedexo<br/>support@onedexo.com<br/>https://www.onedexo.com</p>
      </div>
    )
  },
  refund: {
    title: "Return & Refund Policy",
    content: (
      <div className="space-y-4 font-sans text-gray-600 leading-relaxed max-w-none">
        <p className="font-semibold text-gray-900">We want all our clients to be satisfied with Onedexo services.</p>
        <p className="text-sm">Effective Date: January 2026</p>
        
        <h3 className="text-lg font-bold text-gray-900 mt-6">1. Refund Eligibility</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>If services do not meet requirements, refund requests must be made within 10 days of subscription activation.</li>
          <li>After 10 days, subscriptions are non-refundable.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 mt-6">2. Refund Process</h3>
        <p>Send a written refund request with subscription details to support@onedexo.com. Refunds are processed within 7–15 business days.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">3. Limitations</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Transaction fees from payment gateways are non-refundable.</li>
          <li>Refunds cover the Onedexo subscription only, not the Merchant's own customer orders or physical hardware setup costs.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 mt-6">Contact Us</h3>
        <p>For refund requests or questions about this policy, please contact us:<br/>Onedexo<br/>support@onedexo.com<br/>https://www.onedexo.com</p>
      </div>
    )
  }
};

export function PolicyModal({ policy, onClose }: PolicyModalProps) {
  return (
    <AnimatePresence>
      {policy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-3xl flex flex-col bg-white rounded-3xl shadow-2xl text-[#171717] max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight">
                {POLICY_CONTENT[policy].title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-black rounded-full transition-color flex-shrink-0 ml-4"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto">
              {POLICY_CONTENT[policy].content}
            </div>
            
            {/* Footer shadow / padding */}
            <div className="h-6 flex-shrink-0 bg-gradient-to-t from-white to-transparent absolute bottom-0 w-full pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}