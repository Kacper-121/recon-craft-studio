import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/builder', label: 'Builder' },
  { path: '/runs', label: 'Runs' },
  { path: '/targets', label: 'Targets' },
  { path: '/reports', label: 'Reports' },
  { path: '/settings', label: 'Settings' },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg">ShipSec Studio</span>
        </Link>

        <nav className="mx-6 flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-smooth',
                location.pathname === item.path
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
