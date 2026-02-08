import { motion } from 'framer-motion';

/** Login and NDA success background animations. Uses design tokens where applicable. */

export function CO2Molecule() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 2 }}
    >
      <svg viewBox="0 0 200 100" className="w-[500px] h-[250px]">
        <defs>
          {/* SVG gradient exception: login is dark-only; :root tokens are light – use explicit dark navy/red for CO2 */}
          <radialGradient id="carbonGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(51, 65, 85)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(30, 41, 59)" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="oxygenGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity="0.5" />
          </radialGradient>
        </defs>

        <motion.circle
          cx="40"
          cy="50"
          r="20"
          fill="url(#oxygenGrad)"
          animate={{ cx: [40, 38, 40, 42, 40], cy: [50, 48, 50, 52, 50] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="100"
          cy="50"
          r="25"
          fill="url(#carbonGrad)"
          animate={{ r: [25, 26, 25, 24, 25] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="160"
          cy="50"
          r="20"
          fill="url(#oxygenGrad)"
          animate={{ cx: [160, 162, 160, 158, 160], cy: [50, 52, 50, 48, 50] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        <motion.line
          x1="60"
          y1="50"
          x2="75"
          y2="50"
          stroke="rgb(100, 116, 139)"
          strokeWidth="4"
          strokeOpacity="0.6"
          animate={{ strokeOpacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.line
          x1="60"
          y1="44"
          x2="75"
          y2="44"
          stroke="rgb(100, 116, 139)"
          strokeWidth="4"
          strokeOpacity="0.6"
          animate={{ strokeOpacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.line
          x1="125"
          y1="50"
          x2="140"
          y2="50"
          stroke="rgb(100, 116, 139)"
          strokeWidth="4"
          strokeOpacity="0.6"
          animate={{ strokeOpacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        />
        <motion.line
          x1="125"
          y1="56"
          x2="140"
          y2="56"
          stroke="rgb(100, 116, 139)"
          strokeWidth="4"
          strokeOpacity="0.6"
          animate={{ strokeOpacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
        />
      </svg>
    </motion.div>
  );
}

export function GrowingTree() {
  return (
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ duration: 3 }}
    >
      <svg viewBox="0 0 200 300" className="w-[400px] h-[600px]">
        {/* SVG stroke exception: dark-only login – explicit brown for trunk/branches */}
        <motion.path
          d="M100 300 Q100 250 95 200 Q90 150 100 100"
          stroke="rgb(120, 53, 15)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
        />
        <motion.path
          d="M100 180 Q130 160 150 140"
          stroke="rgb(120, 53, 15)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 3, ease: 'easeOut' }}
        />
        <motion.path
          d="M100 150 Q60 130 40 100"
          stroke="rgb(120, 53, 15)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 4, ease: 'easeOut' }}
        />
        <motion.path
          d="M100 120 Q140 100 160 70"
          stroke="rgb(120, 53, 15)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 5, ease: 'easeOut' }}
        />
        {[
          { cx: 150, cy: 130, r: 30, delay: 6 },
          { cx: 40, cy: 90, r: 35, delay: 6.5 },
          { cx: 160, cy: 60, r: 28, delay: 7 },
          { cx: 100, cy: 80, r: 40, delay: 7.5 },
          { cx: 70, cy: 60, r: 32, delay: 8 },
          { cx: 130, cy: 40, r: 30, delay: 8.5 },
          { cx: 100, cy: 30, r: 35, delay: 9 },
        ].map((leaf, i) => (
          <motion.circle
            key={i}
            cx={leaf.cx}
            cy={leaf.cy}
            r={leaf.r}
            fill="rgb(16, 185, 129)"
            fillOpacity="0.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 2, delay: leaf.delay, ease: 'easeOut' }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

export function FloatingPrices() {
  const prices = [
    { symbol: 'EUR/USD', value: '1.0847', change: '+0.12%' },
    { symbol: 'GBP/USD', value: '1.2691', change: '-0.08%' },
    { symbol: 'BRENT', value: '78.42', change: '+1.24%' },
    { symbol: 'GOLD', value: '2,041', change: '+0.31%' },
    { symbol: 'DAX', value: '17,892', change: '+0.67%' },
    { symbol: 'S&P500', value: '5,123', change: '+0.45%' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {prices.map((price, i) => (
        <motion.div
          key={i}
          className="absolute text-sm font-mono text-white/15 blur-[0.5px]"
          initial={{ x: Math.random() * window.innerWidth, y: -50, opacity: 0 }}
          animate={{ y: window.innerHeight + 50, opacity: [0, 0.4, 0.4, 0] }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 2,
            ease: 'linear',
          }}
          style={{ left: `${10 + i * 15}%` }}
        >
          <div className="whitespace-nowrap">
            <span className="text-white/25">{price.symbol}</span>
            <span className="ml-2">{price.value}</span>
            <span className={`ml-2 ${price.change.startsWith('+') ? 'text-emerald-500/40' : 'text-red-500/40'}`}>
              {price.change}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function DiffuseLogo() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3 }}
    >
      <motion.div
        className="text-[20rem] font-black text-white/[0.03] select-none tracking-tighter"
        animate={{ scale: [1, 1.02, 1], opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        N
      </motion.div>
    </motion.div>
  );
}

export function ParticleField() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/10"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/** NDA success ambient – abstract, dynamic background shown after confirmation fade-out. */
export function NDASuccessAmbient() {
  const particles = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 12 + 6,
    delay: Math.random() * 4,
    xDrift: (Math.random() - 0.5) * 20,
  }));

  const orbs = [
    { x: 15, y: 20, size: 80, duration: 8, color: 'emerald' },
    { x: 85, y: 70, size: 60, duration: 10, color: 'blue' },
    { x: 50, y: 85, size: 100, duration: 12, color: 'emerald' },
    { x: 70, y: 25, size: 50, duration: 7, color: 'amber' },
    { x: 25, y: 65, size: 70, duration: 9, color: 'blue' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={`p-${p.id}`}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, p.xDrift, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className={`absolute rounded-full ${
            orb.color === 'emerald' ? 'bg-emerald-500/10' : orb.color === 'blue' ? 'bg-blue-500/10' : 'bg-amber-500/10'
          }`}
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            marginLeft: -orb.size / 2,
            marginTop: -orb.size / 2,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.18, 0.08],
            x: [0, 15, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeInOut',
          }}
        />
      ))}

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ndaLineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ndaLineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-eua)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-eua)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--color-eua)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <motion.path
            key={`path-${i}`}
            d={
              i === 0 ? 'M0,50 Q25,20 50,50 T100,50' : i === 1 ? 'M0,80 Q50,30 100,80' : 'M0,20 Q50,70 100,20'
            }
            fill="none"
            stroke={i === 1 ? 'url(#ndaLineGrad2)' : 'url(#ndaLineGrad1)'}
            strokeWidth="0.5"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.4, 0.4, 0],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute left-1/2 top-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full border border-emerald-500/20"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.5, 1.5], opacity: [0.2, 0, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1.3,
            ease: 'easeOut',
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--color-text-inverse) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-inverse) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <motion.span
          className="text-[28rem] font-black text-white/[0.02] select-none tracking-tighter"
          animate={{ scale: [1, 1.03, 1], opacity: [0.02, 0.04, 0.02] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          N
        </motion.span>
      </motion.div>
    </div>
  );
}
