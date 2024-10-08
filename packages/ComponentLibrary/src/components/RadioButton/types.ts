export interface RadioButtonItemProps {
  id: number;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: (id: number) => void;
}
