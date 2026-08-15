import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { Store, Plus, Trash2, Edit3, Star, Upload, Cloud, Loader2, Search, X } from 'lucide-react';
import { foodService } from '../services/foodService';
import { adminService } from '../services/adminService';
import { Restaurant } from '../types';
import { useToast } from '../context/ToastContext';

const ManageRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('Biryani, North Indian');
  const [imageUrl, setImageUrl] = useState('');
  const [address, setAddress] = useState('Main Market Road');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await foodService.getRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploadedUrl = await adminService.uploadImage(file, undefined, "hima_food_ai/restaurants");
      setImageUrl(uploadedUrl);
      showToast('Cloudinary Upload Success ☁️', 'Restaurant photo uploaded directly to Cloudinary!', 'success');
    } catch (err: any) {
      showToast('Cloudinary Error', err.response?.data?.detail || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setCuisine('Biryani, North Indian');
    setImageUrl('');
    setAddress('Main Market Road');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rest: Restaurant) => {
    setEditingId(rest.id);
    setName(rest.name);
    setDescription(rest.description || '');
    setCuisine(rest.cuisine_type || 'Biryani, North Indian');
    setImageUrl(rest.image_url || '');
    setAddress(rest.address || 'Main Market Road');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        cuisine_type: cuisine,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        address,
        is_open: true,
        delivery_time_mins: 30,
        delivery_fee: 40.0,
        min_order: 100.0,
        price_range: '₹₹'
      };

      if (editingId) {
        await adminService.updateRestaurant(editingId, payload);
        showToast('Restaurant Updated', `${name} updated successfully`, 'success');
      } else {
        await adminService.createRestaurant(payload);
        showToast('Restaurant Added', `${name} created successfully`, 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete restaurant?')) return;
    try {
      await adminService.deleteRestaurant(id);
      showToast('Restaurant Deleted', '', 'info');
      loadData();
    } catch (err) {
      showToast('Error deleting', '', 'error');
    }
  };

  const filteredRestaurants = restaurants.filter((rest) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rest.name.toLowerCase().includes(q) ||
      (rest.cuisine_type && rest.cuisine_type.toLowerCase().includes(q)) ||
      (rest.address && rest.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">Manage Restaurants</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Search, add, edit, or remove partner restaurant listings</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-[#FF5722] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-warm-accent transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Restaurant
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurant by name, cuisine, location..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-slate-600">
            Showing <span className="text-[#FF5722] font-black">{filteredRestaurants.length}</span> of {restaurants.length} restaurants
          </span>
        </div>

        {loading ? (
          <SkeletonLoader count={4} />
        ) : filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center text-sm text-slate-500 font-bold">
            No restaurants found matching "{searchQuery}"
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Cuisine</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {filteredRestaurants.map((rest) => (
                  <tr key={rest.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={rest.image_url} alt={rest.name} className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-xs" />
                      <div>
                        <p className="font-bold text-slate-900">{rest.name}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{rest.address}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{rest.cuisine_type}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {rest.rating}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${rest.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {rest.is_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(rest)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-xl flex items-center gap-1 transition-all"
                          title="Edit Restaurant Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(rest.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-1 transition-all"
                          title="Delete Restaurant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Restaurant Listing' : 'Add New Restaurant'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Restaurant Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Royal Biryani House" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short restaurant story & specialty" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cuisine Types</label>
                <input type="text" required value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Biryani, North Indian" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Street Address</label>
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="GT Road, Madanapalle" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800" />
              </div>
            </div>

            {/* Cloudinary File Upload */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-500" /> Cloudinary Photo Upload
                </label>
                {imageUrl && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Uploaded ☁️
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-white border border-dashed border-slate-300 hover:border-[#FF5722] rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex items-center justify-center gap-2 transition-all">
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-[#FF5722]" /> : <Upload className="w-4 h-4 text-[#FF5722]" />}
                  <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Choose Image File'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste Cloudinary/Image URL directly"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              />

              {imageUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs" />
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[240px]">{imageUrl}</span>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting || uploadingImage} className="w-full bg-[#FF5722] hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs shadow-warm-accent transition-all">
              {submitting ? 'Saving Changes...' : editingId ? 'Update Restaurant Details' : 'Create Restaurant Listing'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ManageRestaurantsPage;

