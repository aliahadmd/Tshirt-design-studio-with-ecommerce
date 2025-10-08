import { useState } from 'react';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import { useCartStore } from '../lib/store';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { orderAPI } from '../lib/api';
import type { Route } from './+types/cart';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cart - TShirt Builder' },
    { name: 'description', content: 'Your shopping cart' },
  ];
}

export default function Cart() {
  const navigate = useNavigate();
  const { isReady } = useAuthGuard();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckout = async () => {
    if (items.length === 0) {
      setMessage('Cart is empty');
      return;
    }

    // Check for temporary IDs
    const hasTemporaryIds = items.some(item => item.designId.startsWith('temp-'));
    if (hasTemporaryIds) {
      setMessage('⚠️ Some designs are not saved. Please remove invalid items and add them again from the designer.');
      // Remove items with temporary IDs
      items.forEach(item => {
        if (item.designId.startsWith('temp-')) {
          removeItem(item.designId);
        }
      });
      return;
    }

    setOrdering(true);
    setMessage('');

    try {
      await orderAPI.create({
        items: items.map(item => ({
          designId: item.designId,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
        })),
      });

      setMessage('Order placed successfully! (Free for MVP)');
      clearCart();

      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (error) {
      setMessage('Failed to place order. Make sure your designs are saved first.');
    } finally {
      setOrdering(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <button
              onClick={() => navigate('/designer')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Start Designing
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.designId} className="bg-white p-6 rounded-lg shadow flex gap-4">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.designName}
                      className="w-32 h-32 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{item.designName}</h3>
                    <p className="text-gray-600 mb-2">Size: {item.size}</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      ${item.price.toFixed(2)} {item.price === 0 && '(Free)'}
                    </p>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.designId, parseInt(e.target.value))}
                          className="w-20 px-3 py-1 border rounded"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Size:</label>
                        <select
                          value={item.size}
                          className="px-3 py-1 border rounded"
                          disabled
                        >
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.designId)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow sticky top-4">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${total().toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-indigo-600">${total().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={ordering}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {ordering ? 'Processing...' : 'Place Order (Free)'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  No payment required - MVP version
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

