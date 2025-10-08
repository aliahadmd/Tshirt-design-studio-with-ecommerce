import { Link } from 'react-router';
import { useAuthStore } from '../lib/store';
import Navbar from '../components/Navbar';
import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'TShirt Builder - Design Custom T-Shirts' },
    { name: 'description', content: 'Create and customize your own T-shirts with our 3D designer' },
  ];
}

export default function Index() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Design Your Dream T-Shirt
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Create custom T-shirts with our intuitive 3D designer. Add text, images, and choose colors to make your design unique.
          </p>

          <div className="flex gap-4 justify-center">
            {user ? (
              <Link
                to="/designer"
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
              >
                Start Designing
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-2">3D Design Studio</h3>
            <p className="text-gray-600">
              See your design come to life with our real-time 3D preview
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2">Easy to Use</h3>
            <p className="text-gray-600">
              Intuitive tools to add text, upload images, and customize colors
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">💾</div>
            <h3 className="text-xl font-bold mb-2">Save & Order</h3>
            <p className="text-gray-600">
              Save your designs and place orders whenever you're ready
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

