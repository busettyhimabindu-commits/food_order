import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { foodService } from '../services/foodService';
import { MapPin, Phone, CreditCard, CheckCircle2, AlertTriangle, X, Plus, Home, Briefcase, Building2, Clock, MessageSquare, ChevronDown } from 'lucide-react';
import type { Address } from '../types';
import { formatCurrency } from '../utils/formatters';
import AddressMapPicker, { LocationResult } from '../components/AddressMapPicker';

// Haversine distance calculator for live distance & ETA calculation per address
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const CheckoutPage: React.FC = () => {
  const { cart, subtotal, deliveryFee, taxAmount, discountAmount, totalAmount, appliedCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Mid-Checkout Add Address Modal state
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [pinTargetAddress, setPinTargetAddress] = useState<Address | null>(null);

  const [newTitle, setNewTitle] = useState('Home');
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Madanapalle');
  const [newState, setNewState] = useState('Andhra Pradesh');
  const [newPincode, setNewPincode] = useState('517325');
  const [newDeliveryNotes, setNewDeliveryNotes] = useState('');
  const [newLat, setNewLat] = useState<number | undefined>(13.5500);
  const [newLng, setNewLng] = useState<number | undefined>(78.5000);

  const [phone, setPhone] = useState(user?.phone || '+91 9392668233');
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'Cash on Delivery'>('Razorpay');
  const [submitting, setSubmitting] = useState(false);

  // Default restaurant coordinates (Madanapalle Royal Biryani / City Center default: 13.5503, 78.5012)
  const restaurantLat = 13.5503;
  const restaurantLng = 78.5012;

  const [addons, setAddons] = useState<any[]>([]);
  const [deliveryTiming, setDeliveryTiming] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [usePoints, setUsePoints] = useState<boolean>(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (cart.length === 0 && !submitting) {
      navigate('/cart');
    }
  }, [cart.length, submitting, navigate]);

  useEffect(() => {
    const loadCheckoutDefaults = async () => {
      if (user) {
        try {
          const list = await authService.getAddresses();
          setAddresses(list);

          const userOrders = await orderService.getOrders();
          if (userOrders.length > 0) {
            const last = userOrders[0];
            if (last.payment_method) {
              setPaymentMethod(last.payment_method as any);
            }
          }

          if (list.length > 0) {
            const def = list.find((a) => a.is_default) || list[0];
            setSelectedAddressId(def.id);
          }
        } catch (err) {
          console.error('Error fetching checkout defaults:', err);
        }
      }
    };
    loadCheckoutDefaults();

    if (cart.length > 0) {
      const restId = cart[0]?.food?.restaurant_id;
      if (restId) {
        foodService.getFoods({ restaurant_id: restId }).then((foods) => {
          const remaining = foods.filter((f) => !cart.some((c) => c.food_item_id === f.id));
          setAddons(remaining.slice(0, 3));
        }).catch(console.error);
      }
    }
  }, [user, cart]);

  if (cart.length === 0) {
    return null;
  }

  const selectedAddrObj = addresses.find((a) => a.id === selectedAddressId);
  const isSelectedAddrPinned = selectedAddrObj && selectedAddrObj.latitude !== null && selectedAddrObj.latitude !== undefined && selectedAddrObj.longitude !== null && selectedAddrObj.longitude !== undefined;

  // Calculate Live Distance & ETA for selected address
  const selectedDistanceKm = selectedAddrObj && isSelectedAddrPinned
    ? calculateDistance(restaurantLat, restaurantLng, selectedAddrObj.latitude!, selectedAddrObj.longitude!)
    : 2.5;

  const estimatedEtaMins = Math.max(15, Math.round(selectedDistanceKm * 6 + 15));

  const deliveryAddressString = selectedAddrObj
    ? `${selectedAddrObj.street_address}, ${selectedAddrObj.city}, ${selectedAddrObj.state} - ${selectedAddrObj.pincode} (Ph: ${phone})`
    : `${newStreet || 'Main Road'}, ${newCity}, ${newState} - ${newPincode} (Ph: ${phone})`;

  const openAddAddressModal = () => {
    setPinTargetAddress(null);
    setNewTitle('Home');
    setNewStreet('');
    setNewCity('Madanapalle');
    setNewState('Andhra Pradesh');
    setNewPincode('517325');
    setNewDeliveryNotes('');
    setNewLat(13.5500);
    setNewLng(78.5000);
    setShowAddAddressModal(true);
  };

  const openPinModalForExisting = (addr: Address) => {
    setPinTargetAddress(addr);
    setNewTitle(addr.title);
    setNewStreet(addr.street_address);
    setNewCity(addr.city);
    setNewState(addr.state);
    setNewPincode(addr.pincode);
    setNewDeliveryNotes(addr.delivery_notes || '');
    setNewLat(addr.latitude || 13.5500);
    setNewLng(addr.longitude || 78.5000);
    setShowAddAddressModal(true);
  };

  const handleMapLocationSelect = (loc: LocationResult) => {
    setNewStreet(loc.road || newStreet);
    setNewCity(loc.city || newCity);
    setNewState(loc.state || newState);
    setNewPincode(loc.pincode || newPincode);
    setNewLat(loc.lat);
    setNewLng(loc.lng);
  };

  const handleSaveAddressMidCheckout = async () => {
    setSubmitting(true);
    try {
      if (pinTargetAddress) {
        const updated = await authService.updateAddress(pinTargetAddress.id, {
          title: newTitle,
          street_address: newStreet,
          city: newCity,
          state: newState,
          pincode: newPincode,
          latitude: newLat,
          longitude: newLng,
          delivery_notes: newDeliveryNotes,
        });
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setSelectedAddressId(updated.id);
        showToast('Address Updated!', 'Location & delivery notes updated', 'success');
      } else {
        const created = await authService.addAddress({
          title: newTitle,
          street_address: newStreet || 'Main Road',
          city: newCity,
          state: newState,
          pincode: newPincode,
          phone,
          latitude: newLat,
          longitude: newLng,
          delivery_notes: newDeliveryNotes,
          is_default: addresses.length === 0,
        });
        setAddresses((prev) => [...prev, created]);
        setSelectedAddressId(created.id);
        showToast('Address Saved!', 'New delivery location selected for order', 'success');
      }
      setShowAddAddressModal(false);
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to save address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const availablePoints = user?.loyalty_points || 0;
  const pointsDiscount = usePoints ? Math.min(availablePoints, subtotal) : 0;
  const finalPayableTotal = Math.max(0, totalAmount - pointsDiscount);

  const handlePlaceOrder = async () => {
    if (!user) {
      showToast('Login Required', 'Please sign in to complete your order', 'warning');
      navigate('/login');
      return;
    }

    if (selectedAddrObj && !isSelectedAddrPinned) {
      showToast('Pin Location Required', 'Please pin your address location before ordering', 'warning');
      openPinModalForExisting(selectedAddrObj);
      return;
    }

    if (deliveryTiming === 'schedule' && !scheduledDate) {
      showToast('Select Schedule Time', 'Please pick a future delivery date & time', 'warning');
      return;
    }

    if (deliveryTiming !== 'schedule' && isOutsideOperatingHours()) {
      showToast('Restaurants Closed', 'Orders are only accepted between 08:00 AM and 11:00 PM.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.createOrder({
        restaurant_id: cart[0]?.food?.restaurant_id || 1,
        items: cart.map((item) => ({
          food_item_id: item.food_item_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
        })),
        delivery_address: deliveryAddressString,
        coupon_code: appliedCoupon?.code,
        payment_method: paymentMethod,
        scheduled_for: deliveryTiming === 'schedule' ? scheduledDate : undefined,
        points_to_redeem: usePoints ? Math.min(availablePoints, Math.floor(subtotal)) : 0
      });

      if (paymentMethod === 'Cash on Delivery') {
        clearCart();
        showToast('Order Placed!', deliveryTiming === 'schedule' ? 'Scheduled order confirmed!' : 'Your order is confirmed', 'success');
        navigate(`/order-success/${order.id}`);
      } else {
        navigate(`/payment?order_id=${order.id}&method=${paymentMethod}`);
      }
    } catch (err: any) {
      showToast('Order Failed', err.response?.data?.detail || 'Could not place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderIcon = (t: string) => {
    if (t === 'Home') return <Home className="w-3.5 h-3.5" />;
    if (t === 'Work') return <Briefcase className="w-3.5 h-3.5" />;
    return <Building2 className="w-3.5 h-3.5" />;
  };

  const isOutsideOperatingHours = () => {
    const currentHour = new Date().getHours();
    return currentHour < 8 || currentHour >= 23;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24 md:pb-10 bg-[#FAF7F2] min-h-screen text-[#141414]">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h1 className="text-3xl font-extrabold font-display text-[#141414] tracking-tight">Checkout</h1>
        <p className="text-xs text-slate-500 font-medium">Complete your order in 3 quick steps</p>
      </div>

      {/* Step-Based Progress Indicator */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft-layered max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative px-4">
          {/* Progress Line */}
          <div className="absolute top-5 left-12 right-12 h-1 bg-[#E8E2D9] -z-0" />
          <div 
            className="absolute top-5 left-12 h-1 bg-[#FF5722] transition-all duration-300 -z-0"
            style={{
              width: selectedAddressId ? (paymentMethod ? 'calc(100% - 6rem)' : '50%') : '0%'
            }}
          />

          {/* Step 1: Address */}
          <div className="flex flex-col items-center gap-1.5 relative z-10 bg-white px-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-200 ${
              selectedAddressId
                ? 'bg-[#FF5722] text-white shadow-warm-accent'
                : 'bg-[#FAF7F2] text-slate-400 border border-[#E8E2D9]'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold font-display ${selectedAddressId ? 'text-[#141414]' : 'text-slate-400'}`}>
              Address
            </span>
          </div>

          {/* Step 2: Payment */}
          <div className="flex flex-col items-center gap-1.5 relative z-10 bg-white px-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-200 ${
              paymentMethod
                ? 'bg-[#FF5722] text-white shadow-warm-accent'
                : 'bg-[#FAF7F2] text-slate-400 border border-[#E8E2D9]'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold font-display ${paymentMethod ? 'text-[#141414]' : 'text-slate-400'}`}>
              Payment
            </span>
          </div>

          {/* Step 3: Confirm */}
          <div className="flex flex-col items-center gap-1.5 relative z-10 bg-white px-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-200 ${
              selectedAddressId && paymentMethod
                ? 'bg-[#2D6A4F] text-white shadow-sage-glow'
                : 'bg-[#FAF7F2] text-slate-400 border border-[#E8E2D9]'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold font-display ${selectedAddressId && paymentMethod ? 'text-[#2D6A4F]' : 'text-slate-400'}`}>
              Confirm
            </span>
          </div>
        </div>
      </div>

      {/* Operating Hours Alert Banner */}
      {isOutsideOperatingHours() && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 flex items-center gap-3 text-rose-900 text-xs font-bold shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-extrabold block text-rose-900">Restaurants are currently closed</span>
            <span className="text-[11px] text-rose-700 font-medium">
              Live orders are accepted daily between 08:00 AM and 11:00 PM. Please schedule for later or return after 8:00 AM.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Multi-Address Selector & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Multi-Address Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <span>Select Delivery Address</span>
              </h3>
              <button
                type="button"
                onClick={openAddAddressModal}
                className="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isPinned = addr.latitude !== null && addr.latitude !== undefined && addr.longitude !== null && addr.longitude !== undefined;
                  const isSelected = selectedAddressId === addr.id;

                  const dist = isPinned
                    ? calculateDistance(restaurantLat, restaurantLng, addr.latitude!, addr.longitude!)
                    : null;
                  const eta = dist ? Math.max(15, Math.round(dist * 6 + 15)) : null;

                  return (
                    <div
                      key={addr.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedAddressId(addr.id);
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 relative ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/40 shadow-sm ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-1.5">
                          {renderIcon(addr.title)} {addr.title}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{addr.street_address}, {addr.city}</p>

                      {addr.delivery_notes && (
                        <p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-brand-600 shrink-0" />
                          <span className="truncate">{addr.delivery_notes}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                        {isPinned ? (
                          <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" /> {dist} km • ~{eta} mins
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPinModalForExisting(addr);
                            }}
                            className="text-amber-800 font-bold bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Pin Location
                          </button>
                        )}
                        <span className="text-slate-400 font-bold">Pin: {addr.pincode}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-600">No saved addresses found.</p>
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Add Address on Map
                </button>
              </div>
            )}

            {/* Selected Address Distance & Delivery Fee Live Banner */}
            {selectedAddrObj && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-800">Delivery Estimate to {selectedAddrObj.title}:</span>
                    <span className="text-slate-600 ml-1">~{estimatedEtaMins} mins ({selectedDistanceKm} km)</span>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {deliveryFee === 0 ? 'FREE Delivery' : `${formatCurrency(deliveryFee)} Delivery`}
                </span>
              </div>
            )}

            {/* Delivery Schedule Options */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Delivery Schedule</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryTiming('now')}
                  className={`p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    deliveryTiming === 'now'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Clock className="w-4 h-4" /> Deliver Now (~{estimatedEtaMins}m)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryTiming('schedule')}
                  className={`p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    deliveryTiming === 'schedule'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  📅 Schedule For Later
                </button>
              </div>

              {deliveryTiming === 'schedule' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-amber-900 block">Pick Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700 font-medium">Order will enter kitchen queue automatically at scheduled time.</p>
                </div>
              )}
            </div>

            {/* Loyalty Points Redemption Box */}
            {availablePoints > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    ⭐
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Use Loyalty Rewards Points</span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      You have <span className="font-extrabold text-amber-600">{availablePoints} pts</span> (Worth {formatCurrency(availablePoints)})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUsePoints(!usePoints)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                    usePoints
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {usePoints ? 'Redeemed ✓' : 'Apply Discount'}
                </button>
              </div>
            )}

            {/* Phone Number */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Contact Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>Select Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'Razorpay', title: 'Online Pay (Razorpay)', sub: 'UPI, Cards, NetBanking' },
                { id: 'Cash on Delivery', title: 'Cash on Delivery', sub: 'Pay Cash on Arrival' },
              ].map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === pm.id
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{pm.title}</span>
                    {paymentMethod === pm.id && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{pm.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Desktop & Collapsible Mobile Order Summary */}
        <div className="sticky top-24 h-fit bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft-layered space-y-6">
          {/* Mobile Collapsible Header */}
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#141414]">Order Summary</h3>
              <p className="text-xs text-slate-500 font-medium">{cart.length} items in cart</p>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
              className="lg:hidden text-xs font-bold text-[#FF5722] flex items-center gap-1 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8E2D9]"
            >
              <span>{isMobileSummaryOpen ? 'Hide' : 'Show Details'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileSummaryOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Content wrapper (always open on desktop lg, toggled on mobile) */}
          <div className={`space-y-6 ${isMobileSummaryOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.food_item_id} className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.quantity}x {item.food.name}</span>
                  <span className="font-bold text-[#141414]">{formatCurrency(item.food.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Smart Add-on Suggestions */}
            {addons.length > 0 && (
              <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-[#141414] flex items-center gap-1.5">
                    ✨ Complete Meal Add-ons
                  </span>
                  <span className="text-[10px] text-[#FF5722] font-bold">1-Tap Add</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {addons.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-2.5 border border-[#E8E2D9] flex items-center justify-between text-xs shadow-xs">
                      <div>
                        <span className="font-bold text-[#141414] block font-display">{item.name}</span>
                        <span className="text-slate-500 font-semibold">{formatCurrency(item.price)}</span>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(item, 1);
                          setAddons(addons.filter(a => a.id !== item.id));
                          showToast('Add-on Added!', `${item.name} added to your cart`, 'success');
                        }}
                        className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold font-display px-3 py-1 rounded-lg text-[11px] shadow-warm-accent transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#E8E2D9] pt-3 space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-bold text-[#2D6A4F]">{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span></div>
              <div className="flex justify-between"><span>Taxes</span><span>{formatCurrency(taxAmount)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-[#2D6A4F] font-bold"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
            </div>
          </div>

          {/* Total & Submit Button */}
          <div className="border-t border-[#E8E2D9] pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Payable Amount</span>
                <span className="text-2xl font-extrabold font-display text-[#141414]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedAddressId || isOutsideOperatingHours()}
              className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold font-display px-6 py-4 rounded-xl shadow-warm-accent hover:scale-102 transition-all duration-150 ease-out text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {submitting
                  ? 'Processing Order...'
                  : !selectedAddressId
                  ? 'Select Delivery Address'
                  : isOutsideOperatingHours()
                  ? 'Closed (08:00 AM - 11:00 PM)'
                  : 'Place Order'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mid-Checkout Add/Edit Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  {pinTargetAddress ? `Edit Location: ${pinTargetAddress.title}` : 'Add New Delivery Address'}
                </h3>
                <p className="text-xs text-slate-500">Drag map pin to your exact delivery location</p>
              </div>
              <button onClick={() => setShowAddAddressModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <AddressMapPicker
              initialLat={newLat || 13.5500}
              initialLng={newLng || 78.5000}
              onLocationSelect={handleMapLocationSelect}
              height="260px"
            />

            <div>
              <label className="text-xs font-bold font-display text-[#141414] block mb-1.5">Address Label</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Home', label: 'Home', icon: <Home className="w-4 h-4" /> },
                  { id: 'Work', label: 'Work', icon: <Briefcase className="w-4 h-4" /> },
                  { id: 'Other', label: 'Other', icon: <Building2 className="w-4 h-4" /> }
                ].map((item) => {
                  const isSelected = newTitle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewTitle(item.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold font-display transition-all duration-150 flex items-center justify-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-warm-accent'
                          : 'bg-[#FAF7F2] text-slate-700 border-[#E8E2D9] hover:bg-white hover:text-[#141414]'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                placeholder="Street Address / Building Name"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:bg-white focus:border-[#FF5722] rounded-xl px-3.5 py-2.5 text-xs text-[#141414] font-medium outline-none transition-all"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="City"
                  className="bg-[#FAF7F2] border border-[#E8E2D9] focus:bg-white focus:border-[#FF5722] rounded-xl px-3.5 py-2.5 text-xs text-[#141414] font-medium outline-none transition-all"
                />
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="State"
                  className="bg-[#FAF7F2] border border-[#E8E2D9] focus:bg-white focus:border-[#FF5722] rounded-xl px-3.5 py-2.5 text-xs text-[#141414] font-medium outline-none transition-all"
                />
                <input
                  type="text"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  placeholder="Pincode"
                  className="bg-[#FAF7F2] border border-[#E8E2D9] focus:bg-white focus:border-[#FF5722] rounded-xl px-3.5 py-2.5 text-xs text-[#141414] font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1 font-display">
                  <MessageSquare className="w-3 h-3 text-[#FF5722]" /> Delivery Instructions
                </label>
                <input
                  type="text"
                  value={newDeliveryNotes}
                  onChange={(e) => setNewDeliveryNotes(e.target.value)}
                  placeholder='e.g. "Ring bell twice", "Leave at gate"'
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:bg-white focus:border-[#FF5722] rounded-xl px-3.5 py-2.5 text-xs text-[#141414] font-medium outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="px-5 py-2.5 bg-white text-[#141414] border border-[#E8E2D9] font-bold font-display rounded-xl text-xs hover:bg-[#FAF7F2] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAddressMidCheckout}
                disabled={submitting}
                className="px-6 py-2.5 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold font-display rounded-xl text-xs shadow-warm-accent hover:scale-102 transition-all"
              >
                {submitting ? 'Saving...' : 'Save & Select Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
