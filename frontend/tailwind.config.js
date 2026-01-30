/** @type {import('tailwindcss').Config} */
// Theme hub (unde modifici tot ce ține de temă): src/theme/README.md
// Variabile CSS (sursa canonică): src/styles/design-tokens.css
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // =============================================================================
      // DESIGN SYSTEM COLORS
      // =============================================================================
      //
      // This application uses a standardized color system built on three palettes:
      //
      // 1. NAVY (Primary Neutrals)
      //    - Replaces ALL slate-* and gray-* colors throughout the application
      //    - Used for: backgrounds, borders, text, surfaces, and muted elements
      //    - Light mode: navy-50 to navy-200 for backgrounds, navy-600+ for text
      //    - Dark mode: navy-800 to navy-900 for backgrounds, navy-400- for text
      //
      // 2. EMERALD (Brand / Primary Actions)
      //    - Used for: primary buttons, success states, bid/buy indicators
      //    - Represents positive actions and the brand identity
      //
      // 3. PRIMARY (Sky Blue Accent)
      //    - Secondary accent color for highlights and interactive elements
      //
      // COLOR MIGRATION (if you see legacy colors):
      //    slate-950 → navy-900    |    gray-100 → navy-100
      //    slate-900 → navy-800    |    gray-200 → navy-200
      //    slate-800 → navy-700    |    gray-300 → navy-300
      //    slate-700 → navy-600    |    gray-400 → navy-400
      //    slate-600 → navy-500    |    gray-500 → navy-500
      //
      // FOR THEME-AWARE COLORS IN CHARTS/SVG:
      //    Use CSS variables defined in src/styles/design-tokens.css:
      //    - var(--color-bid)       → Emerald for buy orders
      //    - var(--color-ask)       → Red for sell orders
      //    - var(--color-eua)       → Blue for EUA certificates
      //    - var(--color-cea)       → Amber for CEA certificates
      //    - var(--color-primary)   → Brand color
      //    - var(--color-background), var(--color-surface), etc.
      //
      // DOCUMENTATION:
      //    - Full Guide: docs/DESIGN_SYSTEM.md
      //    - Dev Rules: .claude/CLAUDE.md
      //    - Live Showcase: http://localhost:5173/design-system
      //
      // =============================================================================
      colors: {
        // Sky blue accent palette - used for secondary highlights
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // Navy: Standardized neutral palette (REPLACES slate-* and gray-*)
        // Usage: bg-navy-800 (dark bg), text-navy-600 (muted text), border-navy-200
        // Always pair with dark: variants for theme support
        navy: {
          50: '#f8fafc',   // Lightest - subtle backgrounds in light mode
          100: '#f1f5f9',  // Light backgrounds, hover states in light mode
          200: '#e2e8f0',  // Borders in light mode, muted backgrounds
          300: '#cbd5e1',  // Disabled states, subtle borders
          400: '#94a3b8',  // Muted text in dark mode, placeholders
          500: '#64748b',  // Secondary text (both modes)
          600: '#475569',  // Primary text in light mode
          700: '#334155',  // Dark backgrounds in light mode, borders in dark mode
          800: '#1e293b',  // Primary dark mode background (cards, surfaces)
          900: '#0f172a',  // Darkest background (page background in dark mode)
          950: '#020617',  // Reserved for extreme contrast needs
        },

        // Emerald: Brand color and positive actions
        // Usage: bg-emerald-500 (buttons), text-emerald-600 (links), bid/buy indicators
        emerald: {
          50: '#ecfdf5',   // Success backgrounds (light mode)
          100: '#d1fae5',  // Hover states for success elements
          200: '#a7f3d0',  // Light success accents
          300: '#6ee7b7',  // Success indicators
          400: '#34d399',  // Success text in dark mode
          500: '#10b981',  // Primary brand color - buttons, links
          600: '#059669',  // Hover state for primary buttons, text in light mode
          700: '#047857',  // Active/pressed states
          800: '#065f46',  // Dark success accents
          900: '#064e3b',  // Darkest success
          950: '#022c22',  // Reserved for extreme contrast
        },

        // Note: Additional colors (red, blue, amber) are available via Tailwind defaults
        // and are used for: ask/sell (red), EUA certificates (blue), CEA certificates (amber)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ticker': 'ticker 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
