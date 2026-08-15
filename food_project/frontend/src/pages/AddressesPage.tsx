import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, AlertTriangle, Edit3, X, Check, Home, Briefcase, Building2, Star, MessageSquare, Navigation } from 'lucide-react';
import { authService } from '../services/authService';
import type { Address } from '../types';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';
import AddressMapPicker, { LocationResult } from '../components/AddressMapPicker';
import { useLocation } from '../context/LocationContext';

const AddressesPage: React.FC = () => {
  const { location, setManualLocation, detectLiveLocation, isDetecting } = useLocation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [pinningAddress, setPinningAddress] = useState<Address | null>(null);

  // Form state
  const [title, setTitle] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Madanapalle');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('517325');
  const [phone, setPhone] = useState('+91 9876543210');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [lat, setLat] = useState<number | undefined>(13.5500);
  const [lng, setLng] = useState<number | undefined>(78.5000);
  const [submitting, setSubmitting] = useState(false);

  // Edit / Pin form state
  const [editTitle, setEditTitle] = useState('Home');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editDeliveryNotes, setEditDeliveryNotes] = useState('');
  const [editLat, setEditLat] = useState<number | undefined>(undefined);
  const [editLng, setEditLng] = useState<number | undefined>(undefined);

  const { showToast } = useToast();

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const list = await authService.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleMapLocationSelect = (loc: LocationResult) => {
    setStreet(loc.road || street);
    setCity(loc.city || city);
    setState(loc.state || state);
    setPincode(loc.pincode || pincode);
    setLat(loc.lat);
    setLng(loc.lng);
  };

  const handleEditMapLocationSelect = (loc: LocationResult) => {
    setEditStreet(loc.road || editStreet);
    setEditCity(loc.city || editCity);
    setEditState(loc.state || editState);
    setEditPincode(loc.pincode || editPincode);
    setEditLat(loc.lat);
    setEditLng(loc.lng);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newAddr = await authService.addAddress({
        title,
        street_address: street,
        city,
        state,
        pincode,
        phone,
        latitude: lat,
        longitude: lng,
        delivery_notes: deliveryNotes,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, newAddr]);
      setShowAdd(false);
      setStreet('');
      setDeliveryNotes('');
      showToast('Address Saved!', 'Delivery location added to address book', 'success');
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to add address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openPinModal = (addr: Address) => {
    setPinningAddress(addr);
    setEditTitle(addr.title);
    setEditStreet(addr.street_address);
    setEditCity(addr.city);
    setEditState(addr.state);
    setEditPincode(addr.pincode);
    setEditDeliveryNotes(addr.delivery_notes || '');
    setEditLat(addr.latitude || 13.5500);
    setEditLng(addr.longitude || 78.5000);
  };

  const handleSavePinLocation = async () => {
    if (!pinningAddress) return;
    setSubmitting(true);
    try {
      const updated = await authService.updateAddress(pinningAddress.id, {
        title: editTitle,
        street_address: editStreet,
        city: editCity,
        state: editState,
        pincode: editPincode,
        latitude: editLat,
        longitude: editLng,
        delivery_notes: editDeliveryNotes,
      });
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setPinningAddress(null);
      showToast('Address Updated!', 'Saved location & notes updated', 'success');
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to update address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addrId: number) => {
    try {
      const updated = await authService.updateAddress(addrId, { is_default: true });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === updated.id,
        }))
      );
      showToast('Default Address Set', `${updated.title} is now your default delivery spot`, 'info');
    } catch (err) {
      showToast('Error', 'Could not set default address', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await authService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address Deleted', '', 'info');
    } catch (err) {
      showToast('Error deleting address', '', 'error');
    }
  };

  const renderTitleIcon = (t: string) => {
    if (t === 'Home') return <Home className="w-3.5 h-3.5" />;
    if (t === 'Work') return <Briefcase className="w-3.5 h-3.5" />;
    return <Building2 className="w-3.5 h-3.5" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20 md:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Saved Address Book</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage multiple addresses, delivery notes & select default delivery location</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const detected = await detectLiveLocation();
              if (detected) {
                showToast('Live Location Detected!', `Near ${detected.address}, ${detected.city}`, 'success');
              }
            }}
            disabled={isDetecting}
            className="bg-gradient-to-r from-[#FF5722] to-amber-500 hover:from-[#E64A19] hover:to-amber-600 text-white font-extrabold font-display px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-warm-accent transition-all disabled:opacity-70"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting...' : 'Use Live GPS'}</span>
          </button>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-slate-900 hover:bg-black text-white font-bold font-display px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>
      </div>

      {/* Add Address Form */}
      {showAdd && (
        <form onSubmit={handleAddAddress} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" /> Add New Address to Book
            </h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">
              Step 1: Drag Pin or Search Delivery Spot
            </label>
            <AddressMapPicker
              initialLat={13.5500}
              initialLng={78.5000}
              onLocationSelect={handleMapLocationSelect}
              height="260px"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Address Label</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="Home">Home 🏠</option>
                <option value="Work">Work 💼</option>
                <option value="Other">Other 📍</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Street / Building / Door No.</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Door No 4-12, Main Street"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="text"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="text"
              required
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-brand-600" /> Delivery Notes / Instructions (Optional)
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder='e.g. "Ring bell twice", "Leave with security at gate"'
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md"
            >
              {submitting ? 'Saving...' : 'Save to Address Book'}
            </button>
          </div>
        </form>
      )}

      {/* Address Cards Grid */}
      {loading ? (
        <SkeletonLoader count={2} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isPinned = addr.latitude !== null && addr.latitude !== undefined && addr.longitude !== null && addr.longitude !== undefined;
            const isCurrentlySelected =
              (location.id && location.id === addr.id) ||
              (location.address && addr.street_address && location.address.toLowerCase().trim() === addr.street_address.toLowerCase().trim());

            return (
              <div
                key={addr.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-soft-layered ${
                  isCurrentlySelected
                    ? 'border-[#FF5722] ring-2 ring-[#FF5722]/20 bg-[#FF5722]/5'
                    : 'border-[#E8E2D9] hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-[#FF5722] bg-[#FF5722]/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-display">
                      {renderTitleIcon(addr.title)} {addr.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isCurrentlySelected ? (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3] text-emerald-700" /> Delivering Here
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setManualLocation({
                              id: addr.id,
                              address: addr.street_address,
                              city: addr.city,
                              state: addr.state,
                              pincode: addr.pincode,
                              lat: addr.latitude || 13.5500,
                              lng: addr.longitude || 78.5000,
                              displayName: `${addr.street_address}, ${addr.city}`,
                            });
                            showToast('Delivery Address Selected!', `Delivering to ${addr.title} (${addr.city})`, 'success');
                          }}
                          className="text-xs font-extrabold font-display text-white bg-[#FF5722] hover:bg-[#E64A19] px-3 py-1.5 rounded-xl shadow-warm-accent transition-all flex items-center gap-1"
                        >
                          Deliver Here 📍
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#141414] pt-1 leading-relaxed">{addr.street_address}</p>
                  <p className="text-xs text-slate-500 font-medium">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-[11px] text-slate-400 font-medium">Contact: {addr.phone}</p>

                  {addr.delivery_notes && (
                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9] text-[11px] text-slate-700 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#FF5722] shrink-0 mt-0.5" />
                      <span><strong>Instructions:</strong> {addr.delivery_notes}</span>
                    </div>
                  )}

                  {!isPinned && (
                    <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2 rounded-xl border border-amber-200/60 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Unpinned location
                    </p>
                  )}
                </div>

                <div className="border-t border-[#E8E2D9] pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPinModal(addr)}
                      className="text-xs font-bold font-display text-[#FF5722] hover:text-[#E64A19] flex items-center gap-1 bg-[#FF5722]/10 px-3 py-1.5 rounded-xl border border-[#FF5722]/20 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit / Pin Map
                    </button>
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-xl transition-colors"
                      >
                        Make Default
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pin Location Modal */}
      {pinningAddress && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" /> Edit Address & Pin Location
              </h3>
              <button onClick={() => setPinningAddress(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <AddressMapPicker
              initialLat={editLat || 13.5500}
              initialLng={editLng || 78.5000}
              onLocationSelect={handleEditMapLocationSelect}
              height="260px"
            />

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Label</label>
                <select
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Home">Home 🏠</option>
                  <option value="Work">Work 💼</option>
                  <option value="Other">Other 📍</option>
                </select>
              </div>

              <input
                type="text"
                value={editStreet}
                onChange={(e) => setEditStreet(e.target.value)}
                placeholder="Street Address"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="City"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="State"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value)}
                  placeholder="Pincode"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Delivery Instructions</label>
                <input
                  type="text"
                  value={editDeliveryNotes}
                  onChange={(e) => setEditDeliveryNotes(e.target.value)}
                  placeholder='e.g. "Leave at reception"'
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPinningAddress(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePinLocation}
                disabled={submitting}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
