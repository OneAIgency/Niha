import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Building2, User, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Input, Card } from '../components/common';
import { contactApi } from '../services/api';
import { isValidEmail, isCorporateEmail, sanitizeFormData } from '../utils';

export function ContactPage() {
  const [formData, setFormData] = useState({
    entity_name: '',
    contact_email: '',
    position: '',
    reference: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.entity_name.trim()) {
      newErrors.entity_name = 'Entity name is required';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Email is required';
    } else if (!isValidEmail(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email';
    } else if (!isCorporateEmail(formData.contact_email)) {
      newErrors.contact_email = 'Please use a corporate email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(formData);
      await contactApi.submitRequest(sanitizedData);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900 mb-4">
              Request Submitted!
            </h1>
            <p className="text-navy-600 mb-6">
              Thank you for your interest in Nihao Group. Our team will review
              your request and contact you within 24-48 hours.
            </p>
            <p className="text-sm text-navy-500">
              Check your email ({formData.contact_email}) for a confirmation
              message.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24"
          >
            <h1 className="text-4xl font-bold text-navy-900 mb-4">
              Join Our Platform
            </h1>
            <p className="text-lg text-navy-600 mb-8">
              Complete the form to begin the onboarding process. Our team will
              contact you to discuss your carbon trading needs.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Entity Verification</h3>
                  <p className="text-navy-600">
                    We verify all entities through a streamlined KYC process to
                    ensure platform security.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Referral Network</h3>
                  <p className="text-navy-600">
                    Were you referred by an existing member? Let us know to
                    expedite your onboarding.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">24-48h Response</h3>
                  <p className="text-navy-600">
                    Our team will reach out within 1-2 business days to discuss
                    next steps.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">
                Contact Request
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Entity Name"
                  placeholder="Your company or organization name"
                  icon={<Building2 className="w-5 h-5" />}
                  value={formData.entity_name}
                  onChange={(e) =>
                    setFormData({ ...formData, entity_name: e.target.value })
                  }
                  error={errors.entity_name}
                />

                <Input
                  label="Corporate Email"
                  type="email"
                  placeholder="you@company.com"
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  error={errors.contact_email}
                />

                <Input
                  label="Your Position"
                  placeholder="e.g., Sustainability Director, CFO"
                  icon={<User className="w-5 h-5" />}
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />

                <Input
                  label="Referral (Optional)"
                  placeholder="Who referred you to us?"
                  icon={<Users className="w-5 h-5" />}
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                />

                {errors.submit && (
                  <p className="text-red-500 text-sm">{errors.submit}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={loading}
                >
                  Submit Request
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <p className="text-sm text-navy-500 text-center">
                  By submitting, you agree to our privacy policy and terms of
                  service.
                </p>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
