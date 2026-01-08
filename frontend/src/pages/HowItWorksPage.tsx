import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  Building2,
  FileCheck,
  ShoppingCart,
  ArrowRightLeft,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Button, Card } from '../components/common';
import { cn } from '../utils';

const steps = [
  {
    number: '01',
    title: 'Request Access',
    description:
      'Submit your entity details through our contact form. Provide company information, your role, and any referrals.',
    icon: Building2,
    color: 'emerald',
  },
  {
    number: '02',
    title: 'KYC Verification',
    description:
      'Our team conducts a streamlined KYC process to verify your entity. This typically takes 24-48 hours.',
    icon: FileCheck,
    color: 'blue',
  },
  {
    number: '03',
    title: 'Browse & Purchase',
    description:
      'Once verified, browse our CEA marketplace. Purchase certificates from anonymous sellers at OTC prices.',
    icon: ShoppingCart,
    color: 'amber',
  },
  {
    number: '04',
    title: 'Swap Certificates',
    description:
      'Exchange your CEA for EUA through our secure swap mechanism. Find counterparties or list your own swap request.',
    icon: ArrowRightLeft,
    color: 'purple',
  },
];

const benefits = {
  european: [
    'Access Chinese carbon credits without local registration',
    'Avoid restrictive China ETS regulations',
    'Swap CEA for EUA at competitive rates',
    'Lower costs than regulated exchanges',
  ],
  chinese: [
    'Reach European buyers directly',
    'Bypass complex export regulations',
    'Convert CEA to EUA for compliance',
    'Access to larger market liquidity',
  ],
  nihao: [
    'Hong Kong jurisdiction - neutral territory',
    'Compliant OTC trading framework',
    'Real-time market prices',
    'Anonymous until deal confirmation',
  ],
};

const faqs = [
  {
    question: 'What are EUA and CEA certificates?',
    answer:
      'EUA (EU Allowances) are emission permits under the EU Emissions Trading System. CEA (China Emission Allowances) are the equivalent under China\'s national ETS. Both represent the right to emit one tonne of CO2 equivalent.',
  },
  {
    question: 'How does the swap mechanism work?',
    answer:
      'Our platform matches entities looking to exchange EUA for CEA (or vice versa). Since EUA trades at ~€75 while CEA trades at ~¥100 (~€13), the swap rate reflects this price differential. You can browse existing swap requests or create your own.',
  },
  {
    question: 'Is trading through Nihao Group compliant?',
    answer:
      'Yes. We operate as an OTC intermediary under Hong Kong jurisdiction, which allows for lawful carbon credit transactions between international parties. All entities undergo KYC verification.',
  },
  {
    question: 'What are the fees?',
    answer:
      'We charge a transparent 0.5% platform fee on trades. This is significantly lower than regulated exchange fees and includes all settlement costs.',
  },
  {
    question: 'How long does onboarding take?',
    answer:
      'After submitting your request, our team typically completes verification within 24-48 hours. Once approved, you can immediately access the marketplace and swap center.',
  },
  {
    question: 'Why are counterparties anonymous?',
    answer:
      'Anonymous trading protects all parties during negotiation. Identities are revealed only after a trade is confirmed, ensuring privacy and preventing market manipulation.',
  },
];

export function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Nihao Group Works
            </h1>
            <p className="text-xl text-navy-300">
              A seamless bridge between European and Chinese carbon markets.
              Trade certificates across jurisdictions with complete privacy and
              compliance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 -mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-8xl font-bold text-navy-100 dark:text-navy-700/50 -mr-4 -mt-4">
                    {step.number}
                  </div>
                  <div className="relative">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
                        step.color === 'emerald' && 'bg-emerald-100 dark:bg-emerald-900/30',
                        step.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                        step.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30',
                        step.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30'
                      )}
                    >
                      <step.icon
                        className={cn(
                          'w-7 h-7',
                          step.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                          step.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                          step.color === 'amber' && 'text-amber-600 dark:text-amber-400',
                          step.color === 'purple' && 'text-purple-600 dark:text-purple-400'
                        )}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-navy-600 dark:text-navy-300">{step.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-4">
              Benefits for All Parties
            </h2>
            <p className="text-lg text-navy-600 dark:text-navy-300 max-w-2xl mx-auto">
              Our platform creates value for entities across jurisdictions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* European Entities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-navy-800 border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                    European Entities
                  </h3>
                </div>
                <ul className="space-y-3">
                  {benefits.european.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-navy-700 dark:text-navy-200">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Chinese/Asian Entities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-navy-800 border-amber-100 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                    Chinese Entities
                  </h3>
                </div>
                <ul className="space-y-3">
                  {benefits.chinese.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-navy-700 dark:text-navy-200">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Nihao Platform */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-navy-800 border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                    Platform Features
                  </h3>
                </div>
                <ul className="space-y-3">
                  {benefits.nihao.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-navy-700 dark:text-navy-200">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  padding="none"
                  className={cn(
                    'overflow-hidden cursor-pointer',
                    openFaq === index && 'ring-2 ring-emerald-500 dark:ring-emerald-400'
                  )}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <HelpCircle
                        className={cn(
                          'w-5 h-5 flex-shrink-0',
                          openFaq === index ? 'text-emerald-500 dark:text-emerald-400' : 'text-navy-400 dark:text-navy-500'
                        )}
                      />
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-navy-400 dark:text-navy-500 transition-transform',
                        openFaq === index && 'rotate-180'
                      )}
                    />
                  </div>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      className="px-6 pb-6"
                    >
                      <p className="text-navy-600 dark:text-navy-300 pl-9">{faq.answer}</p>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-navy-300 mb-8">
              Join our platform and start trading carbon certificates today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button variant="primary" size="lg">
                  Request Access
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
