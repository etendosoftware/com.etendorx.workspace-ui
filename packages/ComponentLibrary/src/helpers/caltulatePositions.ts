import { Position } from '../components/enums';

export const calculateTop = (posY: string | number): number | string => {
  if (posY === Position.Center) return '50%';
  if (posY === Position.Bottom) return '65%';
  if (posY === Position.Top) return '5%';
  return posY;
};

export const calculateLeft = (posX: string | number): number | string => {
  if (posX === Position.Center) return '50%';
  if (posX === Position.Left) return '5%';
  if (posX === Position.Right) return '75%';
  return posX;
};
