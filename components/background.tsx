export function Background() {
  return (
    <div className="fixed inset-0 w-full h-full bg-gray-100 transition-none -z-10 overflow-hidden">
      {/* Diagonal stripes pattern */}
      <div
        className="absolute inset-0 opacity-[0.01]"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            #157DFF 0px,
            #157DFF 20px,
            transparent 20px,
            transparent 40px
          )`,
        }}
      />
    </div>
  );
} 