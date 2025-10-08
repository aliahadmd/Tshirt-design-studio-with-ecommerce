import { Link, useNavigate } from 'react-router';
import { useAuthStore, useCartStore } from '../lib/store';
import { useState } from 'react';
import { Menu, X, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  const { user, _hasHydrated, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Don't render nav links until hydrated to avoid flash
  if (!_hasHydrated) {
    return (
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              TShirtBuilder
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl md:text-2xl font-bold text-indigo-600">
            TShirtBuilder
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/designer" className="hover:text-indigo-600 transition">
                  Create Design
                </Link>
                <Link to="/designs" className="hover:text-indigo-600 transition">
                  My Designs
                </Link>
                <Link to="/orders" className="hover:text-indigo-600 transition">
                  Orders
                </Link>
                <Link to="/cart" className="hover:text-indigo-600 relative transition">
                  <ShoppingCart className="w-5 h-5 inline mr-1" />
                  Cart
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-3 border-l pl-4">
                  <span className="text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-indigo-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t pt-4">
            {user ? (
              <>
                <div className="px-4 py-2 bg-gray-50 rounded flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.name}</span>
                </div>
                <Link
                  to="/designer"
                  className="block px-4 py-2 hover:bg-gray-50 rounded transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Design
                </Link>
                <Link
                  to="/designs"
                  className="block px-4 py-2 hover:bg-gray-50 rounded transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Designs
                </Link>
                <Link
                  to="/orders"
                  className="block px-4 py-2 hover:bg-gray-50 rounded transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  to="/cart"
                  className="block px-4 py-2 hover:bg-gray-50 rounded transition relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Cart
                  {items.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {items.length}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded transition text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 hover:bg-gray-50 rounded transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
