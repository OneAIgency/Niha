import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Button, AnimatedCounter } from '../components/common';
import { usePrices } from '../hooks/usePrices';
import { marketplaceApi } from '../services/api';
import { cn, formatCurrency } from '../utils';
import type { MarketStats } from '../types';

export function LandingPage() {
  const { prices } = usePrices();
  const [stats, setStats] = useState<MarketStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await marketplaceApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
          {/* Animated orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgb(255 255 255 / 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgb(255 255 255 / 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">
                  Live Carbon Trading Platform
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                Trade Carbon
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                  Globally
                </span>
              </h1>

              <p className="text-xl text-navy-300 mb-8 max-w-lg">
                Seamlessly swap EU ETS and China ETS emission certificates through
                our secure OTC platform. Lower costs, faster settlements, complete
                privacy.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="glow-effect">
                    Enter Platform
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Contact Us
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-8 text-navy-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">Secure & Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">Multi-Jurisdiction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">Real-time Prices</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Price Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* EUA Card */}
              <motion.div
                className="absolute -top-8 -left-8 w-80 bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-lg">
                    EUA
                  </span>
                  <span className="text-blue-400 text-sm">EU Allowances</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2 font-mono">
                  {prices ? formatCurrency(prices.eua.price, 'EUR') : '---'}
                </div>
                <div
                  className={cn(
                    'text-sm font-medium',
                    prices && prices.eua.change_24h >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  )}
                >
                  {prices
                    ? `${prices.eua.change_24h >= 0 ? '+' : ''}${prices.eua.change_24h.toFixed(2)}%`
                    : '---'}
                </div>
              </motion.div>

              {/* CEA Card */}
              <motion.div
                className="absolute top-24 right-0 w-80 bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-lg">
                    CEA
                  </span>
                  <span className="text-amber-400 text-sm">China Allowances</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2 font-mono">
                  {prices ? formatCurrency(prices.cea.price, 'CNY') : '---'}
                </div>
                <div
                  className={cn(
                    'text-sm font-medium',
                    prices && prices.cea.change_24h >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  )}
                >
                  {prices
                    ? `${prices.cea.change_24h >= 0 ? '+' : ''}${prices.cea.change_24h.toFixed(2)}%`
                    : '---'}
                </div>
              </motion.div>

              {/* Swap Rate Card */}
              <motion.div
                className="absolute bottom-0 left-1/4 w-72 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Swap Rate</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  1 EUA = {prices ? prices.swap_rate.toFixed(2) : '---'} CEA
                </div>
              </motion.div>

              {/* Spacer for card layout */}
              <div className="h-96" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative bg-navy-800/50 border-y border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                <AnimatedCounter
                  value={stats?.total_market_value_usd || 25000000}
                  prefix="$"
                />
              </div>
              <div className="text-navy-400 text-sm">Total Market Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                <AnimatedCounter value={stats?.cea_listings || 60} suffix="+" />
              </div>
              <div className="text-navy-400 text-sm">Active Listings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                <AnimatedCounter value={stats?.trades_24h || 35} />
              </div>
              <div className="text-navy-400 text-sm">Trades (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                <AnimatedCounter value={6} />
              </div>
              <div className="text-navy-400 text-sm">Jurisdictions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-b from-navy-900 to-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Nihao Group
            </h2>
            <p className="text-navy-400 text-lg max-w-2xl mx-auto">
              The advantages of OTC carbon trading through our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Lower Costs',
                description:
                  'Avoid regulated market fees and commissions. Our OTC model offers significantly better pricing.',
                icon: TrendingUp,
                gradient: 'from-emerald-500/20 to-emerald-600/5',
              },
              {
                title: 'Complete Privacy',
                description:
                  'Trade anonymously with counterparties revealed only after deal confirmation.',
                icon: Lock,
                gradient: 'from-blue-500/20 to-blue-600/5',
              },
              {
                title: 'Cross-Border Access',
                description:
                  'Access Chinese carbon markets without navigating restrictive local regulations.',
                icon: Globe,
                gradient: 'from-amber-500/20 to-amber-600/5',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${benefit.gradient} rounded-2xl p-8 border border-white/10`}
              >
                <benefit.icon className="w-12 h-12 text-emerald-400 mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-navy-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-navy-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-navy-300 mb-8 max-w-2xl mx-auto">
              Join leading entities from Europe, Asia, and beyond on our secure
              carbon trading platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login">
                <Button variant="primary" size="lg" className="glow-effect">
                  Enter Platform
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Request Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
