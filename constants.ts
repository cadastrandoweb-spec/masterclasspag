import { Product } from './types';

export const MAIN_PRODUCT: Product = {
  id: 'main-prod-001',
  name: 'Mestres do Tráfego Vitalício',
  price: 197.00,
  // OBS: Substitua a URL abaixo pelo link direto da imagem que você enviou após hospedá-la
  image: '/mestres.webp'
};

export const UPSELL_PRODUCT: Product = {
  id: 'upsell-prod-002',
  name: 'Workshop Home Page Turbinada',
  price: 39.90,
  image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
};

export const UPSELL2_PRODUCT: Product = {
  id: 'upsell-prod-003',
  name: 'Mentoria Audiência Inteligente',
  price: 197.00,
  image: '/logoa.png'
};

// API Endpoints (For the mock service)
export const API_URL = 'http://localhost:3000'; // Assuming local backend for dev