// Flowternity configuration - static structural data (not seed data)

export const SPORTS = [
  { id: 'basketball', name: 'Basketball', status: 'active', description: 'Two international standard basketball courts. Train, compete, excel.', tagline: 'Court #1 · Court #2', image: 'https://images.unsplash.com/photo-1595795279832-13f0df36fbb9?auto=format&fit=crop&q=80&w=1200' },
  { id: 'futsal', name: 'Futsal', status: 'active', description: 'Fast-paced 5-a-side football on a premium indoor pitch.', tagline: 'Indoor · 5-a-side', image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&q=80&w=1200' },
  { id: 'pickleball', name: 'Pickleball', status: 'active', description: 'Dedicated pickleball courts for players of all skill levels.', tagline: 'All levels', image: 'https://images.unsplash.com/photo-1687102618656-907b757ad5d9?auto=format&fit=crop&q=80&w=1200' },
  { id: 'skating', name: 'Skating', status: 'coming_soon', description: 'Professional skating facilities. Ice & roller.', tagline: 'Coming Soon', image: 'https://images.unsplash.com/photo-1696685139596-ed3f10bbb6f0?auto=format&fit=crop&q=80&w=1200' },
  { id: 'skateboarding', name: 'Skateboarding', status: 'coming_soon', description: 'Ramps, rails and obstacles for skaters of every level.', tagline: 'Coming Soon', image: 'https://images.unsplash.com/photo-1547447546-526c3f7462aa?auto=format&fit=crop&q=80&w=1200' },
  { id: 'calisthenics', name: 'Calisthenics', status: 'coming_soon', description: 'Bars, rings and bodyweight strength zones.', tagline: 'Coming Soon', image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&q=80&w=1200' },
  { id: 'yoga', name: 'Yoga', status: 'coming_soon', description: 'Mindful movement, breathwork and flexibility training.', tagline: 'Coming Soon', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200' },
];

export const MEMBERSHIPS = [
  // Kids Elite (up to 2 sports)
  { id: 'kids_1m',  name: 'Kids Elite',  category: 'kids',  duration_months: 1,  price: 2500,  max_sports: 2 },
  { id: 'kids_6m',  name: 'Kids Elite',  category: 'kids',  duration_months: 6,  price: 13500, max_sports: 2, popular: true },
  { id: 'kids_12m', name: 'Kids Elite',  category: 'kids',  duration_months: 12, price: 24000, max_sports: 2, savings: '20% off' },
  // Adult Elite (all sports)
  { id: 'adult_3m',  name: 'Adult Elite', category: 'adult', duration_months: 3,  price: 8000,  max_sports: null },
  { id: 'adult_6m',  name: 'Adult Elite', category: 'adult', duration_months: 6,  price: 15000, max_sports: null, popular: true },
  { id: 'adult_12m', name: 'Adult Elite', category: 'adult', duration_months: 12, price: 28000, max_sports: null, savings: 'Best value' },
];

export const MAX_PAUSE_DAYS = 30;
