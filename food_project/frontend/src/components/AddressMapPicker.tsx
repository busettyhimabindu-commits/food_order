import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, Navigation, MapPin, Loader2 } from 'lucide-react';
import api from '../services/api';

export interface LocationResult {
  lat: number;
  lng: number;
  road: string;
  city: string;
  state: string;
  pincode: string;
  displayName?: string;
}

interface AddressMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (location: LocationResult) => void;
  height?: string;
}

// Custom Leaflet pin icon using SVG
const createCustomPinIcon = () => {
  const svgHtml = `
    <div style="
      background-color: #FF5722;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(255, 87, 34, 0.45);
      border: 2px solid #ffffff;
    ">
      <div style="
        width: 14px;
        height: 14px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  initialLat = 13.5500,
  initialLng = 78.5000,
  onLocationSelect,
  height = '320px',
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  // Handle Reverse Geocoding
  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await api.get(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = response.data;

      const result: LocationResult = {
        lat,
        lng,
        road: data.address || '',
        city: data.city || 'Madanapalle',
        state: data.state || 'Andhra Pradesh',
        pincode: data.pincode || '517325',
        displayName: data.display_name,
      };

      onLocationSelect(result);
    } catch (err) {
      console.error('Reverse geocode error:', err);
      onLocationSelect({
        lat,
        lng,
        road: 'Pin Location',
        city: 'Madanapalle',
        state: 'Andhra Pradesh',
        pincode: '517325',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Move marker and trigger callback
  const setPinPosition = (lat: number, lng: number, fetchAddress = true) => {
    setCurrentCoords({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapRef.current) {
      mapRef.current.panTo([lat, lng]);
    }
    if (fetchAddress) {
      handleReverseGeocode(lat, lng);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {}
      mapRef.current = null;
    }

    const startLat = initialLat;
    const startLng = initialLng;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = createCustomPinIcon();

    const marker = L.marker([startLat, startLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    // Marker Drag End Event
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCurrentCoords({ lat: pos.lat, lng: pos.lng });
      handleReverseGeocode(pos.lat, pos.lng);
    });

    // Map Click Event
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCurrentCoords({ lat, lng });
      handleReverseGeocode(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Fetch address for initial position
    handleReverseGeocode(startLat, startLng);

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch (e) {}
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      markerRef.current = null;
    };
  }, []);

  // Update map when initialLat/initialLng changes from parent
  useEffect(() => {
    if (mapRef.current && markerRef.current && (initialLat !== currentCoords.lat || initialLng !== currentCoords.lng)) {
      setPinPosition(initialLat, initialLng, false);
    }
  }, [initialLat, initialLng]);

  // Handle Location Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const resp = await api.get(`/api/location/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(resp.data || []);
    } catch (err) {
      console.error('Location search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select search result
  const handleSelectResult = (item: LocationResult) => {
    setSearchResults([]);
    setSearchQuery(item.displayName || `${item.road}, ${item.city}`);
    setPinPosition(item.lat, item.lng, true);
  };

  // Locate User Live Position
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPinPosition(pos.coords.latitude, pos.coords.longitude, true);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search & Locate Toolbar */}
      <div className="relative flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search street, building, area or city..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1.5 px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLocateMe}
          title="Use current location"
          className="p-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded-xl text-slate-600 transition-all flex items-center gap-1 text-xs font-bold shrink-0"
        >
          <Navigation className="w-4 h-4 text-brand-600" />
          <span className="hidden sm:inline">Locate Me</span>
        </button>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left p-2.5 hover:bg-brand-50/50 transition-colors flex items-start gap-2 text-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                <div className="truncate">
                  <p className="font-bold text-slate-800 truncate">{item.displayName || `${item.road}, ${item.city}`}</p>
                  <p className="text-[10px] text-slate-500">{item.city}, {item.state} - {item.pincode}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Canvas Container */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-soft-layered" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating "Drag Pin to Adjust" Tooltip */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-[#141414]/90 text-white text-xs font-bold font-display px-4 py-2 rounded-full backdrop-blur-md shadow-warm-accent flex items-center gap-2 border border-white/20">
          <MapPin className="w-4 h-4 text-[#FF5722] animate-bounce" />
          <span>Drag pin to pinpoint precise location</span>
        </div>

        {/* Live Status Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E8E2D9] shadow-soft-layered flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-[#FF5722] shrink-0" />
            <span className="text-xs font-semibold text-[#141414] truncate font-display">
              {isGeocoding ? 'Detecting address details...' : `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressMapPicker;
