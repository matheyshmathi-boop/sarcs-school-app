import { GraduationCap } from "lucide-react";
import { useEffect } from "react";
import { ensureAuth } from "@/lib/store";

export default function SplashScreen() {
  useEffect(() => {
    ensureAuth();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#1c1c1c] via-[#292929] to-[#1c1c1c] text-white px-8">
      <div className="w-28 h-28 rounded-3xl bg-[#D8B56D] flex items-center justify-center shadow-2xl shadow-black/50 animate-pulse">
        <GraduationCap className="w-16 h-16 text-[#292929]" strokeWidth={1.8} />
      </div>
      <h1 className="mt-8 text-center font-serif text-2xl font-bold tracking-wide leading-snug">
        SRI ANNAI RAANI
        <br />
        CBSE SCHOOL
      </h1>
      <div className="mt-3 h-1 w-16 rounded-full bg-[#D8B56D]" />
      <p className="mt-4 text-sm text-[#D8B56D] tracking-[0.3em] uppercase">
        Excellence · Discipline · Service
      </p>
      <div className="mt-12 flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#D8B56D] animate-bounce" />
        <span className="w-2 h-2 rounded-full bg-[#D8B56D] animate-bounce [animation-delay:0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#D8B56D] animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  );
}