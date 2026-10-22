import { useMemo, useState } from "react";
import {
  LayoutDashboard, MessageSquare, FileText, Users, MoreHorizontal, Plus, Send,
  Trash2, Search, Wallet, LogOut, User, Calendar, TrendingUp, CheckCircle2,
  AlertCircle, GraduationCap, BookOpen, Upload, Pin, Timer, Settings, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useDB, uid, fmtDate, fmtMoney, feeStatus, daysUntil,
  changeTeacherPassword, changeTeacherUsername,
  type Session, type Message, type SchoolDoc, type FeeRecord, type Student, type Exam,
} from "@/lib/store";

type Tab = "dashboard" | "messages" | "documents" | "classes" | "more";

export default function TeacherApp({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [db, setDb] = useDB();

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "classes", label: "Classes", icon: Users },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#292929] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-2">
        {tab === "dashboard" && <DashboardTab db={db} session={session} onGo={setTab} />}
        {tab === "messages" && <TeacherMessages db={db} setDb={setDb} />}
        {tab === "documents" && <TeacherDocs db={db} setDb={setDb} />}
        {tab === "classes" && <TeacherClasses db={db} setDb={setDb} />}
        {tab === "more" && <TeacherMore db={db} setDb={setDb} session={session} onLogout={onLogout} />}
      </div>

      <nav className="border-t border-[#D8B56D]/20 bg-[#1c1c1c] flex items-stretch justify-around px-1 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.4)]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors ${
                active ? "text-[#D8B56D]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className={`p-1.5 rounded-lg ${active ? "bg-[#D8B56D]/15" : ""}`}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#D8B56D]" : ""}`}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function DashboardTab({
  db, session, onGo,
}: { db: ReturnType<typeof useDB>[0]; session: Session; onGo: (t: Tab) => void }) {
  const totalStudents = db.students.length;
  const classes = new Set(db.students.map((s) => `${s.className}-${s.section}`)).size;
  const pendingFees = db.fees.filter((f) => f.paid < f.total).length;
  const nextExam = [...db.exams].sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];

  return (
    <div className="p-5 space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-[#1c1c1c] to-[#333333] text-white p-5 shadow-lg border border-[#D8B56D]/25">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D8B56D] flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[#292929]" />
          </div>
          <div>
            <p className="text-xs text-[#D8B56D] uppercase tracking-wide">Teacher Dashboard</p>
            <p className="font-serif text-lg font-bold leading-tight">{session.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat icon={Users} label="Students" value={String(totalStudents)} tint="bg-[#D8B56D]/15 text-[#D8B56D]" />
        <MiniStat icon={BookOpen} label="Classes" value={String(classes)} tint="bg-[#D8B56D]/15 text-[#D8B56D]" />
        <MiniStat icon={Wallet} label="Pending" value={String(pendingFees)} tint="bg-[#D8B56D]/15 text-[#D8B56D]" />
      </div>

      {nextExam && (
        <div className="rounded-2xl bg-[#333333] border border-[#D8B56D]/30 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#D8B56D]/15 flex items-center justify-center">
            <Timer className="w-6 h-6 text-[#D8B56D]" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#D8B56D] uppercase tracking-wide">Next Exam</p>
            <p className="text-sm font-semibold text-white">{nextExam.subject}</p>
            <p className="text-xs text-slate-400">{fmtDate(nextExam.date)} · {nextExam.time}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#D8B56D]">{Math.max(0, daysUntil(nextExam.date))}</p>
            <p className="text-[10px] text-slate-400 uppercase">days left</p>
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-white mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          <ActionBtn icon={Send} label="Send Message" onClick={() => onGo("messages")} />
          <ActionBtn icon={Upload} label="Upload PDF" onClick={() => onGo("documents")} />
          <ActionBtn icon={BookOpen} label="Add Homework" onClick={() => onGo("classes")} />
          <ActionBtn icon={Wallet} label="Manage Fees" onClick={() => onGo("more")} />
        </div>
      </div>

      <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-white mb-2">Recent Announcements</p>
          {db.messages.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-2 py-2 border-b border-[#D8B56D]/10 last:border-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.urgent ? "bg-red-500/15 text-red-400" : "bg-[#D8B56D]/15 text-[#D8B56D]"}`}>
                {m.urgent ? <AlertCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{m.title}</p>
                <p className="text-[10px] text-slate-500">{fmtDate(m.date)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-white mb-2">School Activity Timeline</p>
          {db.activity.slice(0, 4).map((a, i) => (
            <div key={a.id} className="flex gap-3 py-1.5">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D8B56D] mt-1.5" />
                {i < 3 && <div className="w-px flex-1 bg-[#D8B56D]/20 my-1" />}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-sm text-white">{a.text}</p>
                <p className="text-[10px] text-slate-500">{fmtDate(a.date)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tint }: { icon: typeof Users; label: string; value: string; tint: string }) {
  return (
    <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
      <CardContent className="p-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="mt-2 text-lg font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-400">{label}</p>
      </CardContent>
    </Card>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Send; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-2xl bg-[#333333] border border-[#D8B56D]/20 p-3.5 shadow-sm hover:shadow-md hover:border-[#D8B56D] transition-all text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-[#D8B56D] text-[#292929] flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-semibold text-white">{label}</span>
    </button>
  );
}

function TeacherMessages({ db, setDb }: { db: ReturnType<typeof useDB>[0]; setDb: ReturnType<typeof useDB>[1] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("All");
  const [urgent, setUrgent] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [preview, setPreview] = useState(false);

  const reset = () => { setTitle(""); setBody(""); setTarget("All"); setUrgent(false); setPinned(false); setPreview(false); };

  const send = () => {
    if (!title.trim() || !body.trim()) return toast.error("Title and message are required");
    const m: Message = {
      id: uid(), title: title.trim(), body: body.trim(), date: new Date().toISOString(),
      urgent, target, author: "Teacher", readBy: [], pinned,
    };
    setDb((d) => ({
      ...d,
      messages: [m, ...d.messages],
      activity: [{ id: uid(), type: "message", text: `Announcement posted: ${m.title}`, date: new Date().toISOString() }, ...d.activity],
    }));
    toast.success("Announcement sent");
    setOpen(false);
    reset();
  };

  const remove = (id: string) => {
    setDb((d) => ({ ...d, messages: d.messages.filter((m) => m.id !== id) }));
    toast.success("Message deleted");
  };

  const togglePin = (id: string) => {
    setDb((d) => ({ ...d, messages: d.messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)) }));
    toast.success("Pin updated");
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-white">Messages</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm bg-[#333333] border-[#D8B56D]/30 text-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-white">
                {preview ? "Preview Message" : "New Announcement"}
              </DialogTitle>
            </DialogHeader>
            {preview ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#D8B56D]/25 p-4 bg-[#292929]">
                  <div className="flex gap-2 mb-2">
                    {urgent && <Badge className="bg-red-500/20 text-red-300 hover:bg-red-500/20">Urgent</Badge>}
                    {pinned && <Badge className="bg-[#D8B56D]/20 text-[#D8B56D] hover:bg-[#D8B56D]/20">Pinned</Badge>}
                    <Badge variant="outline" className="border-[#D8B56D]/40 text-slate-300">{target}</Badge>
                  </div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{body}</p>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setPreview(false)} className="border-[#D8B56D]/40 text-slate-200 bg-transparent hover:bg-[#D8B56D]/10">Edit</Button>
                  <Button onClick={send} className="bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">Send</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Message</Label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" rows={4} className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Target</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="bg-[#292929] border-[#D8B56D]/25 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#333333] border-[#D8B56D]/30 text-white">
                      <SelectItem value="All">All Students</SelectItem>
                      <SelectItem value="Class 8">Class 8</SelectItem>
                      <SelectItem value="Class 9">Class 9</SelectItem>
                      <SelectItem value="Class 10">Class 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="accent-[#D8B56D]" />
                    Urgent
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-[#D8B56D]" />
                    Pin to noticeboard
                  </label>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => { if (!title.trim() || !body.trim()) return toast.error("Fill title and message"); setPreview(true); }}
                    className="bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold w-full"
                  >
                    Preview
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2.5">
        {db.messages.map((m) => (
          <Card key={m.id} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.urgent ? "bg-red-500/15 text-red-400" : "bg-[#D8B56D]/15 text-[#D8B56D]"}`}>
                  {m.urgent ? <AlertCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{m.title}</p>
                    {m.pinned && <Pin className="w-3 h-3 text-[#D8B56D]" />}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{m.body}</p>
                  <div className="flex gap-1.5 mt-2">
                    <Badge variant="outline" className="text-[10px] border-[#D8B56D]/40 text-slate-300">{m.target}</Badge>
                    <span className="text-[10px] text-slate-500 self-center">{fmtDate(m.date)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => togglePin(m.id)} className={`transition-colors ${m.pinned ? "text-[#D8B56D]" : "text-slate-600 hover:text-[#D8B56D]"}`}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(m.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeacherDocs({ db, setDb }: { db: ReturnType<typeof useDB>[0]; setDb: ReturnType<typeof useDB>[1] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Notes");
  const [subject, setSubject] = useState("Mathematics");
  const [target, setTarget] = useState("All");

  const reset = () => { setTitle(""); setDesc(""); setCat("Notes"); setSubject("Mathematics"); setTarget("All"); };

  const upload = () => {
    if (!title.trim() || !desc.trim()) return toast.error("Title and description are required");
    const d: SchoolDoc = {
      id: uid(), title: title.trim(), description: desc.trim(), category: cat, subject,
      target, date: new Date().toISOString(),
      fileName: title.trim().toLowerCase().replace(/\s+/g, "-") + ".pdf",
    };
    setDb((prev) => ({
      ...prev,
      docs: [d, ...prev.docs],
      activity: [{ id: uid(), type: "doc", text: `Document uploaded: ${d.title}`, date: new Date().toISOString() }, ...prev.activity],
    }));
    toast.success("Document uploaded");
    setOpen(false);
    reset();
  };

  const remove = (id: string) => {
    setDb((prev) => ({ ...prev, docs: prev.docs.filter((d) => d.id !== id) }));
    toast.success("Document removed");
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-white">Documents</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm bg-[#333333] border-[#D8B56D]/30 text-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-white">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Short description" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Category</Label>
                  <Select value={cat} onValueChange={setCat}>
                    <SelectTrigger className="bg-[#292929] border-[#D8B56D]/25 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#333333] border-[#D8B56D]/30 text-white">
                      {["Notes", "Worksheets", "Assignments", "Circulars", "Exam Materials"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="bg-[#292929] border-[#D8B56D]/25 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#333333] border-[#D8B56D]/30 text-white">
                      {["Mathematics", "Science", "English", "Social", "General"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Target</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="bg-[#292929] border-[#D8B56D]/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#333333] border-[#D8B56D]/30 text-white">
                    <SelectItem value="All">All Students</SelectItem>
                    <SelectItem value="Class 8">Class 8</SelectItem>
                    <SelectItem value="Class 9">Class 9</SelectItem>
                    <SelectItem value="Class 10">Class 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={upload} className="w-full bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">Upload</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2.5">
        {db.docs.map((d) => (
          <Card key={d.id} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8B56D]/15 text-[#D8B56D] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{d.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{d.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className="text-[10px] border-[#D8B56D]/40 text-slate-300">{d.category}</Badge>
                    <Badge variant="outline" className="text-[10px] border-[#D8B56D]/40 text-slate-300">{d.subject}</Badge>
                    <span className="text-[10px] text-slate-500 self-center">{fmtDate(d.date)}</span>
                  </div>
                </div>
                <button onClick={() => remove(d.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeacherClasses({ db, setDb }: { db: ReturnType<typeof useDB>[0]; setDb: ReturnType<typeof useDB>[1] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");

  const [examOpen, setExamOpen] = useState(false);
  const [examSubject, setExamSubject] = useState("Mathematics");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("9:00 AM");

  const reset = () => { setTitle(""); setDesc(""); setDue(""); setSubject("Mathematics"); };

  const add = () => {
    if (!title.trim() || !due) return toast.error("Title and due date are required");
    setDb((prev) => ({
      ...prev,
      homework: [
        { id: uid(), title: title.trim(), subject, target: "All", due: new Date(due).toISOString(), description: desc.trim(), done: false },
        ...prev.homework,
      ],
      activity: [{ id: uid(), type: "homework", text: `Homework assigned: ${title.trim()}`, date: new Date().toISOString() }, ...prev.activity],
    }));
    toast.success("Homework assigned");
    setOpen(false);
    reset();
  };

  const addExam = () => {
    if (!examDate) return toast.error("Select an exam date");
    const e: Exam = { id: uid(), subject: examSubject, date: new Date(examDate).toISOString(), time: examTime, className: "All" };
    setDb((prev) => ({
      ...prev,
      exams: [...prev.exams, e],
      activity: [{ id: uid(), type: "exam", text: `Exam scheduled: ${e.subject}`, date: new Date().toISOString() }, ...prev.activity],
    }));
    toast.success("Exam scheduled");
    setExamOpen(false);
    setExamDate("");
  };

  const classes = useMemo(() => {
    const map = new Map<string, Student[]>();
    db.students.forEach((s) => {
      const key = `${s.className}-${s.section}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries());
  }, [db.students]);

  return (
    <div className="p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold text-white">Classes</h2>

      <div className="space-y-2.5">
        {classes.map(([key, students]) => (
          <Card key={key} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#D8B56D] text-[#292929] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-white">Class {key.replace("-", " · Section ")}</p>
                <Badge variant="outline" className="ml-auto text-[10px] border-[#D8B56D]/40 text-slate-300">{students.length} students</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {students.map((s) => (
                  <span key={s.id} className="text-xs bg-[#292929] text-slate-300 rounded-full px-2.5 py-1 border border-[#D8B56D]/15">
                    {s.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm font-semibold text-white">Homework</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm bg-[#333333] border-[#D8B56D]/30 text-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-white">Add Homework</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Homework title" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-[#292929] border-[#D8B56D]/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#333333] border-[#D8B56D]/30 text-white">
                    {["Mathematics", "Science", "English", "Social"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Due Date</Label>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="bg-[#292929] border-[#D8B56D]/25 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              </div>
              <DialogFooter>
                <Button onClick={add} className="w-full bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">Assign</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2.5">
        {db.homework.map((h) => (
          <Card key={h.id} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#D8B56D]/15 text-[#D8B56D] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{h.title}</p>
                <p className="text-xs text-slate-400">{h.subject} · Due {fmtDate(h.due)}</p>
              </div>
              <button
                onClick={() => { setDb((prev) => ({ ...prev, homework: prev.homework.filter((x) => x.id !== h.id) })); toast.success("Removed"); }}
                className="text-slate-600 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm font-semibold text-white">Examination Schedule</p>
        <Dialog open={examOpen} onOpenChange={setExamOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm bg-[#333333] border-[#D8B56D]/30 text-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-white">Schedule Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Subject</Label>
                <Select value={examSubject} onValueChange={setExamSubject}>
                  <SelectTrigger className="bg-[#292929] border-[#D8B56D]/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#333333] border-[#D8B56D]/30 text-white">
                    {["Mathematics", "Science", "English", "Social"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Date</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-[#292929] border-[#D8B56D]/25 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Time</Label>
                <Input value={examTime} onChange={(e) => setExamTime(e.target.value)} className="bg-[#292929] border-[#D8B56D]/25 text-white" />
              </div>
              <DialogFooter>
                <Button onClick={addExam} className="w-full bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">Schedule</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2.5">
        {db.exams.map((e) => (
          <Card key={e.id} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#D8B56D]/15 text-[#D8B56D] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{e.subject}</p>
                <p className="text-xs text-slate-400">{fmtDate(e.date)} · {e.time}</p>
              </div>
              <span className="text-xs font-bold text-[#D8B56D]">{Math.max(0, daysUntil(e.date))}d</span>
              <button
                onClick={() => { setDb((prev) => ({ ...prev, exams: prev.exams.filter((x) => x.id !== e.id) })); toast.success("Removed"); }}
                className="text-slate-600 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeacherMore({
  db, setDb, session, onLogout,
}: { db: ReturnType<typeof useDB>[0]; setDb: ReturnType<typeof useDB>[1]; session: Session; onLogout: () => void }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [curUser, setCurUser] = useState("");
  const [newUser, setNewUser] = useState("");

  const filtered = db.fees.filter((f) =>
    (f.studentName + f.studentId + f.className).toLowerCase().includes(q.toLowerCase())
  );

  const openEdit = (f: FeeRecord) => {
    setEditing(f);
    setPayAmount("");
    setPayNote("");
  };

  const recordPayment = () => {
    if (!editing) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid positive amount");
    const balance = editing.total - editing.paid;
    if (amt > balance) return toast.error(`Amount exceeds balance of ${fmtMoney(balance)}`);
    setDb((prev) => ({
      ...prev,
      fees: prev.fees.map((f) =>
        f.studentId === editing.studentId
          ? {
              ...f,
              paid: f.paid + amt,
              history: [
                ...f.history,
                { id: uid(), amount: amt, date: new Date().toISOString(), note: payNote.trim() || "Payment" },
              ],
            }
          : f
      ),
      activity: [{ id: uid(), type: "fee", text: `Payment recorded for ${editing.studentName}`, date: new Date().toISOString() }, ...prev.activity],
    }));
    toast.success("Payment recorded");
    setEditing(null);
  };

  const updateTotal = (f: FeeRecord, val: string) => {
    const n = Number(val);
    if (isNaN(n) || n < 0) return toast.error("Invalid amount");
    if (n < f.paid) return toast.error("Total cannot be less than amount paid");
    setDb((prev) => ({ ...prev, fees: prev.fees.map((x) => (x.studentId === f.studentId ? { ...x, total: n } : x)) }));
    toast.success("Total updated");
  };

  const savePassword = async () => {
    const res = await changeTeacherPassword(curPass, newPass);
    if (res.ok) {
      toast.success(res.msg);
      setCurPass(""); setNewPass("");
    } else {
      toast.error(res.msg);
    }
  };

  const saveUsername = async () => {
    const res = await changeTeacherUsername(curUser, newUser);
    if (res.ok) {
      toast.success(res.msg);
      setCurUser(""); setNewUser("");
    } else {
      toast.error(res.msg);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold text-white">More</h2>

      <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D8B56D] flex items-center justify-center">
            <User className="w-6 h-6 text-[#292929]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">{session.name}</p>
            <p className="text-xs text-slate-400">Teacher · ID {session.id}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="border-[#D8B56D]/40 text-slate-200 bg-transparent hover:bg-[#D8B56D]/10">
            <KeyRound className="w-3.5 h-3.5 mr-1" /> Credentials
          </Button>
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-semibold text-white mb-2">Fee Management</p>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="pl-9 h-10 bg-[#333333] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
        </div>
        <div className="space-y-2.5">
          {filtered.map((f) => {
            const balance = Math.max(0, f.total - f.paid);
            const status = feeStatus(f);
            return (
              <Card key={f.studentId} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{f.studentName}</p>
                      <p className="text-xs text-slate-400">{f.studentId} · Class {f.className}-{f.section}</p>
                    </div>
                    <Badge className={statusColor(status)}>{status}</Badge>
                  </div>
                  <Progress value={f.total > 0 ? (f.paid / f.total) * 100 : 0} className="h-1.5 bg-[#1c1c1c]" />
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>Paid {fmtMoney(f.paid)}</span>
                    <span>Balance {fmtMoney(balance)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 border-[#D8B56D]/40 text-slate-200 bg-transparent hover:bg-[#D8B56D]/10" onClick={() => openEdit(f)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#D8B56D]/40 text-slate-200 bg-transparent hover:bg-[#D8B56D]/10"
                      onClick={() => {
                        const v = prompt("Enter new total fees:", String(f.total));
                        if (v !== null) updateTotal(f, v);
                      }}
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> Total
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm bg-[#333333] border-[#D8B56D]/30 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-white">Record Payment</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#292929] p-3 text-sm border border-[#D8B56D]/20">
                <p className="font-medium text-white">{editing.studentName}</p>
                <p className="text-xs text-slate-400">
                  Balance: {fmtMoney(Math.max(0, editing.total - editing.paid))}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Amount</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Note (optional)</Label>
                <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="e.g. Term 2" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              </div>
              <DialogFooter>
                <Button onClick={recordPayment} className="w-full bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Record Payment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm bg-[#333333] border-[#D8B56D]/30 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D8B56D]" /> Security Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#D8B56D] uppercase tracking-wide">Change Password</p>
              <Input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="Current password" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password (min 6 chars)" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              <Button onClick={savePassword} className="w-full bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold">Update Password</Button>
            </div>
            <div className="h-px bg-[#D8B56D]/20" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#D8B56D] uppercase tracking-wide">Change Username</p>
              <Input value={curUser} onChange={(e) => setCurUser(e.target.value)} placeholder="Current username" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              <Input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="New username" className="bg-[#292929] border-[#D8B56D]/25 text-white placeholder:text-slate-500" />
              <Button onClick={saveUsername} variant="outline" className="w-full border-[#D8B56D]/40 text-slate-200 bg-transparent hover:bg-[#D8B56D]/10">Update Username</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {[
          { icon: Calendar, label: "Academic Calendar", desc: "Term dates & events" },
          { icon: Calendar, label: "Holiday Management", desc: "Manage holidays" },
          { icon: User, label: "Teacher Profile", desc: session.name },
          { icon: Settings, label: "App Settings", desc: "Preferences" },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.label}
              onClick={() => toast.info(`${it.label} — coming soon`)}
              className="w-full flex items-center gap-3 rounded-2xl bg-[#333333] border border-[#D8B56D]/20 p-4 shadow-sm hover:shadow-md hover:border-[#D8B56D] transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#D8B56D]/15 text-[#D8B56D] flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{it.label}</p>
                <p className="text-xs text-slate-400">{it.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={onLogout} variant="outline" className="w-full h-11 border-red-500/40 text-red-400 hover:bg-red-500/10 bg-transparent">
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </Button>
    </div>
  );
}

function statusColor(s: string) {
  if (s === "Paid") return "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20";
  if (s === "Partially Paid") return "bg-[#D8B56D]/20 text-[#D8B56D] hover:bg-[#D8B56D]/20";
  return "bg-red-500/20 text-red-300 hover:bg-red-500/20";
}