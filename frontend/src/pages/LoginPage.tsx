import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Building2, User, Briefcase, CheckCircle, Upload, FileText } from 'lucide-react';
import { authApi, contactApi } from '../services/api';
import { useAuthStore } from '../stores/useStore';
import { isValidEmail } from '../utils';

// CO2 Molecule Animation Component - MORE VISIBLE
function CO2Molecule() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 2 }}
    >
      <svg viewBox="0 0 200 100" className="w-[500px] h-[250px]">
        <defs>
          <radialGradient id="carbonGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#334155" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="oxygenGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.5" />
          </radialGradient>
        </defs>

        {/* Left Oxygen */}
        <motion.circle
          cx="40"
          cy="50"
          r="20"
          fill="url(#oxygenGrad)"
          animate={{
            cx: [40, 38, 40, 42, 40],
            cy: [50, 48, 50, 52, 50],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Carbon (center) */}
        <motion.circle
          cx="100"
          cy="50"
          r="25"
          fill="url(#carbonGrad)"
          animate={{
            r: [25, 26, 25, 24, 25],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Right Oxygen */}
        <motion.circle
          cx="160"
          cy="50"
          r="20"
          fill="url(#oxygenGrad)"
          animate={{
            cx: [160, 162, 160, 158, 160],
            cy: [50, 52, 50, 48, 50],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Bonds */}
        <motion.line
          x1="60"
          y1="50"
          x2="75"
          y2="50"
          stroke="#64748b"
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
          stroke="#64748b"
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
          stroke="#64748b"
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
          stroke="#64748b"
          strokeWidth="4"
          strokeOpacity="0.6"
          animate={{ strokeOpacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
        />
      </svg>
    </motion.div>
  );
}

// Growing Tree Animation Component - MORE VISIBLE
function GrowingTree() {
  return (
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ duration: 3 }}
    >
      <svg viewBox="0 0 200 300" className="w-[400px] h-[600px]">
        {/* Tree trunk */}
        <motion.path
          d="M100 300 Q100 250 95 200 Q90 150 100 100"
          stroke="#78350f"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
        />

        {/* Main branches */}
        <motion.path
          d="M100 180 Q130 160 150 140"
          stroke="#78350f"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 3, ease: "easeOut" }}
        />
        <motion.path
          d="M100 150 Q60 130 40 100"
          stroke="#78350f"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 4, ease: "easeOut" }}
        />
        <motion.path
          d="M100 120 Q140 100 160 70"
          stroke="#78350f"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 5, ease: "easeOut" }}
        />

        {/* Foliage circles - MORE VISIBLE */}
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
            fill="#10b981"
            fillOpacity="0.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 2, delay: leaf.delay, ease: "easeOut" }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// Floating Market Prices Animation - MORE VISIBLE
function FloatingPrices() {
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
          initial={{
            x: Math.random() * window.innerWidth,
            y: -50,
            opacity: 0,
          }}
          animate={{
            y: window.innerHeight + 50,
            opacity: [0, 0.4, 0.4, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 2,
            ease: "linear",
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

// Diffuse Logo Background
function DiffuseLogo() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3 }}
    >
      <motion.div
        className="text-[20rem] font-black text-white/[0.03] select-none tracking-tighter"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.03, 0.05, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        N
      </motion.div>
    </motion.div>
  );
}

// Particle Field
function ParticleField() {
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
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function LoginPage() {
  const [mode, setMode] = useState<'initial' | 'enter' | 'nda'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // NDA form fields
  const [entity, setEntity] = useState('');
  const [contactName, setContactName] = useState('');
  const [position, setPosition] = useState('');
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to determine where to redirect after login
  const getPostLoginRedirect = (loggedInUser: { email: string }): string => {
    // Send specific users to onboarding
    if (loggedInUser.email === 'eu@eu.ro') {
      return '/onboarding';
    }
    return '/dashboard';
  };

  // Check for magic link token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyToken(token);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginRedirect(user));
    }
  }, [isAuthenticated, user, navigate]);

  const verifyToken = async (token: string) => {
    setVerifying(true);
    try {
      const { access_token, user: loggedInUser } = await authApi.verifyMagicLink(token);
      setAuth(loggedInUser, access_token);
      navigate(getPostLoginRedirect(loggedInUser));
    } catch {
      setError('Invalid or expired link. Please request a new one.');
      setMode('enter');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const { access_token, user: loggedInUser } = await authApi.loginWithPassword(email, password);
      setAuth(loggedInUser, access_token);
      navigate(getPostLoginRedirect(loggedInUser));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleNDA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!entity.trim()) {
      setError('Entity name is required');
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid corporate email');
      return;
    }

    if (!contactName.trim()) {
      setError('Your name is required');
      return;
    }

    if (!position.trim()) {
      setError('Position is required');
      return;
    }

    if (!ndaFile) {
      setError('Please upload a signed NDA document');
      return;
    }

    if (!ndaFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }

    setLoading(true);
    try {
      await contactApi.submitNDARequest({
        entity_name: entity,
        contact_email: email,
        contact_name: contactName,
        position: position,
        nda_file: ndaFile,
      });
      setRequestSent(true);
    } catch {
      setError('Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are allowed');
        return;
      }
      setNdaFile(file);
      setError('');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-white/40 mx-auto" />
          <p className="text-white/30 mt-4 text-sm tracking-wide">Verifying...</p>
        </motion.div>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10"
        >
          <motion.div
            className="w-20 h-20 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mx-auto mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-10 h-10 text-emerald-400/80" />
          </motion.div>
          <h2 className="text-2xl font-light text-white/90 mb-4 tracking-wide">Request Submitted</h2>
          <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed mb-2">
            Thank you for your interest in Nihao Group.
          </p>
          <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed">
            Our team will review your application and contact you at <span className="text-white/60">{email}</span>
          </p>
          <button
            onClick={() => { setRequestSent(false); setMode('initial'); setEntity(''); setEmail(''); setContactName(''); setPosition(''); setNdaFile(null); }}
            className="mt-8 text-white/30 hover:text-white/50 text-xs tracking-wider transition-colors"
          >
            Submit another request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Background Elements */}
      <DiffuseLogo />
      <ParticleField />
      <FloatingPrices />

      {/* CO2 Molecule - positioned top right */}
      <div className="absolute top-[10%] right-[5%] hidden lg:block">
        <CO2Molecule />
      </div>

      {/* Growing Tree - positioned bottom left */}
      <div className="absolute bottom-0 left-[5%] hidden lg:block">
        <GrowingTree />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <h1 className="text-5xl font-light text-white/90 tracking-[0.3em] mb-2">NIHAO</h1>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
        </motion.div>

        <AnimatePresence mode="wait">
          {mode === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <button
                onClick={() => setMode('enter')}
                className="w-full py-4 px-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-light tracking-[0.2em] transition-all duration-300"
              >
                ENTER
              </button>
              <button
                onClick={() => setMode('nda')}
                className="w-full py-4 px-8 rounded-lg bg-transparent hover:bg-white/5 border border-white/5 hover:border-white/10 text-white/40 hover:text-white/60 font-light tracking-[0.2em] transition-all duration-300"
              >
                NDA
              </button>
            </motion.div>
          )}

          {mode === 'enter' && (
            <motion.form
              key="enter"
              onSubmit={handleLogin}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-light"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-light"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400/70 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white/90 font-light tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'CONTINUE'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode('initial'); setError(''); }}
                className="w-full text-white/30 hover:text-white/50 text-xs tracking-wider transition-colors"
              >
                Back
              </button>
            </motion.form>
          )}

          {mode === 'nda' && (
            <motion.form
              key="nda"
              onSubmit={handleNDA}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              <p className="text-white/40 text-center text-sm font-light leading-relaxed mb-2">
                Submit your signed NDA to request access
              </p>

              <div className="space-y-3">
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Entity Name"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-light"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    placeholder="Corporate Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-light"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-light"
                  />
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Position in Entity"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-light"
                  />
                </div>

                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3.5 px-4 bg-white/5 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                    ndaFile ? 'border-emerald-500/50' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {ndaFile ? (
                    <>
                      <FileText className="w-4 h-4 text-emerald-400/70" />
                      <span className="text-white/70 font-light text-sm truncate">{ndaFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white/30" />
                      <span className="text-white/30 font-light">Upload Signed NDA (PDF)</span>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400/70 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white/90 font-light tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'SUBMIT NDA'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode('initial'); setError(''); setNdaFile(null); }}
                className="w-full text-white/30 hover:text-white/50 text-xs tracking-wider transition-colors"
              >
                Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Subtle footer */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <p className="text-white/10 text-[10px] tracking-[0.3em]">EXCLUSIVE ACCESS</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
