import { Container } from '../components/enums';
import { calculateTransform } from '../utils/transformUtil';
import { calculateTop, calculateLeft } from './caltulatePositions';

interface ModalStyleProps {
  height: string | number;
  width: string | number;
  posX: string | number;
  posY: string | number;
}

export const calculateModalStyles = ({ height, width, posX, posY }: ModalStyleProps) => {
  return {
    height: height === Container.Auto ? 'auto' : `${height}px`,
    width: width === Container.Auto ? 'auto' : `${width}px`,
    top: calculateTop(posY),
    left: calculateLeft(posX),
    transform: calculateTransform(posX, posY),
  };
};
