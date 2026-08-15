import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, X, Plus, Edit3, Trash2, Home, Briefcase, Building2, ArrowLeft } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { authService } from '../services/authService';
import type { Address } from '../types';
import AddressMapPicker, { LocationResult } from './AddressMapPicker';
import { useToast } from '../context/ToastContext';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { location, isDetecting, detectLiveLocation, setManualLocation } = useLocation();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [street, setStreet] = useState(location.address || '');
  const [city, setCity] = useState(location.city || 'Madanapalle');
  const [state, setState] = useState(location.state || 'Andhra Pradesh');
  const [pincode, setPincode] = useState(location.pincode || '517325');
  const [lat, setLat] = useState<number | undefined>(location.lat || 13.5500);
  const [lng, setLng] = useState<number | undefined>(location.lng || 78.5000);
  const [submitting, setSubmitting] = useState(false);

  const [geoError, setGeoError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGeoError(null);
      setFetchError(null);
      setViewMode('list');
      loadSavedAddresses();
    }
  }, [isOpen]);

  const loadSavedAddresses = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await authService.getAddresses();
      setAddresses(list);
      setViewMode('list');
    } catch (err: any) {
      console.error('Error fetching addresses:', err);
      setFetchError(err?.response?.data?.detail || 'Unable to load saved addresses. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectGPS = async () => {
    setGeoError(null);
    const detected = await detectLiveLocation();
    if (detected) {
      setStreet(detected.address);
      setCity(detected.city);
      setState(detected.state);
      setPincode(detected.pincode);
      setLat(detected.lat);
      setLng(detected.lng);
      setViewMode('add');
      showToast('Live Location Detected!', `Near ${detected.address}, ${detected.city}`, 'success');
    } else {
      setGeoError("Couldn't detect your live GPS location — please check browser permissions or enter your address manually.");
      showToast('GPS Detection Failed', 'Please enter your location details manually.', 'error');
    }
  };

  const handleSelectSavedAddress = (e: React.MouseEvent, addr: Address) => {
    e.preventDefault();
    e.stopPropagation();
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
    showToast('Address Selected', `Delivering to ${addr.title} (${addr.city})`, 'info');
    onClose();
  };

  const handleDeleteAddress = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await authService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address Removed', '', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete address', 'error');
    }
  };

  const handleStartEdit = (e: React.MouseEvent, addr: Address) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setTitle(addr.title as any);
    setStreet(addr.street_address);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setLat(addr.latitude || 13.5500);
    setLng(addr.longitude || 78.5000);
    setViewMode('edit');
  };

  const handleMapSelect = (loc: LocationResult) => {
    setStreet(loc.road || street);
    setCity(loc.city || city);
    setState(loc.state || state);
    setPincode(loc.pincode || pincode);
    setLat(loc.lat);
    setLng(loc.lng);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !pincode || !street) {
      showToast('Validation Error', 'Please complete address details', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (viewMode === 'edit' && editingAddressId) {
        const updated = await authService.updateAddress(editingAddressId, {
          title,
          street_address: street,
          city,
          state,
          pincode,
          latitude: lat,
          longitude: lng,
        });
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setManualLocation({
          address: updated.street_address,
          city: updated.city,
          state: updated.state,
          pincode: updated.pincode,
          lat: updated.latitude || 13.5500,
          lng: updated.longitude || 78.5000,
          displayName: `${updated.street_address}, ${updated.city}`,
        });
        showToast('Address Updated!', '', 'success');
      } else {
        const newAddr = await authService.addAddress({
          title,
          street_address: street,
          city,
          state,
          pincode,
          phone: '+91 9876543210',
          latitude: lat,
          longitude: lng,
          is_default: addresses.length === 0,
        });
        setAddresses((prev) => [newAddr, ...prev]);
        setManualLocation({
          address: newAddr.street_address,
          city: newAddr.city,
          state: newAddr.state,
          pincode: newAddr.pincode,
          lat: newAddr.latitude || 13.5500,
          lng: newAddr.longitude || 78.5000,
          displayName: `${newAddr.street_address}, ${newAddr.city}`,
        });
        showToast('Address Saved!', 'New delivery location added', 'success');
      }
      setViewMode('list');
      onClose();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to save address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderIcon = (t: string) => {
    if (t === 'Home') return <Home className="w-4 h-4 text-[#FF5722]" />;
    if (t === 'Work') return <Briefcase className="w-4 h-4 text-amber-600" />;
    return <Building2 className="w-4 h-4 text-purple-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#141414]/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl border border-[#E8E2D9] relative my-auto max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Warm Card Header */}
        <div className="bg-[#FAF7F2] px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF5722] via-[#E64A19] to-amber-500 text-white shadow-warm-accent flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold font-display text-[#141414] tracking-tight">Select Delivery Location</h3>
              <p className="text-xs text-slate-500 font-semibold">Saved addresses & live GPS pinpointing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E2D9] text-slate-500 hover:text-[#141414] hover:bg-slate-100 flex items-center justify-center transition-all shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* State 1: Loading Skeleton */}
          {loading ? (
            <div className="space-y-4 animate-pulse py-2">
              <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/3"></div>
              <div className="space-y-3">
                <div className="h-20 bg-slate-100 rounded-2xl w-full"></div>
                <div className="h-20 bg-slate-100 rounded-2xl w-full"></div>
              </div>
            </div>
          ) : fetchError ? (
            /* State 2: Fetch Error Alert Banner */
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 font-bold space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <p className="leading-relaxed">{fetchError}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={loadSavedAddresses}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors"
                >
                  Retry Loading Addresses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFetchError(null);
                    setViewMode('add');
                  }}
                  className="px-4 py-2 bg-white text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100/50 transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          ) : (
            /* State 3: Normal Loaded Content */
            <>
              {/* Live GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF5722] via-orange-500 to-amber-500 hover:from-[#E64A19] hover:to-amber-600 text-white font-extrabold font-display text-xs shadow-warm-accent hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70"
              >
                <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Detecting Live Location...' : 'Use Current GPS Location'}</span>
              </button>

              {/* Geo Error Alert Banner */}
              {geoError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 font-bold space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none">⚠️</span>
                    <p className="leading-relaxed">{geoError}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-black shadow-xs transition-colors"
                    >
                      Retry GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('add')}
                      className="px-3.5 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold hover:bg-rose-100/50 transition-colors"
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}

              {/* View Mode 1: Saved Addresses List */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-display text-slate-500 uppercase tracking-wider">
                      Saved Addresses ({addresses.length})
                    </span>
                  </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {addresses.map((addr) => {
                  const isSelected =
                    (location.id && location.id === addr.id) ||
                    (location.address && addr.street_address && location.address.toLowerCase().trim() === addr.street_address.toLowerCase().trim()) ||
                    (location.displayName && addr.street_address && location.displayName.toLowerCase().includes(addr.street_address.toLowerCase().trim()));

                  return (
                    <div
                      key={addr.id}
                      onClick={(e) => handleSelectSavedAddress(e, addr)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                        isSelected
                          ? 'border-[#FF5722] bg-[#FF5722]/5 shadow-xs ring-2 ring-[#FF5722]/20'
                          : 'border-[#E8E2D9] bg-white hover:bg-[#FAF7F2] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Radio Selection Circle */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-[#FF5722] bg-[#FF5722] text-white'
                              : 'border-slate-300 group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold font-display text-[#141414] flex items-center gap-1.5">
                              {renderIcon(addr.title)} {addr.title}
                            </span>
                            {addr.is_default && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-700 mt-1 leading-snug">
                            {addr.street_address}
                          </p>
                          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                            {addr.city}, {addr.pincode}
                          </p>
                        </div>
                      </div>

                      {/* Edit / Delete Icons */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, addr)}
                          className="p-1.5 text-slate-400 hover:text-[#FF5722] hover:bg-white rounded-lg transition-colors"
                          title="Edit address"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAddress(e, addr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* + Add New Address Button */}
              <button
                type="button"
                onClick={() => {
                  setStreet('');
                  setCity('Madanapalle');
                  setPincode('517325');
                  setViewMode('add');
                }}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#FF5722] text-[#FF5722] hover:bg-[#FF5722]/5 font-extrabold font-display text-xs flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Address</span>
              </button>
            </div>
          )}

          {/* View Mode 2: Add or Edit Address Form */}
          {(viewMode === 'add' || viewMode === 'edit') && (
            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Back to Saved Addresses Button */}
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#FF5722] mb-1 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Back to saved addresses</span>
                </button>
              )}

              <div>
                <label className="text-xs font-bold font-display text-slate-700 uppercase block mb-1.5">
                  Pin Location on Map
                </label>
                <AddressMapPicker
                  initialLat={lat || 13.5500}
                  initialLng={lng || 78.5000}
                  onLocationSelect={handleMapSelect}
                  height="200px"
                />
              </div>

              {/* Save As Selector */}
              <div>
                <label className="text-xs font-bold font-display text-slate-700 uppercase block mb-1.5">
                  Save As
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Home', label: 'Home 🏠' },
                    { id: 'Work', label: 'Work 💼' },
                    { id: 'Other', label: 'Other 📍' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTitle(t.id as any)}
                      className={`py-2.5 rounded-xl text-xs font-bold font-display border transition-all ${
                        title === t.id
                          ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-xs'
                          : 'bg-[#FAF7F2] text-slate-700 border-[#E8E2D9] hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street / Building / Door No.</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Door No 4-12, MITS College Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] text-xs font-semibold text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Madanapalle"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] text-xs font-semibold text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="517325"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] text-xs font-semibold text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E8E2D9]">
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="px-4 py-2.5 bg-[#FAF7F2] text-slate-700 font-bold rounded-xl text-xs border border-[#E8E2D9] hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-orange-600 hover:from-[#E64A19] hover:to-orange-700 text-white font-extrabold font-display rounded-xl text-xs shadow-warm-accent transition-all"
                >
                  {submitting ? 'Saving...' : viewMode === 'edit' ? 'Update Address' : 'Save Delivery Location'}
                </button>
              </div>
            </form>
          )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
