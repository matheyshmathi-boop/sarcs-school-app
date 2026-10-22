import { useMemo, useState } from "react";
import {
  Home, MessageSquare, FileText, Wallet, MoreHorizontal, Bell, Calendar,
  BookOpen, Search, Download, ChevronRight, LogOut, User, HelpCircle,
  Settings, Clock, GraduationCap, AlertCircle, CheckCircle2, TrendingUp,
  Pin, Timer, Activity as ActivityIcon, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  useDB, fmtDate, fmtMoney, feeStatus, daysUntil, type Session, type Message, type SchoolDoc,
} from "@/lib/store";

type Tab = "home" | "messages" | "documents" | "fees" | "more";

export default function StudentApp({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [db, setDb] = useDB();

  const initials = session.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const myFee = db.fees.find((f) => f.studentId === session.id);

  const markRead = (id: string) => {
    setDb((d) => ({
      ...d,
      messages: d.messages.map((m) =>
        m.id === id && !m.readBy.includes(session.id)
          ? { ...m, readBy: [...m.readBy, session.id] }
          : m
      ),
    }));
  };

  const toggleHomework = (id: string) => {
    setDb((d) => ({
      ...d,
      homework: d.homework.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    }));
  };

  const unread = db.messages.filter((m) => !m.readBy.includes(session.id)).length;

  const tabs: { id: Tab; label: string; icon: typeof Home; badge?: number }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unread },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "fees", label: "Fees", icon: Wallet },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#292929] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-2">
        {tab === "home" && (
          <HomeTab session={session} db={db} initials={initials} onGo={setTab} onToggleHomework={toggleHomework} />
        )}
        {tab === "messages" && <MessagesTab db={db} session={session} markRead={markRead} />}
        {tab === "documents" && <DocsTab db={db} />}
        {tab === "fees" && <FeesTab fee={myFee} />}
        {tab === "more" && <MoreTab session={session} onLogout={onLogout} db={db} />}
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
              <div className={`relative p-1.5 rounded-lg ${active ? "bg-[#D8B56D]/15" : ""}`}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                {t.badge ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#D8B56D] text-[#292929] text-[10px] font-bold flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#D8B56D]" : ""}`}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function HomeTab({
  session, db, initials, onGo, onToggleHomework,
}: {
  session: Session;
  db: ReturnType<typeof useDB>[0];
  initials: string;
  onGo: (t: Tab) => void;
  onToggleHomework: (id: string) => void;
}) {
  const pinned = db.messages.filter((m) => m.pinned);
  const announcements = db.messages.slice(0, 3);
  const homework = db.homework.slice(0, 3);
  const fee = db.fees.find((f) => f.studentId === session.id);
  const nextExam = [...db.exams].sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];

  return (
    <div className="p-5 space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-[#1c1c1c] to-[#333333] text-white p-5 shadow-lg border border-[#D8B56D]/25">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#D8B56D] flex items-center justify-center font-bold text-[#292929] text-lg shadow-md">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#D8B56D] tracking-wide uppercase">Welcome back</p>
            <p className="font-serif text-lg font-bold leading-tight">{session.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Class {session.className} · Section {session.section} · ID {session.id}
            </p>
          </div>
        </div>
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

      <div className="grid grid-cols-2 gap-3">
        <QuickCard icon={MessageSquare} label="Messages" tint="bg-[#D8B56D]/15 text-[#D8B56D]" onClick={() => onGo("messages")} />
        <QuickCard icon={FileText} label="Documents" tint="bg-[#D8B56D]/15 text-[#D8B56D]" onClick={() => onGo("documents")} />
        <QuickCard icon={Clock} label="Timetable" tint="bg-[#D8B56D]/15 text-[#D8B56D]" onClick={() => onGo("more")} />
        <QuickCard icon={Wallet} label="Fees" tint="bg-[#D8B56D]/15 text-[#D8B56D]" onClick={() => onGo("fees")} />
      </div>

      {fee && (
        <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">Fee Status</p>
              <Badge className={statusColor(feeStatus(fee))}>{feeStatus(fee)}</Badge>
            </div>
            <Progress value={(fee.paid / fee.total) * 100} className="h-2 bg-[#1c1c1c]" />
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Paid {fmtMoney(fee.paid)}</span>
              <span>Balance {fmtMoney(fee.total - fee.paid)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {pinned.length > 0 && (
        <Section title="Pinned Noticeboard" icon={Pin}>
          {pinned.map((m) => (
            <div key={m.id} className="flex gap-3 py-2.5 border-b border-[#D8B56D]/10 last:border-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#D8B56D]/15 text-[#D8B56D]">
                <Pin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{m.title}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{m.body}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(m.date)}</p>
              </div>
            </div>
          ))}
        </Section>
      )}

      <Section title="Latest Announcements" icon={Bell}>
        {announcements.map((m) => (
          <div key={m.id} className="flex gap-3 py-2.5 border-b border-[#D8B56D]/10 last:border-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.urgent ? "bg-red-500/15 text-red-400" : "bg-[#D8B56D]/15 text-[#D8B56D]"}`}>
              {m.urgent ? <AlertCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{m.title}</p>
              <p className="text-xs text-slate-400 line-clamp-2">{m.body}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(m.date)}</p>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Homework Tracker" icon={BookOpen}>
        {homework.map((h) => (
          <button
            key={h.id}
            onClick={() => onToggleHomework(h.id)}
            className="w-full flex items-center gap-3 py-2.5 border-b border-[#D8B56D]/10 last:border-0 text-left"
          >
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              h.done ? "bg-[#D8B56D] border-[#D8B56D]" : "border-slate-500"
            }`}>
              {h.done && <Check className="w-4 h-4 text-[#292929]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${h.done ? "text-slate-500 line-through" : "text-white"}`}>{h.title}</p>
              <p className="text-xs text-slate-400">{h.subject} · Due {fmtDate(h.due)}</p>
            </div>
          </button>
        ))}
      </Section>

      <Section title="School Activity Timeline" icon={ActivityIcon}>
        {db.activity.slice(0, 4).map((a, i) => (
          <div key={a.id} className="flex gap-3 py-2">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D8B56D] mt-1.5" />
              {i < 3 && <div className="w-px flex-1 bg-[#D8B56D]/20 my-1" />}
            </div>
            <div className="flex-1 pb-2">
              <p className="text-sm text-white">{a.text}</p>
              <p className="text-[10px] text-slate-500">{fmtDate(a.date)}</p>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function QuickCard({ icon: Icon, label, tint, onClick }: { icon: typeof Home; label: string; tint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-[#333333] border border-[#D8B56D]/20 p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#D8B56D] transition-all"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{label}</p>
    </button>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Home; children: React.ReactNode }) {
  return (
    <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-[#D8B56D]" />
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function MessagesTab({
  db, session, markRead,
}: { db: ReturnType<typeof useDB>[0]; session: Session; markRead: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");
  const [open, setOpen] = useState<Message | null>(null);

  const list = useMemo(() => {
    return db.messages.filter((m) => {
      if (filter === "unread" && m.readBy.includes(session.id)) return false;
      if (filter === "urgent" && !m.urgent) return false;
      if (q && !(m.title + m.body).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [db.messages, q, filter, session.id]);

  if (open) {
    return (
      <div className="p-5 space-y-4">
        <button onClick={() => setOpen(null)} className="text-sm text-slate-400 hover:text-[#D8B56D]">← Back</button>
        <div>
          <div className="flex items-center gap-2 mb-2">
            {open.urgent && <Badge className="bg-red-500/20 text-red-300 hover:bg-red-500/20">Urgent</Badge>}
            {open.pinned && <Badge className="bg-[#D8B56D]/20 text-[#D8B56D] hover:bg-[#D8B56D]/20">Pinned</Badge>}
            <Badge variant="outline" className="border-[#D8B56D]/40 text-slate-300">{open.target}</Badge>
          </div>
          <h2 className="font-serif text-xl font-bold text-white">{open.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{fmtDate(open.date)} · {open.author}</p>
        </div>
        <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
          <CardContent className="p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {open.body}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold text-white">Messages</h2>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search messages…"
          className="pl-9 h-10 bg-[#333333] border-[#D8B56D]/25 text-white placeholder:text-slate-500"
        />
      </div>
      <div className="flex gap-2">
        {(["all", "unread", "urgent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-[#D8B56D] text-[#292929]" : "bg-[#333333] border border-[#D8B56D]/25 text-slate-300 hover:border-[#D8B56D]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages" desc="Nothing matches your filters." />
      ) : (
        <div className="space-y-2.5">
          {list.map((m) => {
            const isUnread = !m.readBy.includes(session.id);
            return (
              <button
                key={m.id}
                onClick={() => { setOpen(m); markRead(m.id); }}
                className={`w-full text-left rounded-2xl border bg-[#333333] p-4 shadow-sm hover:shadow-md transition-all ${
                  isUnread ? "border-[#D8B56D]" : "border-[#D8B56D]/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.urgent ? "bg-red-500/15 text-red-400" : "bg-[#D8B56D]/15 text-[#D8B56D]"}`}>
                    {m.urgent ? <AlertCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${isUnread ? "font-bold text-white" : "font-medium text-slate-300"}`}>{m.title}</p>
                      {m.pinned && <Pin className="w-3 h-3 text-[#D8B56D] shrink-0" />}
                      {isUnread && <span className="w-2 h-2 rounded-full bg-[#D8B56D] shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{m.body}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{fmtDate(m.date)} · {m.author}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocsTab({ db }: { db: ReturnType<typeof useDB>[0] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", "Notes", "Worksheets", "Assignments", "Circulars", "Exam Materials"];

  const list = db.docs.filter((d) => {
    if (cat !== "All" && d.category !== cat) return false;
    if (q && !(d.title + d.subject + d.description).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const download = (d: SchoolDoc) => {
    const blob = new Blob(
      [`SRI ANNAI RAANI CBSE SCHOOL\n\n${d.title}\n\n${d.description}\n\nCategory: ${d.category}\nSubject: ${d.subject}\nUploaded: ${fmtDate(d.date)}`],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = d.fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded");
  };

  return (
    <div className="p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold text-white">Documents</h2>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or subject…"
          className="pl-9 h-10 bg-[#333333] border-[#D8B56D]/25 text-white placeholder:text-slate-500"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              cat === c ? "bg-[#D8B56D] text-[#292929]" : "bg-[#333333] border border-[#D8B56D]/25 text-slate-300 hover:border-[#D8B56D]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" desc="Try a different category or search." />
      ) : (
        <div className="space-y-2.5">
          {list.map((d) => (
            <Card key={d.id} className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D8B56D]/15 text-[#D8B56D] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{d.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{d.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[10px] border-[#D8B56D]/40 text-slate-300">{d.category}</Badge>
                      <Badge variant="outline" className="text-[10px] border-[#D8B56D]/40 text-slate-300">{d.subject}</Badge>
                      <span className="text-[10px] text-slate-500 self-center">{fmtDate(d.date)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => download(d)}
                  size="sm"
                  className="w-full mt-3 bg-[#D8B56D] hover:bg-[#c9a355] text-[#292929] font-semibold"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Open / Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FeesTab({ fee }: { fee?: ReturnType<typeof useDB>[0]["fees"][number] }) {
  if (!fee) {
    return (
      <div className="p-5">
        <h2 className="font-serif text-xl font-bold text-white mb-4">Fees</h2>
        <EmptyState icon={Wallet} title="No fee record" desc="Your fee record has not been set up yet. Please contact the school office." />
      </div>
    );
  }
  const balance = Math.max(0, fee.total - fee.paid);
  const pct = fee.total > 0 ? Math.min(100, (fee.paid / fee.total) * 100) : 0;
  const status = feeStatus(fee);

  return (
    <div className="p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold text-white">Fees</h2>

      <div className="rounded-2xl bg-gradient-to-br from-[#1c1c1c] to-[#333333] text-white p-5 shadow-lg border border-[#D8B56D]/25">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#D8B56D] uppercase tracking-wide">Academic Year {fee.academicYear}</p>
          <Badge className={statusColor(status)}>{status}</Badge>
        </div>
        <p className="mt-3 text-3xl font-bold">{fmtMoney(fee.total)}</p>
        <p className="text-xs text-slate-400">Total School Fees</p>
        <div className="mt-4">
          <Progress value={pct} className="h-2.5 bg-[#1c1c1c]" />
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-emerald-400">Paid {fmtMoney(fee.paid)}</span>
            <span className="text-[#D8B56D]">Balance {fmtMoney(balance)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={CheckCircle2} label="Amount Paid" value={fmtMoney(fee.paid)} tint="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={TrendingUp} label="Remaining" value={fmtMoney(balance)} tint="bg-[#D8B56D]/15 text-[#D8B56D]" />
      </div>

      <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-white mb-3">Fee Breakdown</p>
          {[
            { name: "Tuition Fees", pct: 0.6 },
            { name: "Term Fees", pct: 0.15 },
            { name: "Examination Fees", pct: 0.08 },
            { name: "Books & Uniform", pct: 0.1 },
            { name: "Transport", pct: 0.07 },
          ].map((c) => (
            <div key={c.name} className="flex justify-between py-2 border-b border-[#D8B56D]/10 last:border-0 text-sm">
              <span className="text-slate-300">{c.name}</span>
              <span className="font-medium text-white">{fmtMoney(Math.round(fee.total * c.pct))}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-white mb-3">Payment History</p>
          {fee.history.length === 0 ? (
            <p className="text-xs text-slate-400">No payments recorded yet.</p>
          ) : (
            fee.history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-[#D8B56D]/10 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{fmtMoney(h.amount)}</p>
                  <p className="text-xs text-slate-400">{h.note} · {fmtDate(h.date)}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
        Online payments are not enabled. Please pay at the school office. Records update after authorized staff entry.
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof Home; label: string; value: string; tint: string }) {
  return (
    <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
      <CardContent className="p-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="mt-2 text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </CardContent>
    </Card>
  );
}

function MoreTab({ session, onLogout, db }: { session: Session; onLogout: () => void; db: ReturnType<typeof useDB>[0] }) {
  const items = [
    { icon: Clock, label: "Class Timetable", desc: "Weekly schedule" },
    { icon: Calendar, label: "Examination Timetable", desc: `${db.exams.length} exams scheduled` },
    { icon: BookOpen, label: "Homework & Assignments", desc: `${db.homework.filter((h) => !h.done).length} pending` },
    { icon: Calendar, label: "Holiday List", desc: "School holidays" },
    { icon: GraduationCap, label: "Academic Calendar", desc: "Term dates" },
    { icon: User, label: "Student Profile", desc: session.name },
    { icon: HelpCircle, label: "Help & Support", desc: "Contact school" },
    { icon: Settings, label: "App Settings", desc: "Preferences" },
  ];
  return (
    <div className="p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold text-white">More</h2>
      <Card className="border-[#D8B56D]/25 bg-[#333333] shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D8B56D] flex items-center justify-center font-bold text-[#292929]">
            {session.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="font-semibold text-white">{session.name}</p>
            <p className="text-xs text-slate-400">Class {session.className} · Section {session.section}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.map((it) => {
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
              <ChevronRight className="w-4 h-4 text-slate-600" />
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

function EmptyState({ icon: Icon, title, desc }: { icon: typeof Home; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#333333] flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{desc}</p>
    </div>
  );
}

function statusColor(s: string) {
  if (s === "Paid") return "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20";
  if (s === "Partially Paid") return "bg-[#D8B56D]/20 text-[#D8B56D] hover:bg-[#D8B56D]/20";
  return "bg-red-500/20 text-red-300 hover:bg-red-500/20";
}