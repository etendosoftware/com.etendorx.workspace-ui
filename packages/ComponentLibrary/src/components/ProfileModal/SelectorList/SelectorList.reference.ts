import { Item } from './SelectorList.types';

export const references: Record<string, { item: Item; values: string[] }[]> = {
    profile: [
        { item: Item.Rol, values: ['1', '2', '3'] },
        { item: Item.Cliente, values: ['1', '2', '3'] },
        { item: Item.Organización, values: ['1', '2', '3'] },
        { item: Item.Almacén, values: ['1', '2', '3'] },
        { item: Item.Lenguaje, values: ['1', '2', '3'] },
      ],  password: [],
};
