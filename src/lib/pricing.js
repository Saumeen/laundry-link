// Pricing structure based on your PDF
export const PRICING_STRUCTURE = {
  // Traditional/Cultural Wear
  "Ghutra/Shimagh": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  "Thawb": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  "Abaya": { iron: 0.400, washIron: 1.000, dryClean: 1.500 },
  "Saree": { iron: 0.200, washIron: 0.500, dryClean: 1.300 },
  "Hijab/Scarf": { iron: 0.200, washIron: 0.400, dryClean: 0.700 },
  "Punjabi": { iron: 0.200, washIron: 0.400, dryClean: 0.800 },
  "Besht": { iron: 1.000, washIron: null, dryClean: 3.500 },
  "Niqab": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  "Daraa/Galabieh": { iron: 0.300, washIron: 0.600, dryClean: 1.500 },
  "Daraa/Galabieh Two Piece": { iron: 1.000, washIron: 1.500, dryClean: 2.000 },
  "Ghahfia": { iron: 0.050, washIron: 0.150, dryClean: 0.200 },
  
  // Regular Clothing
  "Shirt/T-shirt": { iron: 0.200, washIron: 0.400, dryClean: 0.600 },
  "Blouse/Sweater": { iron: 0.200, washIron: 0.400, dryClean: 0.600 },
  "Cardigan": { iron: 0.300, washIron: 0.600, dryClean: 0.800 },
  "Officer Uniform Shirt": { iron: 0.500, washIron: 1.000, dryClean: 1.500 },
  "Vest": { iron: 0.500, washIron: 0.800, dryClean: 1.000 },
  "Tracksuit Jacket": { iron: 0.500, washIron: 0.950, dryClean: 1.300 },
  "Trousers/Pants/Jeans": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  "Shorts": { iron: 0.150, washIron: 0.300, dryClean: 0.400 },
  "Jacket - Tall": { iron: 0.400, washIron: 0.800, dryClean: 1.500 },
  "Jacket - Small & Medium": { iron: 0.300, washIron: 0.600, dryClean: 1.000 },
  "Coat": { iron: 1.000, washIron: 1.300, dryClean: 2.000 },
  "Jeans Jacket": { iron: 0.200, washIron: 0.400, dryClean: 1.000 },
  "Scrubs": { iron: 0.200, washIron: 0.400, dryClean: 1.000 },
  "Tracksuit": { iron: 0.200, washIron: 0.500, dryClean: 1.000 },
  "Doctors Coat": { iron: 0.200, washIron: 0.400, dryClean: 1.000 },
  "Pyjamas": { iron: 0.200, washIron: 0.400, dryClean: 0.800 },
  "Lungi/Wizar": { iron: 0.100, washIron: 0.200, dryClean: 0.400 },
  "Underwear": { iron: 0.100, washIron: 0.200, dryClean: 0.400 },
  "Socks": { iron: null, washIron: 0.100, dryClean: 0.200 },
  "Sarwal Thawb": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  
  // Dresses & Formal Wear
  "Dress Large": { iron: 0.500, washIron: null, dryClean: 3.000 },
  "Dress Medium": { iron: 0.750, washIron: null, dryClean: 2.000 },
  "Dress Small": { iron: 0.500, washIron: null, dryClean: 1.000 },
  "Children Fancy Dress": { iron: 0.200, washIron: 0.400, dryClean: 0.800 },
  "Skirt Normal": { iron: 0.500, washIron: null, dryClean: 0.800 },
  "Skirt Pleated": { iron: 0.500, washIron: null, dryClean: 0.800 },
  "Wedding Dress 1pc": { iron: 5.000, washIron: null, dryClean: 10.000 },
  "Wedding Dress 2pc": { iron: 7.000, washIron: null, dryClean: 15.000 },
  "Wedding Dress 3pc": { iron: 10.000, washIron: null, dryClean: 20.000 },
  
  // Suits
  "Suit 2-piece": { iron: 2.000, washIron: null, dryClean: 3.000 },
  "Suit 3-piece": { iron: 2.400, washIron: null, dryClean: 3.500 },
  "Ladies Suit": { iron: 2.000, washIron: null, dryClean: 3.000 },
  "Suit Jacket": { iron: 1.500, washIron: null, dryClean: 2.500 },
  
  // Children's Clothing
  "Children Jacket": { iron: 0.500, washIron: null, dryClean: 1.000 },
  "School Uniform": { iron: 0.300, washIron: 0.600, dryClean: 1.000 },
  "Children Clothes": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  "Children Dress": { iron: 0.200, washIron: 0.400, dryClean: 0.500 },
  "Children Sweater/Pullover": { iron: 0.150, washIron: 0.300, dryClean: 0.400 },
  "Children Trouser/Pants": { iron: 0.150, washIron: 0.300, dryClean: 0.400 },
  "Children Skirt": { iron: 0.150, washIron: 0.300, dryClean: 0.400 },
  "Children Shirt": { iron: 0.150, washIron: 0.300, dryClean: 0.400 },
  "Children T-Shirt": { iron: 0.150, washIron: 0.300, dryClean: 0.400 },
  "Children Shorts": { iron: 0.300, washIron: 0.500, dryClean: 1.000 },
  "Children Thawb": { iron: 0.100, washIron: 0.200, dryClean: 0.300 },
  "Children Gutra": { iron: 0.100, washIron: 0.200, dryClean: 0.300 },
  "Children Fancy Dress": { iron: 0.200, washIron: 0.400, dryClean: 0.800 },
};

// Bedding items (special category)
export const BEDDING_PRICING = {
  "Blanket Single": { dryClean: 1.500 },
  "Blanket Double": { dryClean: 2.000 },
  "Blanket Children": { dryClean: 1.500 },
  "Bedsheet Single": { iron: 0.400, washIron: 0.800, dryClean: 1.000 },
  "Bedsheet Double": { iron: 0.400, washIron: 0.800, dryClean: 1.000 },
  "Pillow Case": { iron: 0.150, washIron: 0.300, dryClean: 0.500 },
  "Duvet Single": { washIron: 1.000, dryClean: 1.500 },
  "Duvet Double": { washIron: 1.800, dryClean: 2.500 },
  "Duvet Children": { washIron: 0.800, dryClean: 1.000 },
  "Bathrobe": { iron: 0.400, washIron: null, dryClean: 0.800 },
  "Bath Towel Small": { washIron: 0.800, dryClean: 1.000 },
  "Bath Towel Large": { washIron: 0.800, dryClean: 1.000 },
  "Hand Towel": { washIron: 0.400, dryClean: 0.500 },
};

// Service types
export const SERVICE_TYPES = [
  { value: 'iron', label: 'Iron' },
  { value: 'washIron', label: 'Wash & Iron' },
  { value: 'dryClean', label: 'Dry Clean' },
  { value: 'beddings', label: 'Beddings' },
  { value: 'express', label: 'Express' }
];

// Get price for item and service combination
export function getItemPrice(itemType, serviceType) {
  // Check if it's a bedding item
  if (BEDDING_PRICING[itemType]) {
    const price = BEDDING_PRICING[itemType][serviceType === 'beddings' ? 'dryClean' : serviceType];
    return price || 0;
  }
  
  // Regular items
  const item = PRICING_STRUCTURE[itemType];
  if (!item) return 0;
  
  let basePrice = item[serviceType] || 0;
  
  // Double price for express service
  if (serviceType === 'express') {
    // Use the highest available service price as base for express
    basePrice = Math.max(item.iron || 0, item.washIron || 0, item.dryClean || 0);
    basePrice = basePrice * 2;
  }
  
  return basePrice;
}

// Get all available items
export function getAllItems() {
  return [
    ...Object.keys(PRICING_STRUCTURE),
    ...Object.keys(BEDDING_PRICING)
  ].sort();
}
