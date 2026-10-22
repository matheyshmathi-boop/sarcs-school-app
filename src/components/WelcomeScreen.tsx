import { useState } from "react";
import { GraduationCap, Users, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { loadDB, verifyTeacher, type Session } from "@/lib/store";

export default function WelcomeScreen({ onLogin }: { onLogin: (s: Session) => void }) {
  const [mode, setMode] = useState<"choose" | "student" | "teacher">("choose");
  const [studentId, setStudentId] = useState("");
  const [tUser, setTUser] = useState("");
  const [tPass, setTPass] = useState("");
  const [busy, setBusy] = useState(false);

  const studentLogin = () => {
    const id = studentId.trim().toUpperCase();
    if (!id) return toast.error("Please enter your Student ID");
    const db = loadDB();
    const s = db.students.find((x) => x.id.toUpperCase() === id);
    if (!s) return toast.error("Student ID not found. Try S001, S002, S003…");
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success(`Welcome, ${s.name.split(" ")[0]}!`);
      onLogin({ role: "student", name: s.name, id: s.id, className: s.className, section: s.section });
    }, 400);
  };

  const teacherLogin = async () => {
    if (!tUser.trim() || !tPass) return toast.error("Enter username and password");
    setBusy(true);
    const ok = await verifyTeacher(tUser, tPass);
    setBusy(false);
    if (!ok) return toast.error("Invalid teacher credentials");
    toast.success("Teacher access granted");
    onLogin({ role: "teacher", name: "Mrs. Lakshmi Raman", id: "T001" });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#292929] overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1c1c1c] to-[#292929] text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-lg border-b border-[#D8B56D]/30">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#D8B56D] flex items-center justify-center shadow-md">
            <GraduationCap className="w-8 h-8 text-[#292929]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold leading-tight">SRI ANNAI RAANI</h1>
            <p className="text-xs tracking-[0.2em] text-[#D8B56D] uppercase">CBSE School</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-300 leading-relaxed">
          Welcome to your school companion. Sign in to access messages, documents, fees and more.
        </p>
      </div>

      <div className="p-6 flex-1">
        {mode === "choose" && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-white">Choose your role</h2>
            <button
              onClick={() => setMode("student")}
              className="w-full text-left rounded-2xl border border-[#D8B56D]/25 bg-[#333333] p-5 shadow-sm hover:shadow-md hover:border-[#D8B56D] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D8B56D]/15 flex items-center justify-center group-hover:bg-[#D8B56D] transition-colors">
                  <Users className="w-6 h-6 text-[#D8B56D] group-hover:text-[#292929] transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Student Login</p>
                  <p className="text-xs text-slate-400">View messages, documents & fees</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-[#D8B56D] group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={() => setMode("teacher")}
              className="w-full text-left rounded-2xl border border-[#D8B56D]/25 bg-[#333333] p-5 shadow-sm hover:shadow-md hover:border-[#D8B56D] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D8B56D]/15 flex items-center justify-center group-hover:bg-[#D8B56D] transition-colors">
                  <ShieldCheck className="w-6 h-6 text-[#D8B56D] group-hover:text-[#292929] transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Teacher Login</p>
                  <p className="text-xs text-slate-400">Full school management access</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-[#D8B56D] group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <Card className="border-dashed border-[#D8B56D]/40 bg-[#333333]">
              <CardContent className="p-4 text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-[#D8B56D]">Demo access:</span> Student IDs{" "}
                <span className="font-mono text-slate-200">S001</span>,{" "}
                <span className="font-mono text-slate-200">S002</span>,{" "}
                <span className="font-mono text-slate-200">S003</span>. Teacher credentials are configured securely.
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "student" && (
          <div className="space-y-5">
            <button onClick={() => setMode("choose")} className="text-sm text-slate-400 hover:text-[#D8B56D]">
              ← Back
            </button>
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Student Sign In</h2>
              <p className="text-sm text-slate-400 mt-1">Enter your Student ID to continue</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sid" className="text-slate-300">Student ID</Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  id="sid"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. S001"
                  className="pl-9 h-11 bg-[#333333] border-[#D8B56D]/25 text-white placeholder:text-slate-500"
                  onKeyDown={(e) => e.key === "Enter" && studentLogin()}
                />
              </div>
            </div>
            <Button
              onClick={studentLogin}
              disabled={busy}
              className="w-full h-11 bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold"
            >
              {busy ? "Signing in…" : "Sign In as Student"}
            </Button>
          </div>
        )}

        {mode === "teacher" && (
          <div className="space-y-5">
            <button onClick={() => setMode("choose")} className="text-sm text-slate-400 hover:text-[#D8B56D]">
              ← Back
            </button>
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Teacher Sign In</h2>
              <p className="text-sm text-slate-400 mt-1">Authorized staff only</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tu" className="text-slate-300">Username</Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  id="tu"
                  value={tUser}
                  onChange={(e) => setTUser(e.target.value)}
                  className="pl-9 h-11 bg-[#333333] border-[#D8B56D]/25 text-white placeholder:text-slate-500"
                  placeholder="teacher"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  id="tp"
                  type="password"
                  value={tPass}
                  onChange={(e) => setTPass(e.target.value)}
                  className="pl-9 h-11 bg-[#333333] border-[#D8B56D]/25 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && teacherLogin()}
                />
              </div>
            </div>
            <Button
              onClick={teacherLogin}
              disabled={busy}
              className="w-full h-11 bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold"
            >
              {busy ? "Verifying…" : "Sign In as Teacher"}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Credentials are validated securely. You can change them from Teacher → More → Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}