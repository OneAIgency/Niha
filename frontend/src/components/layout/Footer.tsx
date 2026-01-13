import { Link } from 'react-router-dom';
import { Logo } from '../common';
import { MapPin, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Logo variant="light" size="lg" />
            <p className="mt-4 text-navy-300 max-w-md">
              Professional OTC carbon credit trading platform. Facilitating seamless
              swaps between EU ETS (EUA) and China ETS (CEA) emission certificates.
            </p>
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2 text-navy-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Hong Kong | Italy</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/marketplace"
                  className="text-navy-400 hover:text-white transition-colors"
                >
                  CEA Marketplace
                </Link>
              </li>
              <li>
                <Link
                  to="/swap"
                  className="text-navy-400 hover:text-white transition-colors"
                >
                  Swap Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-navy-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-navy-400">
                <Mail className="w-4 h-4" />
                <span>info@nihaogroup.com</span>
              </li>
              <li className="flex items-center gap-2 text-navy-400">
                <Phone className="w-4 h-4" />
                <span>+852 1234 5678</span>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="font-medium text-sm mb-2">Jurisdictions Served</h4>
              <div className="flex flex-wrap gap-2">
                {['EU', 'CN', 'HK', 'CH', 'SG', 'AE'].map((code) => (
                  <span
                    key={code}
                    className="px-2 py-1 bg-navy-800 text-navy-300 text-xs rounded"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-navy-400 text-sm">
            &copy; {new Date().getFullYear()} Nihao Group Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-navy-400">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/compliance" className="hover:text-white transition-colors">
              Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
