import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.name || 'there'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Your 12 Week Year Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Active Goals
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Current Week
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                Week 1
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Weekly Score
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">-</dd>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Getting Started
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start building your 12 Week Year plan
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/visions" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    1. Define your 10/3/1 year vision
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/goals" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    2. Set your 12 week goals
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/tactics" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    3. Define critical tactics
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
