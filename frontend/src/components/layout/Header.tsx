import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings, Briefcase, ChevronDown, Palette, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  const { theme } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isLandingPage = location.pathname === '/';
  const isDark = theme === 'dark';
  const role = user?.role ?? null;
  const isAdmin = role === 'ADMIN';

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

  // Build navigation links based on user role (0010 flow)
  // ADMIN sees ALL navigation options (superuser access)
  const navLinks = useMemo(() => {
    if (!isAuthenticated) {
      return [{ href: '/contact', label: 'Contact', icon: null }];
    }
    if (!role) return [];

    const links: { href: string; label: string; icon: LucideIcon | null }[] = [];

    // ADMIN superuser: show ALL navigation options
    if (isAdmin) {
      links.push({ href: '/dashboard', label: 'Dashboard', icon: null });
      links.push({ href: '/funding', label: 'Funding', icon: null });
      links.push({ href: '/cash-market', label: 'CEA Cash', icon: null });
      links.push({ href: '/swap', label: 'Swap', icon: null });
      links.push({ href: '/onboarding', label: 'Onboarding', icon: null });
      return links;
    }

    // Regular users: show only their allowed sections
    // CEA Cash Market: only CEA/CEA_SETTLE (buying CEA) + MM
    const canCashMarket = ['CEA', 'CEA_SETTLE', 'MM'].includes(role);
    // Swap: SWAP role only (after swap completes, role changes to EUA_SETTLE which loses access) + MM
    const canSwap = ['SWAP', 'MM'].includes(role);
    const canDashboard = ['CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'MM'].includes(role);
    const canFunding = ['APPROVED', 'FUNDING', 'AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'MM'].includes(role);
    const canOnboarding = ['NDA', 'KYC'].includes(role);

    if (canDashboard) links.push({ href: '/dashboard', label: 'Dashboard', icon: null });
    if (canFunding) links.push({ href: '/funding', label: 'Funding', icon: null });
    if (canCashMarket) links.push({ href: '/cash-market', label: 'CEA Cash', icon: null });
    if (canSwap) links.push({ href: '/swap', label: 'Swap', icon: null });
    if (canOnboarding) links.push({ href: '/onboarding', label: 'Onboarding', icon: null });

    return links;
  }, [isAuthenticated, role, isAdmin]);

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
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors flex items-center gap-1.5',
                    isLandingPage || isDark
                      ? 'text-white/80 hover:text-white'
                      : 'text-navy-600 hover:text-navy-900',
                    location.pathname === link.href &&
                      (isLandingPage || isDark ? 'text-white' : 'text-emerald-600')
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}

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
                              onClick={() => handleMenuItemClick('/auto-trade')}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                                isDark
                                  ? 'text-navy-200 hover:bg-navy-700'
                                  : 'text-navy-700 hover:bg-navy-50'
                              )}
                            >
                              <Activity className="w-4 h-4" />
                              Auto Trade
                            </button>
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
                              onClick={() => handleMenuItemClick('/theme')}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                                isDark
                                  ? 'text-navy-200 hover:bg-navy-700'
                                  : 'text-navy-700 hover:bg-navy-50'
                              )}
                            >
                              <Palette className="w-4 h-4" />
                              Theme
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
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'text-lg font-medium flex items-center gap-2',
                      isLandingPage || isDark ? 'text-white' : 'text-navy-900'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {link.label}
                  </Link>
                );
              })}
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
