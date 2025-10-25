import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center group">
              <h1 className="text-2xl font-bold text-white tracking-wide transition-all duration-200 group-hover:scale-105">
                Blue Suite
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <Link
              to="/dashboard"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Dashboard
            </Link>
            <Link
              to="/visions"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Vision
            </Link>
            <Link
              to="/goals"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Goals
            </Link>
            <Link
              to="/tactics"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Tactics
            </Link>
            <Link
              to="/tracking"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Tracking
            </Link>
            <Link
              to="/weekly-plans"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Weekly Plans
            </Link>
            <Link
              to="/wam"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              WAM
            </Link>
            <Link
              to="/scorecard"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Scorecard
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-white/90 font-medium">
              {user?.user_metadata?.name || user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition-all duration-200"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              // X icon
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-1 border-t border-white/20 pt-4">
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Dashboard
            </Link>
            <Link
              to="/visions"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Vision
            </Link>
            <Link
              to="/goals"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Goals
            </Link>
            <Link
              to="/tactics"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Tactics
            </Link>
            <Link
              to="/tracking"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Tracking
            </Link>
            <Link
              to="/weekly-plans"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Weekly Plans
            </Link>
            <Link
              to="/wam"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              WAM
            </Link>
            <Link
              to="/scorecard"
              onClick={closeMobileMenu}
              className="block text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
            >
              Scorecard
            </Link>
            <div className="border-t border-white/20 mt-2 pt-2">
              <div className="px-3 py-2 text-sm text-white/90 font-medium">
                {user?.user_metadata?.name || user?.email}
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  closeMobileMenu();
                }}
                className="block w-full text-left text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
