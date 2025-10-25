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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Blue Suite</h1>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/visions"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Vision
            </Link>
            <Link
              to="/goals"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Goals
            </Link>
            <Link
              to="/tactics"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Tactics
            </Link>
            <Link
              to="/tracking"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Tracking
            </Link>
            <Link
              to="/weekly-plans"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Weekly Plans
            </Link>
            <Link
              to="/wam"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              WAM
            </Link>
            <Link
              to="/scorecard"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Scorecard
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user?.user_metadata?.name || user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <nav className="md:hidden pb-4 space-y-1 border-t border-gray-200 pt-4">
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Dashboard
            </Link>
            <Link
              to="/visions"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Vision
            </Link>
            <Link
              to="/goals"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Goals
            </Link>
            <Link
              to="/tactics"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Tactics
            </Link>
            <Link
              to="/tracking"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Tracking
            </Link>
            <Link
              to="/weekly-plans"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Weekly Plans
            </Link>
            <Link
              to="/wam"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              WAM
            </Link>
            <Link
              to="/scorecard"
              onClick={closeMobileMenu}
              className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Scorecard
            </Link>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <div className="px-3 py-2 text-sm text-gray-700">
                {user?.user_metadata?.name || user?.email}
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  closeMobileMenu();
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-sm font-medium transition-colors rounded-md"
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
