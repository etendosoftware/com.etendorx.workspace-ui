import { Item } from './types';

export const references: Record<string, { item: Item; values: string[] }[]> = {
  profile: [
    { item: Item.Rol, values: ['Admin', 'User', 'Guest'] },
    { item: Item.Cliente, values: ['Organization A', 'Organization B'] },
    { item: Item.Organización, values: ['Client A', 'Client B'] },
    { item: Item.Almacén, values: ['Warehouse 1', 'Warehouse 2'] },
    { item: Item.Lenguaje, values: ['English', 'Spanish'] },
  ],
  password: [],
};
