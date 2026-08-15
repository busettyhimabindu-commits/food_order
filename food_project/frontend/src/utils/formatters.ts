export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const parseUTCDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  let formattedStr = dateString;
  if (!formattedStr.endsWith('Z') && !formattedStr.includes('+') && !formattedStr.includes('Z')) {
    formattedStr = formattedStr.replace(' ', 'T') + 'Z';
  }
  return new Date(formattedStr);
};

export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return parseUTCDate(dateString).toLocaleDateString('en-IN', options);
};

export const getSpiceBadgeColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'mild':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'spicy':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'extra spicy':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const categoryImages: Record<string, string> = {
  'cooldrinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
  'breakfast': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
  'ice cream': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
  'desserts': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'fast food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=400&q=80',
  'main course': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
  'snacks': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'starters': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80',
  'pizza & burger': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
  'chinese': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
  'south indian': 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&q=80',
  'healthy': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
};

export const getPlaceholderImage = (name: string, type: 'food' | 'restaurant' | 'user' | 'category' = 'user') => {
  const normalizedKey = name.trim().toLowerCase();
  
  if (categoryImages[normalizedKey]) {
    return categoryImages[normalizedKey];
  }

  if (type === 'category' || type === 'food') {
    // Return a rich food photo fallback
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
  }

  if (type === 'restaurant') {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80';
  }

  // Fallback for user avatars
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash) % 360;
  const bgColor = `hsl(${h}, 60%, 50%)`;
  
  const words = name.trim().split(' ').filter(Boolean);
  let initials = words.length >= 2 ? words[0][0] + words[1][0] : words[0]?.substring(0, 2) || 'U';
  initials = initials.toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${bgColor}"/>
      <text x="50%" y="50%" fill="white" font-family="system-ui, sans-serif" font-weight="bold" font-size="72" dominant-baseline="central" text-anchor="middle">
        ${initials}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
