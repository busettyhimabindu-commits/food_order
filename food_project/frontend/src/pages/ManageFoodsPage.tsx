import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { UtensilsCrossed, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, Upload, Cloud, Loader2, Search, X, Filter } from 'lucide-react';
import { foodService } from '../services/foodService';
import { adminService } from '../services/adminService';
import { FoodItem } from '../types';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getPlaceholderImage } from '../utils/formatters';
import type { Restaurant } from '../types';

const ManageFoodsPage: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<number>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Biryani');
  const [cuisine, setCuisine] = useState('Indian');
  const [price, setPrice] = useState(250);
  const [isVeg, setIsVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState<number | 'ALL'>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedVegFilter, setSelectedVegFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploadedUrl = await adminService.uploadImage(file, undefined, "hima_food_ai/dishes");
      setImageUrl(uploadedUrl);
      showToast('Cloudinary Upload Success ☁️', 'Dish photo uploaded directly to Cloudinary!', 'success');
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
    setCategory('Biryani');
    setPrice(250);
    setImageUrl('');
    if (selectedRestaurantFilter !== 'ALL') {
      setRestaurantId(Number(selectedRestaurantFilter));
    } else if (restaurantsList.length > 0) {
      setRestaurantId(restaurantsList[0].id);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (food: FoodItem) => {
    setEditingId(food.id);
    setRestaurantId(food.restaurant_id || 1);
    setName(food.name);
    setDescription(food.description || '');
    setCategory(food.category || 'Biryani');
    setCuisine(food.cuisine || 'Indian');
    setPrice(food.price);
    setIsVeg(food.is_veg);
    setSpiceLevel(food.spice_level || 'Medium');
    setImageUrl(food.image_url || '');
    setIsModalOpen(true);
  };

  const loadFoods = async () => {
    setLoading(true);
    try {
      const [data, rests] = await Promise.all([
        foodService.getFoods({ include_all: true }),
        foodService.getRestaurants()
      ]);
      setFoods(data);
      setRestaurantsList(rests);
    } catch (err) {
      console.error('Error fetching foods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      await adminService.toggleFoodAvailability(id);
      showToast('Availability Toggled', '', 'info');
      loadFoods();
    } catch (err) {
      showToast('Error toggling status', '', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this food item?')) return;
    try {
      await adminService.deleteFood(id);
      showToast('Food Deleted', '', 'info');
      loadFoods();
    } catch (err) {
      showToast('Error deleting item', '', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalImage = imageUrl.trim() || getPlaceholderImage(name, 'food');
      const payload = {
        restaurant_id: Number(restaurantId),
        name,
        description: description || `${name} prepared with fresh ingredients & aromatic spices.`,
        category,
        cuisine,
        price: Number(price),
        is_veg: isVeg,
        is_vegan: false,
        spice_level: spiceLevel,
        calories: 450,
        image_url: finalImage,
        is_available: true
      };

      if (editingId) {
        const updated = await adminService.updateFood(editingId, payload);
        showToast('Food Item Updated!', `${name} updated successfully`, 'success');
      } else {
        const created = await adminService.createFood(payload);
        showToast('Food Added!', `${name} added to ${created.restaurant_name || 'restaurant'} successfully`, 'success');
        setSearchQuery(name);
        setSelectedRestaurantFilter('ALL');
        setSelectedCategoryFilter('ALL');
        setSelectedVegFilter('ALL');
      }
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setImageUrl('');
      await loadFoods();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to save food item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const categoriesList = Array.from(new Set(foods.map(f => f.category).filter(Boolean)));

  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (food.description && food.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (food.restaurant_name && food.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (food.category && food.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRestaurant =
      selectedRestaurantFilter === 'ALL' || food.restaurant_id === selectedRestaurantFilter;

    const matchesCategory =
      selectedCategoryFilter === 'ALL' || (food.category && food.category.toLowerCase() === selectedCategoryFilter.toLowerCase());

    const matchesVeg =
      selectedVegFilter === 'ALL' ||
      (selectedVegFilter === 'VEG' && food.is_veg) ||
      (selectedVegFilter === 'NON_VEG' && !food.is_veg);

    return matchesSearch && matchesRestaurant && matchesCategory && matchesVeg;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRestaurantFilter('ALL');
    setSelectedCategoryFilter('ALL');
    setSelectedVegFilter('ALL');
  };

  const hasActiveFilters = searchQuery !== '' || selectedRestaurantFilter !== 'ALL' || selectedCategoryFilter !== 'ALL' || selectedVegFilter !== 'ALL';

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">Manage Food Items</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Search, edit, delete, or add menu items across restaurants</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-[#FF5722] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-warm-accent transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input Box */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food by name, category..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Restaurant Filter */}
            <div>
              <select
                value={selectedRestaurantFilter}
                onChange={(e) => setSelectedRestaurantFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF5722]"
              >
                <option value="ALL">All Restaurants 🏪</option>
                {restaurantsList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF5722]"
              >
                <option value="ALL">All Categories 🍽️</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Veg / Non-Veg Filter */}
            <div>
              <select
                value={selectedVegFilter}
                onChange={(e) => setSelectedVegFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF5722]"
              >
                <option value="ALL">All Dietary 🥗</option>
                <option value="VEG">🟢 Veg Only</option>
                <option value="NON_VEG">🔴 Non-Veg Only</option>
              </select>
            </div>
          </div>

          {/* Result Counter & Clear Filters */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="font-bold text-slate-600">
              Showing <span className="text-[#FF5722] font-black">{filteredFoods.length}</span> of {foods.length} items
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <SkeletonLoader count={6} />
        ) : filteredFoods.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No matching food items found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters above</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Item</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={food.image_url} alt={food.name} className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-xs" />
                      <div>
                        <p className="font-bold text-slate-900">{food.name}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{food.is_veg ? '🟢 Veg' : '🔴 Non-Veg'} • {food.spice_level}</span>
                      </div>
                    </td>
                    <td className="p-4 text-brand-600 font-bold">{food.restaurant_name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        {food.category}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900">{formatCurrency(food.price)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggle(food.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-colors flex items-center gap-1 ${
                          food.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {food.is_available ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-rose-600" />}
                        <span>{food.is_available ? 'In Stock' : 'Sold Out'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(food)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-xl flex items-center gap-1 transition-all"
                          title="Edit Food Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(food.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-1 transition-all"
                          title="Delete Item"
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

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Food Item Details' : 'Add New Food Item'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Restaurant</label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {restaurantsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Food Name (e.g. Royal Chicken Biryani)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            
            <div className="grid grid-cols-2 gap-2">
              <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Biryani)" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
              <input type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (₹)" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
            </div>

            <div className="flex gap-4 items-center justify-between text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} className="accent-emerald-600 w-4 h-4" />
                <span>Is Vegetarian 🟢</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-normal">Spice Level:</span>
                <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold">
                  <option value="Mild">Mild 🌿</option>
                  <option value="Medium">Medium 🌶️</option>
                  <option value="Spicy">Spicy 🔥</option>
                </select>
              </div>
            </div>

            {/* Cloudinary File Upload */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-500" /> Cloudinary Dish Photo Upload
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
                  <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Choose Dish Photo File'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste Cloudinary / Image URL directly"
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
              {submitting ? 'Saving Changes...' : editingId ? 'Update Food Item' : 'Create Food Item'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ManageFoodsPage;

