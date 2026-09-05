export const formatPrice = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatArea = (sqft: number): string => {
  return `${sqft.toLocaleString('en-IN')}`;
};

// Adapts a raw Property record from the RealShare API (Prisma shape) into
// the props PropertyCard expects. Used anywhere we render real listings
// instead of the old MOCK_PROPERTIES-shaped data.
export const propertyToCardProps = (p: any) => {
  const isOutright = p.listing_type === 'outright';
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images.map((img: any) => (typeof img === 'string' ? img : img.image_url))
    : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'];

  return {
    id: p.id,
    title: p.title,
    location: [p.locality, p.district].filter(Boolean).join(', '),
    price: isOutright
      ? formatPrice(Number(p.price_per_fraction))
      : `${formatPrice(Number(p.price_per_fraction))} / fraction`,
    images,
    bhk: p.property_type ? p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1) : 'Property',
    area: isOutright ? 'Outright' : `${p.sold_fractions ?? 0}/${p.total_fractions ?? 0} sold`,
    areaSuffix: '',
    score: p.assured_yield ? Number(p.assured_yield) : 4.5,
    description: p.description || 'A beautiful, premium property offering exceptional yields and modern amenities.',
  };
};

// Adapts a raw Property (with its developer relation included) into the
// props ProjectCard expects. Real fields only — there's no tracked
// possession/completion date in the schema, so we surface when the listing
// was posted instead of inventing a construction-completion date.
export const propertyToProjectCardProps = (p: any) => {
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images.map((img: any) => (typeof img === 'string' ? img : img.image_url))
    : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop'];
  const totalValue = Number(p.price_per_fraction) * (p.total_fractions || 1);

  return {
    id: p.id,
    name: p.title,
    developer: p.developer?.name || 'Independent',
    location: [p.locality, p.district].filter(Boolean).join(', '),
    image: images[0],
    priceRange: formatPrice(totalValue),
    possession: p.created_at ? `Listed ${new Date(p.created_at).toLocaleDateString()}` : 'Recently listed',
    hasRera: !!p.developer?.rera_registered,
  };
};
