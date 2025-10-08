import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import Navbar from '../components/Navbar';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { designAPI } from '../lib/api';
import type { Route } from './+types/designs';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'My Designs - TShirt Builder' },
    { name: 'description', content: 'View your saved designs' },
  ];
}

interface Design {
  id: string;
  name: string;
  tshirtColor: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Designs() {
  const navigate = useNavigate();
  const { isReady } = useAuthGuard();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      loadDesigns();
    }
  }, [isReady]);

  const loadDesigns = async () => {
    try {
      const response = await designAPI.getAll();
      setDesigns(response.data);
    } catch (error) {
      console.error('Failed to load designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    setDeleting(id);
    try {
      await designAPI.delete(id);
      setDesigns(designs.filter(d => d.id !== id));
    } catch (error) {
      alert('Failed to delete design');
    } finally {
      setDeleting(null);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Designs</h1>
          <Link
            to="/designer"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Create New Design
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Loading designs...</p>
          </div>
        ) : designs.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-xl text-gray-600 mb-6">You haven't created any designs yet</p>
            <Link
              to="/designer"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Create Your First Design
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div key={design.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                {design.thumbnail ? (
                  <img
                    src={design.thumbnail}
                    alt={design.name}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-64 flex items-center justify-center"
                    style={{ backgroundColor: design.tshirtColor }}
                  >
                    <span className="text-gray-400 text-lg">No Preview</span>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{design.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Created: {new Date(design.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/designer?id=${design.id}`}
                      className="flex-1 text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(design.id)}
                      disabled={deleting === design.id}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {deleting === design.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

