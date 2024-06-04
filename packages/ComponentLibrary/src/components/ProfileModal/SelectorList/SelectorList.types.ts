export type Item = 'Rol' | 'Cliente' | 'Organización' | 'Almacén' | 'Lenguaje';

export interface SelectorListProps<T extends string> {
  section: T;
}
