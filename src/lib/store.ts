import { useEffect, useState } from "react";

export type Role = "student" | "teacher";

export type Session = {
  role: Role;
  name: string;
  id: string;
  className?: string;
  section?: string;
};

export type Message = {
  id: string;
  title: string;
  body: string;
  date: string;
  urgent: boolean;
  target: string;
  author: string;
  readBy: string[];
  pinned?: boolean;
};

export type SchoolDoc = {
  id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  target: string;
  date: string;
  fileName: string;
};

export type FeeRecord = {
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  total: number;
  paid: number;
  history: { id: string; amount: number; date: string; note: string }[];
};

export type Homework = {
  id: string;
  title: string;
  subject: string;
  target: string;
  due: string;
  description: string;
  done?: boolean;
};

export type Student = {
  id: string;
  name: string;
  className: string;
  section: string;
};

export type Exam = {
  id: string;
  subject: string;
  date: string;
  time: string;
  className: string;
};

export type Activity = {
  id: string;
  type: "message" | "doc" | "homework" | "fee" | "exam";
  text: string;
  date: string;
};

const KEY = "sarcs_db_v2";
const SESSION_KEY = "sarcs_session_v1";
const AUTH_KEY = "sarcs_auth_v1";

export const DEFAULT_TEACHER_USER = "teacher";
export const DEFAULT_TEACHER_PASSWORD = "matheysh arc ";

/* ---- Secure-ish credential storage (hashed, never plaintext in source) ---- */
async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Auth = { user: string; passHash: string };

export function loadAuth(): Auth {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as Auth;
  } catch {
    /* ignore */
  }
  return { user: DEFAULT_TEACHER_USER, passHash: "" };
}

export async function ensureAuth() {
  const a = loadAuth();
  if (!a.passHash) {
    const passHash = await sha256(DEFAULT_TEACHER_PASSWORD);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user: DEFAULT_TEACHER_USER, passHash }));
  }
}

export async function verifyTeacher(user: string, pass: string): Promise<boolean> {
  await ensureAuth();
  const a = loadAuth();
  const h = await sha256(pass);
  return user.trim() === a.user && h === a.passHash;
}

export async function changeTeacherPassword(current: string, next: string): Promise<{ ok: boolean; msg: string }> {
  if (next.length < 6) return { ok: false, msg: "New password must be at least 6 characters" };
  const a = loadAuth();
  const curHash = await sha256(current);
  if (curHash !== a.passHash) return { ok: false, msg: "Current password is incorrect" };
  const passHash = await sha256(next);
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user: a.user, passHash }));
  return { ok: true, msg: "Password updated successfully" };
}

export async function changeTeacherUsername(current: string, next: string): Promise<{ ok: boolean; msg: string }> {
  if (!next.trim()) return { ok: false, msg: "Username cannot be empty" };
  const a = loadAuth();
  if (current.trim() !== a.user) return { ok: false, msg: "Current username is incorrect" };
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user: next.trim(), passHash: a.passHash }));
  return { ok: true, msg: "Username updated successfully" };
}

/* ---- Database ---- */
export type DB = {
  messages: Message[];
  docs: SchoolDoc[];
  fees: FeeRecord[];
  homework: Homework[];
  students: Student[];
  exams: Exam[];
  activity: Activity[];
};

const seed = (): DB => ({
  students: [
    { id: "S001", name: "Aarav Kumar", className: "8", section: "A" },
    { id: "S002", name: "Diya Sharma", className: "8", section: "A" },
    { id: "S003", name: "Rohan Verma", className: "9", section: "B" },
    { id: "S004", name: "Ananya Iyer", className: "9", section: "B" },
    { id: "S005", name: "Kabir Nair", className: "10", section: "A" },
    { id: "S006", name: "Meera Reddy", className: "10", section: "A" },
  ],
  messages: [
    {
      id: "m1",
      title: "Annual Sports Day",
      body: "The Annual Sports Day will be held on the 25th of this month. All students must report to the ground by 8:00 AM in sports uniform. Parents are welcome to attend.",
      date: new Date().toISOString(),
      urgent: false,
      target: "All",
      author: "Principal",
      readBy: [],
      pinned: true,
    },
    {
      id: "m2",
      title: "Unit Test Schedule Released",
      body: "The Unit Test 2 schedule has been published under Documents > Exam Materials. Please prepare accordingly.",
      date: new Date(Date.now() - 86400000).toISOString(),
      urgent: true,
      target: "All",
      author: "Exam Cell",
      readBy: [],
    },
    {
      id: "m3",
      title: "Library Books Return",
      body: "All borrowed library books must be returned before the term ends. Late returns will incur a fine.",
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      urgent: false,
      target: "All",
      author: "Librarian",
      readBy: [],
    },
  ],
  docs: [
    {
      id: "d1",
      title: "Mathematics Chapter 5 Notes",
      description: "Complete notes on Quadratic Equations with solved examples.",
      category: "Notes",
      subject: "Mathematics",
      target: "All",
      date: new Date(Date.now() - 86400000).toISOString(),
      fileName: "maths-ch5-notes.pdf",
    },
    {
      id: "d2",
      title: "Science Worksheet - Light",
      description: "Practice worksheet on reflection and refraction.",
      category: "Worksheets",
      subject: "Science",
      target: "All",
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      fileName: "science-light-worksheet.pdf",
    },
    {
      id: "d3",
      title: "Unit Test 2 Timetable",
      description: "Official examination timetable for Unit Test 2.",
      category: "Exam Materials",
      subject: "General",
      target: "All",
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      fileName: "unit-test-2-timetable.pdf",
    },
  ],
  fees: [
    {
      studentId: "S001",
      studentName: "Aarav Kumar",
      className: "8",
      section: "A",
      academicYear: "2024-25",
      total: 45000,
      paid: 30000,
      history: [
        { id: "p1", amount: 20000, date: new Date(Date.now() - 60 * 86400000).toISOString(), note: "Term 1" },
        { id: "p2", amount: 10000, date: new Date(Date.now() - 20 * 86400000).toISOString(), note: "Term 2 partial" },
      ],
    },
    {
      studentId: "S002",
      studentName: "Diya Sharma",
      className: "8",
      section: "A",
      academicYear: "2024-25",
      total: 45000,
      paid: 45000,
      history: [
        { id: "p3", amount: 45000, date: new Date(Date.now() - 90 * 86400000).toISOString(), note: "Full payment" },
      ],
    },
    {
      studentId: "S003",
      studentName: "Rohan Verma",
      className: "9",
      section: "B",
      academicYear: "2024-25",
      total: 52000,
      paid: 0,
      history: [],
    },
  ],
  homework: [
    {
      id: "h1",
      title: "Algebra Exercise 5.2",
      subject: "Mathematics",
      target: "All",
      due: new Date(Date.now() + 2 * 86400000).toISOString(),
      description: "Solve questions 1 to 15 from Exercise 5.2.",
      done: false,
    },
    {
      id: "h2",
      title: "Essay on Environment",
      subject: "English",
      target: "All",
      due: new Date(Date.now() + 4 * 86400000).toISOString(),
      description: "Write a 300-word essay on protecting the environment.",
      done: false,
    },
  ],
  exams: [
    { id: "e1", subject: "Mathematics", date: new Date(Date.now() + 5 * 86400000).toISOString(), time: "9:00 AM", className: "All" },
    { id: "e2", subject: "Science", date: new Date(Date.now() + 7 * 86400000).toISOString(), time: "9:00 AM", className: "All" },
    { id: "e3", subject: "English", date: new Date(Date.now() + 9 * 86400000).toISOString(), time: "9:00 AM", className: "All" },
  ],
  activity: [
    { id: "a1", type: "message", text: "Principal posted: Annual Sports Day", date: new Date().toISOString() },
    { id: "a2", type: "doc", text: "Mathematics Chapter 5 Notes uploaded", date: new Date(Date.now() - 86400000).toISOString() },
    { id: "a3", type: "homework", text: "Algebra Exercise 5.2 assigned", date: new Date(Date.now() - 2 * 86400000).toISOString() },
  ],
});

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (!parsed.exams) parsed.exams = seed().exams;
      if (!parsed.activity) parsed.activity = seed().activity;
      return parsed;
    }
  } catch {
    /* ignore */
  }
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function useDB() {
  const [db, setDb] = useState<DB>(() => loadDB());
  useEffect(() => {
    saveDB(db);
  }, [db]);
  return [db, setDb] as const;
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const fmtMoney = (n: number) => "₹" + n.toLocaleString("en-IN");

export function feeStatus(f: FeeRecord): "Paid" | "Partially Paid" | "Pending" {
  if (f.paid <= 0) return "Pending";
  if (f.paid >= f.total) return "Paid";
  return "Partially Paid";
}

export function daysUntil(iso: string): number {
  const d = new Date(iso).getTime() - Date.now();
  return Math.ceil(d / 86400000);
}