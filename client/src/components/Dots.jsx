import React from "react";

const Dots = ({ current, total }) => {
  return (
    <div className="mb-9 flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-7 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]"
              : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
};

export default Dots;
