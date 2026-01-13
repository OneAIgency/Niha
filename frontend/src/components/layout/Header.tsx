import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Sun, Moon, Settings, Users, Briefcase, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo, Button, PriceTicker } from '../common';
import { useAuthStore, usePricesStore, useUIStore } from '../../stores/useStore';
import { cn } from '../../utils';
import type { User as UserType } from '../../types';

// Helper to get user initials
const getInitials = (user: UserType | null): string => {
  if (!user) return '??';
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.email.substring(0, 2).toUpperCase();
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { prices } = usePricesStore();
  const { theme, toggleTheme } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isLandingPage = location.pathname === '/';
  const isDark = theme === 'dark';
  const isAdmin = user?.role === 'ADMIN';
  const isFunded = user?.role === 'FUNDED';
  const isApproved = user?.role === 'APPROVED';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (path: string) => {
    setUserDropdownOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    navigate('/');
  };

  // Build navigation links based on user role
  const navLinks = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { href: '/how-it-works', label: 'How It Works' },
        { href: '/contact', label: 'Contact' },
      ];
    }

    // APPROVED users - only see Funding
    if (isApproved) {
      return [
        { href: '/funding', label: 'Funding' },
        { href: '/how-it-works', label: 'How It Works' },
      ];
    }

    // FUNDED users - Dashboard and Cash Market (no Swap)
    if (isFunded) {
      return [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/cash-market', label: 'Cash Market' },
        { href: '/how-it-works', label: 'How It Works' },
      ];
    }

    // ADMIN users - full access including Swap
    if (isAdmin) {
      return [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/cash-market', label: 'Cash Market' },
        { href: '/swap', label: 'Swap Center' },
        { href: '/how-it-works', label: 'How It Works' },
      ];
    }

    // Default (PENDING or unknown) - minimal navigation
    return [
      { href: '/how-it-works', label: 'How It Works' },
    ];
  }, [isAuthenticated, isApproved, isFunded, isAdmin]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isLandingPage
          ? 'bg-transparent'
          : isDark
            ? 'bg-navy-900/80 backdrop-blur-lg border-b border-navy-700'
            : 'bg-white/80 backdrop-blur-lg border-b border-navy-100'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo variant={isLandingPage || isDark ? 'light' : 'dark'} />
          </Link>

          {/* Price Ticker (Desktop) */}
          {!isLandingPage && (
            <div className="hidden lg:block">
              <PriceTicker prices={prices} variant="compact" />
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  isLandingPage || isDark
                    ? 'text-white/80 hover:text-white'
                    : 'text-navy-600 hover:text-navy-900',
                  location.pathname === link.href &&
                    (isLandingPage || isDark ? 'text-white' : 'text-emerald-600')
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                isLandingPage || isDark
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-navy-600 hover:text-navy-900 hover:bg-navy-100'
              )}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* Avatar Button */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={cn(
                    'flex items-center gap-2 p-1 rounded-full transition-all duration-200',
                    userDropdownOpen && 'ring-2 ring-emerald-500 ring-offset-2',
                    isDark ? 'ring-offset-navy-900' : 'ring-offset-white'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {getInitials(user)}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    userDropdownOpen && 'rotate-180',
                    isLandingPage || isDark ? 'text-white' : 'text-navy-600'
                  )} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50',
                        isDark
                          ? 'bg-navy-800 border-navy-700'
                          : 'bg-white border-navy-100'
                      )}
                    >
                      {/* User Info Header */}
                      <div className={cn(
                        'px-4 py-3 border-b',
                        isDark ? 'border-navy-700 bg-navy-900/50' : 'border-navy-100 bg-navy-50'
                      )}>
                        <p className={cn(
                          'text-sm font-semibold truncate',
                          isDark ? 'text-white' : 'text-navy-900'
                        )}>
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.email}
                        </p>
                        <p className={cn(
                          'text-xs truncate',
                          isDark ? 'text-navy-400' : 'text-navy-500'
                        )}>
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => handleMenuItemClick('/profile')}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                            isDark
                              ? 'text-navy-200 hover:bg-navy-700'
                              : 'text-navy-700 hover:bg-navy-50'
                          )}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleMenuItemClick('/settings')}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                                isDark
                                  ? 'text-navy-200 hover:bg-navy-700'
                                  : 'text-navy-700 hover:bg-navy-50'
                              )}
                            >
                              <Settings className="w-4 h-4" />
                              Settings
                            </button>
                            <button
                              onClick={() => handleMenuItemClick('/users')}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                                isDark
                                  ? 'text-navy-200 hover:bg-navy-700'
                                  : 'text-navy-700 hover:bg-navy-50'
                              )}
                            >
                              <Users className="w-4 h-4" />
                              Users
                            </button>
                            <button
                              onClick={() => handleMenuItemClick('/backoffice')}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                                isDark
                                  ? 'text-navy-200 hover:bg-navy-700'
                                  : 'text-navy-700 hover:bg-navy-50'
                              )}
                            >
                              <Briefcase className="w-4 h-4" />
                              Backoffice
                            </button>
                          </>
                        )}
                      </div>

                      {/* Divider & Logout */}
                      <div className={cn(
                        'border-t py-2',
                        isDark ? 'border-navy-700' : 'border-navy-100'
                      )}>
                        <button
                          onClick={handleLogout}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                            'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          )}
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <Button variant={isLandingPage ? 'secondary' : 'primary'} size="sm">
                  Enter Platform
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                isLandingPage || isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-navy-600 hover:text-navy-900'
              )}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className={cn('w-6 h-6', isLandingPage || isDark ? 'text-white' : 'text-navy-900')} />
              ) : (
                <Menu className={cn('w-6 h-6', isLandingPage || isDark ? 'text-white' : 'text-navy-900')} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={cn(
            'md:hidden py-4 border-t',
            isDark ? 'border-navy-700' : 'border-white/10'
          )}>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-lg font-medium',
                    isLandingPage || isDark ? 'text-white' : 'text-navy-900'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Enter Platform
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
