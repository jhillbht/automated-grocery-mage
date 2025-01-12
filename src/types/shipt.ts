export interface Product {
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
}

export interface Store {
  name: string;
  address: string;
  image: string;
  latitude?: number;
  longitude?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}