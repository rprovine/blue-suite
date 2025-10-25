import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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

          {/* Navigation Links */}
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
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
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
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-4 space-y-2">
          <Link
            to="/dashboard"
            className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/visions"
            className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
          >
            Vision
          </Link>
          <Link
            to="/goals"
            className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
          >
            Goals
          </Link>
          <Link
            to="/tactics"
            className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
          >
            Tactics
          </Link>
          <Link
            to="/tracking"
            className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
          >
            Tracking
          </Link>
        </nav>
      </div>
    </header>
  );
}
