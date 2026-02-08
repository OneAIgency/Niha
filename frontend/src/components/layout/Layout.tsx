import { Outlet, useLocation } from 'react-router-dom';
import { useClientRealtime } from '../../hooks/useClientRealtime';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();
  useClientRealtime();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-navy-50 dark:bg-navy-950 transition-colors duration-300">
      <Header />
      <main className={isLandingPage ? '' : 'flex-1 pt-20'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
