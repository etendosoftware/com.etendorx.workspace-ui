export const ColorCell = ({ color }) => {
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor: color,
      }}
    />
  );
};

export default ColorCell;
