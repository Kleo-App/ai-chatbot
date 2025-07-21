export function Background() {
  return (
    <div className="fixed inset-0 size-full bg-gradient-to-br from-white via-blue-50/60 to-purple-50/40 transition-none -z-10 overflow-hidden">
      {/* Colorful orbs for visual interest */}
      <div className="absolute top-20 left-10 size-64 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 size-48 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute bottom-40 left-20 size-56 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse delay-2000" />
      <div className="absolute bottom-20 right-10 size-40 bg-gradient-to-r from-orange-200/25 to-yellow-200/25 rounded-full blur-3xl animate-pulse delay-3000" />
      

      
      {/* Grid pattern for additional texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          background: `
            linear-gradient(90deg, #157DFF 1px, transparent 1px),
            linear-gradient(180deg, #157DFF 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />
    </div>
  );
} 