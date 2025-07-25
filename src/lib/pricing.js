// Pricing structure based on your PDF
export const PRICING_STRUCTURE = {
  // Traditional/Cultural Wear
  'Ghutra/Shimagh': { iron: 0.2, washIron: 0.4, dryClean: 0.5 },
  Thawb: { iron: 0.2, washIron: 0.4, dryClean: 0.5 },
  Abaya: { iron: 0.4, washIron: 1.0, dryClean: 1.5 },
  Saree: { iron: 0.2, washIron: 0.5, dryClean: 1.3 },
  'Hijab/Scarf': { iron: 0.2, washIron: 0.4, dryClean: 0.7 },
  Punjabi: { iron: 0.2, washIron: 0.4, dryClean: 0.8 },
  Besht: { iron: 1.0, washIron: null, dryClean: 3.5 },
  Niqab: { iron: 0.2, washIron: 0.4, dryClean: 0.5 },
  'Daraa/Galabieh': { iron: 0.3, washIron: 0.6, dryClean: 1.5 },
  'Daraa/Galabieh Two Piece': { iron: 1.0, washIron: 1.5, dryClean: 2.0 },
  Ghahfia: { iron: 0.05, washIron: 0.15, dryClean: 0.2 },

  // Regular Clothing
  'Shirt/T-shirt': { iron: 0.2, washIron: 0.4, dryClean: 0.6 },
  'Blouse/Sweater': { iron: 0.2, washIron: 0.4, dryClean: 0.6 },
  Cardigan: { iron: 0.3, washIron: 0.6, dryClean: 0.8 },
  'Officer Uniform Shirt': { iron: 0.5, washIron: 1.0, dryClean: 1.5 },
  Vest: { iron: 0.5, washIron: 0.8, dryClean: 1.0 },
  'Tracksuit Jacket': { iron: 0.5, washIron: 0.95, dryClean: 1.3 },
  'Trousers/Pants/Jeans': { iron: 0.2, washIron: 0.4, dryClean: 0.5 },
  Shorts: { iron: 0.15, washIron: 0.3, dryClean: 0.4 },
  'Jacket - Tall': { iron: 0.4, washIron: 0.8, dryClean: 1.5 },
  'Jacket - Small & Medium': { iron: 0.3, washIron: 0.6, dryClean: 1.0 },
  Coat: { iron: 1.0, washIron: 1.3, dryClean: 2.0 },
  'Jeans Jacket': { iron: 0.2, washIron: 0.4, dryClean: 1.0 },
  Scrubs: { iron: 0.2, washIron: 0.4, dryClean: 1.0 },
  Tracksuit: { iron: 0.2, washIron: 0.5, dryClean: 1.0 },
  'Doctors Coat': { iron: 0.2, washIron: 0.4, dryClean: 1.0 },
  Pyjamas: { iron: 0.2, washIron: 0.4, dryClean: 0.8 },
  'Lungi/Wizar': { iron: 0.1, washIron: 0.2, dryClean: 0.4 },
  Underwear: { iron: 0.1, washIron: 0.2, dryClean: 0.4 },
  Socks: { iron: null, washIron: 0.1, dryClean: 0.2 },
  'Sarwal Thawb': { iron: 0.2, washIron: 0.4, dryClean: 0.5 },

  // Dresses & Formal Wear
  'Dress Large': { iron: 0.5, washIron: null, dryClean: 3.0 },
  'Dress Medium': { iron: 0.75, washIron: null, dryClean: 2.0 },
  'Dress Small': { iron: 0.5, washIron: null, dryClean: 1.0 },
  'Children Fancy Dress': { iron: 0.2, washIron: 0.4, dryClean: 0.8 },
  'Skirt Normal': { iron: 0.5, washIron: null, dryClean: 0.8 },
  'Skirt Pleated': { iron: 0.5, washIron: null, dryClean: 0.8 },
  'Wedding Dress 1pc': { iron: 5.0, washIron: null, dryClean: 10.0 },
  'Wedding Dress 2pc': { iron: 7.0, washIron: null, dryClean: 15.0 },
  'Wedding Dress 3pc': { iron: 10.0, washIron: null, dryClean: 20.0 },

  // Suits
  'Suit 2-piece': { iron: 2.0, washIron: null, dryClean: 3.0 },
  'Suit 3-piece': { iron: 2.4, washIron: null, dryClean: 3.5 },
  'Ladies Suit': { iron: 2.0, washIron: null, dryClean: 3.0 },
  'Suit Jacket': { iron: 1.5, washIron: null, dryClean: 2.5 },

  // Children's Clothing
  'Children Jacket': { iron: 0.5, washIron: null, dryClean: 1.0 },
  'School Uniform': { iron: 0.3, washIron: 0.6, dryClean: 1.0 },
  'Children Clothes': { iron: 0.2, washIron: 0.4, dryClean: 0.5 },
  'Children Dress': { iron: 0.2, washIron: 0.4, dryClean: 0.5 },
  'Children Sweater/Pullover': { iron: 0.15, washIron: 0.3, dryClean: 0.4 },
  'Children Trouser/Pants': { iron: 0.15, washIron: 0.3, dryClean: 0.4 },
  'Children Skirt': { iron: 0.15, washIron: 0.3, dryClean: 0.4 },
  'Children Shirt': { iron: 0.15, washIron: 0.3, dryClean: 0.4 },
  'Children T-Shirt': { iron: 0.15, washIron: 0.3, dryClean: 0.4 },
  'Children Shorts': { iron: 0.3, washIron: 0.5, dryClean: 1.0 },
  'Children Thawb': { iron: 0.1, washIron: 0.2, dryClean: 0.3 },
  'Children Gutra': { iron: 0.1, washIron: 0.2, dryClean: 0.3 },
  'Children Fancy Dress': { iron: 0.2, washIron: 0.4, dryClean: 0.8 },
};

// Bedding items (special category)
export const BEDDING_PRICING = {
  'Blanket Single': { dryClean: 1.5 },
  'Blanket Double': { dryClean: 2.0 },
  'Blanket Children': { dryClean: 1.5 },
  'Bedsheet Single': { iron: 0.4, washIron: 0.8, dryClean: 1.0 },
  'Bedsheet Double': { iron: 0.4, washIron: 0.8, dryClean: 1.0 },
  'Pillow Case': { iron: 0.15, washIron: 0.3, dryClean: 0.5 },
  'Duvet Single': { washIron: 1.0, dryClean: 1.5 },
  'Duvet Double': { washIron: 1.8, dryClean: 2.5 },
  'Duvet Children': { washIron: 0.8, dryClean: 1.0 },
  Bathrobe: { iron: 0.4, washIron: null, dryClean: 0.8 },
  'Bath Towel Small': { washIron: 0.8, dryClean: 1.0 },
  'Bath Towel Large': { washIron: 0.8, dryClean: 1.0 },
  'Hand Towel': { washIron: 0.4, dryClean: 0.5 },
};

// Service types
export const SERVICE_TYPES = [
  { value: 'iron', label: 'Iron' },
  { value: 'washIron', label: 'Wash & Iron' },
  { value: 'dryClean', label: 'Dry Clean' },
  { value: 'beddings', label: 'Beddings' },
  { value: 'express', label: 'Express' },
];

// Get price for item and service combination
export function getItemPrice(itemType, serviceType) {
  // Check if it's a bedding item
  if (BEDDING_PRICING[itemType]) {
    const price =
      BEDDING_PRICING[itemType][
        serviceType === 'beddings' ? 'dryClean' : serviceType
      ];
    return price || 0;
  }

  // Regular items
  const item = PRICING_STRUCTURE[itemType];
  if (!item) return 0;

  let basePrice = item[serviceType] || 0;

  // Double price for express service
  if (serviceType === 'express') {
    // Use the highest available service price as base for express
    basePrice = Math.max(
      item.iron || 0,
      item.washIron || 0,
      item.dryClean || 0
    );
    basePrice = basePrice * 2;
  }

  return basePrice;
}

// Get all available items
export function getAllItems() {
  return [
    ...Object.keys(PRICING_STRUCTURE),
    ...Object.keys(BEDDING_PRICING),
  ].sort();
}
