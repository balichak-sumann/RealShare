export const MOCK_CATEGORIES = [
  { id: '1', label: 'Buy', icon: '🏠', count: 12453 },
  { id: '2', label: 'Rent', icon: '🔑', count: 8321 },
  { id: '3', label: 'Projects', icon: '🏗️', count: 432 },
  { id: '4', label: 'PG / Hostels', icon: '🛏️', count: 2150 },
  { id: '5', label: 'Plot & Land', icon: '🗺️', count: 1540 },
  { id: '6', label: 'Commercial', icon: '🏢', count: 3200 },
  { id: '7', label: 'Luxury', icon: '💎', count: 850 },
  { id: '8', label: 'Investment', icon: '📈', count: 420 },
];

export const MOCK_HERO_SLIDES = [
  {
    id: 's1',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Find a place\nthat feels like home.',
    subtitle: 'Discover verified homes, projects & investment opportunities.',
  },
  {
    id: 's2',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Premium Villas\nin Jubilee Hills.',
    subtitle: 'Experience true luxury with RealShare Premium.',
  },
  {
    id: 's3',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09be1587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Smart Investments\nfor High Returns.',
    subtitle: 'AI-verified properties with high rental yields.',
  },
];

export const MOCK_QUICK_ACTIONS = [
  { id: 'q1', title: 'Sell Property', subtitle: 'Zero brokerage', icon: '🏷️', route: '/sell' },
  { id: 'q2', title: 'Home Services', subtitle: 'Interiors & more', icon: '🛋️', route: '/services' },
  { id: 'q3', title: 'Investment', subtitle: 'High ROI', icon: '📈', route: '/(tabs)/search?filter=investment' },
  { id: 'q4', title: 'Market Insights', subtitle: 'Trends & Data', icon: '📊', route: '/market-insights' },
];

export const MOCK_PROPERTIES = [
  {
    id: 'p1',
    title: 'The Courtyard by Prestige',
    location: 'Banjara Hills, Hyderabad',
    price: '₹4.5 Cr',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    bhk: '4 BHK Villa',
    area: '4,500',
    score: 92,
    isVerified: true,
  },
  {
    id: 'p2',
    title: 'Lodha Bellezza Apartments',
    location: 'Kukatpally, Hyderabad',
    price: '₹2.1 Cr',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    bhk: '3 BHK Apt',
    area: '2,150',
    score: 85,
    isVerified: true,
  },
  {
    id: 'p3',
    title: 'My Home Bhooja',
    location: 'HITEC City, Hyderabad',
    price: '₹5.2 Cr',
    images: [
      'https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    bhk: '4 BHK Apt',
    area: '3,430',
    score: 96,
    isVerified: true,
  },
];

export const MOCK_PROJECTS = [
  {
    id: 'pr1',
    name: 'Aparna Sarovar Zicon',
    developer: 'Aparna Constructions',
    location: 'Nallagandla, Hyderabad',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    priceRange: '₹1.8 Cr - ₹3.2 Cr',
    possession: 'Dec 2024',
    hasRera: true,
  },
  {
    id: 'pr2',
    name: 'Prestige High Fields',
    developer: 'Prestige Group',
    location: 'Financial District, Hyderabad',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    priceRange: '₹2.4 Cr - ₹4.5 Cr',
    possession: 'Ready to Move',
    hasRera: true,
  },
];

export const MOCK_LOCALITIES = [
  {
    id: 'l1',
    name: 'Gachibowli',
    image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    rank: 1,
    avgRent: '₹35',
    avgSale: '₹9,500',
    propertyCount: 1250,
  },
  {
    id: 'l2',
    name: 'Madhapur',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    rank: 2,
    avgRent: '₹42',
    avgSale: '₹11,200',
    propertyCount: 840,
  },
  {
    id: 'l3',
    name: 'Jubilee Hills',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    rank: 3,
    avgRent: '₹55',
    avgSale: '₹18,000',
    propertyCount: 320,
  },
];

export const MOCK_DEVELOPERS = [
  { id: 'd1', name: 'Prestige Group', info: '15 Projects', logo: 'https://ui-avatars.com/api/?name=Prestige+Group&background=0D8ABC&color=fff&size=128' },
  { id: 'd2', name: 'DLF', info: '8 Projects', logo: 'https://ui-avatars.com/api/?name=DLF&background=1E3A8A&color=fff&size=128' },
  { id: 'd3', name: 'Godrej Properties', info: '12 Projects', logo: 'https://ui-avatars.com/api/?name=Godrej&background=047857&color=fff&size=128' },
  { id: 'd4', name: 'Lodha', info: '20 Projects', logo: 'https://ui-avatars.com/api/?name=Lodha&background=9333EA&color=fff&size=128' },
  { id: 'd5', name: 'Aparna', info: '5 Projects', logo: 'https://ui-avatars.com/api/?name=Aparna&background=B45309&color=fff&size=128' },
];

export const MOCK_RESALE_PROPERTIES = [
  {
    id: 'res1',
    title: 'Lanco Hills Apartment',
    location: 'Manikonda, Hyderabad',
    price: '₹1.8 Cr',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    bhk: '3 BHK Apt',
    area: '1,800',
    score: 88,
    isVerified: true,
  },
  {
    id: 'res2',
    title: 'Jayabheri Silicon County',
    location: 'Kondapur, Hyderabad',
    price: '₹2.4 Cr',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    bhk: '4 BHK Apt',
    area: '2,200',
    score: 91,
    isVerified: true,
  }
];

export const MOCK_RENTAL_PROPERTIES = [
  {
    id: 'r1',
    title: 'Golf View Apartment',
    location: 'Gachibowli, Hyderabad',
    price: '₹45,000/mo',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1de2d9d0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    bhk: '2 BHK Apt',
    area: '1,200',
    score: 85,
    isVerified: true,
  },
  {
    id: 'r2',
    title: 'Rajapushpa Atria',
    location: 'Kokapet, Hyderabad',
    price: '₹65,000/mo',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    bhk: '3 BHK Apt',
    area: '1,750',
    score: 89,
    isVerified: true,
  }
];
