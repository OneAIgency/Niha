import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../../stores/useStore';
import { useSection } from './SectionRegistry';
import { SECTION_IDS, HERO_METRICS } from './constants';

const colorMap = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
} as const;

export function HeroMetrics() {
  const ref = useSection(SECTION_IDS.OVERVIEW);
  const { user } = useAuthStore();
  const name = user?.firstName ?? user?.email ?? 'User';
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} id={SECTION_IDS.OVERVIEW}>
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide">
          Welcome back, {name}
        </h2>
        <p className="text-navy-400 text-sm mt-1">
          Your gateway to carbon market opportunities
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {HERO_METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
            className="bg-navy-800/50 border border-navy-700 rounded-xl p-6"
          >
            <div className={`text-3xl font-bold font-mono ${colorMap[metric.color]}`}>
              {metric.value}
            </div>
            <div className="text-xs uppercase tracking-wider text-navy-400 mt-2">
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
