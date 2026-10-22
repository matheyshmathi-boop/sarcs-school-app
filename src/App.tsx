import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import SplashScreen from "@/components/SplashScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import StudentApp from "@/components/StudentApp";
import TeacherApp from "@/components/TeacherApp";
import { loadSession, saveSession, clearSession, type Session } from "@/lib/store";

type Phase = "splash" | "welcome" | "app";

export default function App() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("welcome"), 1900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (s) setSession(s);
  }, []);

  const handleLogin = (s: Session) => {
    setSession(s);
    saveSession(s);
    setPhase("app");
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setPhase("welcome");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-md h-screen sm:h-auto sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl overflow-hidden relative flex flex-col">
        {phase === "splash" && <SplashScreen />}
        {phase === "welcome" && <WelcomeScreen onLogin={handleLogin} />}
        {phase === "app" && session?.role === "student" && (
          <StudentApp session={session} onLogout={handleLogout} />
        )}
        {phase === "app" && session?.role === "teacher" && (
          <TeacherApp session={session} onLogout={handleLogout} />
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}