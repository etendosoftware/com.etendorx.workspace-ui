export const calculateTransform = (posX: string | number, posY: string | number): string => {
  return posX === "center" && posY === "center" ? "translate(-50%, -50%)" : "none";
};
