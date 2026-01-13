"use client";

// producertimeline.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CalendarDays,
  ChevronDown,
  Palette,

  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Layers,
  Link2,
  Menu,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Producer Timeline (Gantt) — Premium + Practical
 * Includes 1 → 11:
 * 1) Dropdown portal + collision (fixed in dropdown-menu.tsx)
 * 2) Mode switch (Detail/Compact) in one toolbar row
 * 3) Header layout: Title row, mini row, ONE toolbar row, then timeline (timeline takes most space)
 * 4) Sticky header + stable stacking
 * 5) Density pass (consistent pill buttons, spacing)
 * 6) Resizable splitter (drag to resize Task column)
 * 7) Zoom controls + Jump Today (horizontal)
 * 8) Hover sync (left row ↔ bar)
 * 9) Undo/Redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Ctrl+Y)
 * 10) Mini-map scrubber
 * 11) Dependency display modes (Off / Hover / Always)
 */

type Status = "Not Started" | "In Progress" | "Completed";
type Assignee = "Xiao Ming" | "Max" | "Reno" | "Aina";
type DepMode = "off" | "hover" | "always";
type ZoomPreset = "z400" | "z200" | "z100" | "z75" | "z50";



const ZOOM_ORDER: ZoomPreset[] = ["z400", "z200", "z100", "z75", "z50"];
// AFTER
const ZOOM_LABEL: Record<ZoomPreset, string> = {
  z400: "400%",
  z200: "200%",
  z100: "100%",
  z75: "75%",
  z50: "50%",
};

// ------------------- Pastel UI helpers -------------------
// Consistent subtle hairline borders everywhere (0.5px), except main title inputs (more prominent)
const PASTEL_BAR_COLORS: Array<{ name: string; hex: string }> = [
  { name: "Sky", hex: "#A7C7E7" },
  { name: "Mint", hex: "#B8F2E6" },
  { name: "Lavender", hex: "#D7BCE8" },
  { name: "Blush Pink", hex: "#FFD1DC" },
  { name: "Peach", hex: "#FFE5B4" },
  { name: "Butter", hex: "#FFF3B0" },
  { name: "Sage", hex: "#CDE7B0" },
  { name: "Periwinkle", hex: "#C3CDE6" },
  { name: "Coral", hex: "#FBC4AB" },
];
const OUTLINE_SUBTLE = "border-[0.5px] border-[var(--border)]";
const OUTLINE_PROMINENT = "border-[0.5px] border-[var(--border)]";

const BTN_SOFT = `${OUTLINE_SUBTLE} bg-[var(--panel)] text-[var(--text2)] shadow-sm hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-emerald-500/20`;


const BTN_SOFT_ICON = `${OUTLINE_SUBTLE} bg-[var(--panel)] text-[var(--text2)] shadow-sm hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-emerald-500/20`;


const INPUT_SOFT = `${OUTLINE_SUBTLE} bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted2)] hover:bg-[var(--hover)] focus-visible:ring-2 focus-visible:ring-emerald-500/20`;


const INPUT_TITLE = `${OUTLINE_PROMINENT} bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted2)] hover:bg-[var(--hover)] focus-visible:ring-2 focus-visible:ring-emerald-500/25`;


const SELECT_SOFT = `${OUTLINE_SUBTLE} bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)] focus-visible:ring-2 focus-visible:ring-emerald-500/20`;


// ------------------- Solid surfaces (fix “transparent” popups) -------------------
const POPUP_SURFACE =
  "bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] shadow-xl";

const DIALOG_SURFACE =
  "bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] shadow-2xl";

const BTN_TINT_INDIGO = `border-[0.5px] border-indigo-400/30 bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--hover)]`;
const BTN_TINT_EMERALD = `border-[0.5px] border-emerald-400/30 bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--hover)]`;
const BTN_TINT_SKY = `border-[0.5px] border-sky-400/30 bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--hover)]`;
const BTN_TINT_VIOLET = `border-[0.5px] border-violet-400/30 bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--hover)]`;
const BTN_TINT_ROSE = `border-[0.5px] border-rose-400/30 bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--hover)]`;

// Primary action button (matches the green outline Save button style)
const BTN_PRIMARY = `border-[0.5px] border-emerald-400/30 bg-emerald-500/15 text-[var(--text)] hover:bg-emerald-500/20 hover:border-emerald-400/40`;


// ------------------- Task Options modal theme-safe styles (works with White/Black theme) -------------------
// Uses the app's theme vars: --bg, --surface, --panel, --hover, --active, --border, --text, --text2, --muted, --muted2

// Outer modal: subtle grey border + WHITE outline ring (matches your Settings modal feel)
const MODAL_SHELL =
  "bg-[var(--bg)] text-[var(--text)] border-[0.5px] border-[var(--border)] ring-1 ring-white/85 dark:ring-white/20 shadow-2xl";

const MODAL_LEFT_BG = "bg-[var(--bg)]";
const MODAL_RIGHT_BG = "bg-[var(--bg)]";

// Inner panels / cards: subtle grey hairline (not thick)
const MODAL_BORDER = "border-[0.5px] border-[var(--border)]";

const MODAL_MUTED = "text-[var(--muted)]";
const MODAL_TEXT2 = "text-[var(--text2)]";

const MODAL_INPUT =
  "border-[0.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted2)] focus-visible:ring-2 focus-visible:ring-emerald-500/20";

const MODAL_SELECT =
  "border-[0.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:ring-2 focus-visible:ring-emerald-500/20";

const MODAL_BTN =
  "border-[0.5px] border-[var(--border)] bg-[var(--panel)] text-[var(--text2)] hover:bg-[var(--hover)] hover:text-[var(--text)]";

const MODAL_BTN_PRIMARY =
  "border-[0.5px] border-emerald-500/30 bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/18";

const MODAL_BTN_DANGER =
  "border-[0.5px] border-rose-500/30 bg-rose-500/12 text-rose-400 hover:bg-rose-500/18";


function isValidHexColor(v: string | null | undefined) {
  if (typeof v !== "string") return false;
  return /^#[0-9A-Fa-f]{6}$/.test(v.trim());
}

function normalizeHexColor(v: string | null | undefined) {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;

  const withHash = s.startsWith("#") ? s : `#${s}`;
  const upper = withHash.toUpperCase();

  return isValidHexColor(upper) ? upper : null;
}


function zoomInPreset(cur: ZoomPreset): ZoomPreset {
  const idx = ZOOM_ORDER.indexOf(cur);
  return ZOOM_ORDER[Math.max(0, idx - 1)] ?? cur;
}
function zoomOutPreset(cur: ZoomPreset): ZoomPreset {
  const idx = ZOOM_ORDER.indexOf(cur);
  return ZOOM_ORDER[Math.min(ZOOM_ORDER.length - 1, idx + 1)] ?? cur;
}

type Group = {
  id: string;
  name: string;
  collapsed?: boolean;
};

// AFTER
type Task = {
  id: string;
  groupId: string;
  name: string;
  quotedHours: number;
  actualHours: number;
  assignee: Assignee;
  status: Status;
  start: string; // YYYY-MM-DD
  due: string; // YYYY-MM-DD
  rowOrder?: number;

  // ✅ Always store as array (multi-deps)
  dependsOn?: string[] | null;

  // ✅ optional bar color override (hex)
  barColor?: string | null;
};

// ✅ NEW: Leave blocks (fixed, not editable)
type Leave = {
  id: string;
  assignee: Assignee;
  start: string; // YYYY-MM-DD
  due: string; // YYYY-MM-DD
  end?: string | null; // YYYY-MM-DD (legacy key)
  label?: string | null; // optional e.g. "Annual Leave"
  barColor?: string | null; // optional hex
};

type TimelineVersion = {
  id: string;
  label: string; // V1, V2, ...
  createdAt: number;
  groups: Group[];
  tasks: Task[];
};

type Snapshot = { groups: Group[]; tasks: Task[] };

const BAR_PAD = 0;

// Dependency geometry
const DOT_RADIUS = 6;

// ✅ Put the dependency dots OUTSIDE the bar:
// - negative inset means:
//   end dot center = barRight + 10px
//   start dot center = barLeft  - 10px
const DOT_CENTER_INSET = -10;

// Dot button sizing / offset (h-3 w-3 = 12px, radius 6)
// Center offset 10px outside + 6px half-size = 16px total
const DEP_DOT_SIZE = 12;
const DEP_DOT_OFFSET = 16;

const HOOK = 18;

// ✅ Arrow head (manual, so line never “goes into” the arrow)
const ARROW_LEN = 12;
const ARROW_HALF = 7;

// ✅ tiny gap before the target bar edge (keeps it readable)
const ARROW_GAP = 2;

const APP_TOPBAR_H = 64;
const RANGE_PAD_DAYS = 14;
const LOAD_CHUNK_DAYS = 30;
const EDGE_PX = 600;

const SPLIT_W = 8;

const ASSIGNEES: Assignee[] = ["Xiao Ming", "Max", "Reno", "Aina"];
const STATUSES: Status[] = ["Not Started", "In Progress", "Completed"];

// ------------------- Date helpers -------------------
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function formatShortDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}
function isWeekday(d: Date) {
  return !isWeekend(d);
}
function dayDiffInclusive(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate(), 12);
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 12);
  return Math.round((bb.getTime() - aa.getTime()) / ms) + 1;
}
function dayIndex(from: Date, target: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
  const tt = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 12);
  return Math.round((tt.getTime() - aa.getTime()) / ms);
}
function noonToday() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

// ------------------- Zoomed-out header helpers -------------------
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** ISO week number (W01..W53) */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // move to Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((d.getTime() - yearStart.getTime()) / 86400000) + 1;
  return Math.ceil(diffDays / 7);
}

function fmtMonDay(d: Date) {
  const m = MONTHS_SHORT[d.getMonth()];
  return `${m} ${pad2(d.getDate())}`; // e.g. "Aug 04"
}

// Business-day helpers (exclude Sat/Sun)
function businessDaysDiff(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 12);
  if (toISODate(a) === toISODate(b)) return 0;

  const step = a < b ? 1 : -1;
  let cur = addDays(a, step);
  let count = 0;
  while (step === 1 ? cur <= b : cur >= b) {
    if (isWeekday(cur)) count += 1;
    cur = addDays(cur, step);
  }
  return step === 1 ? count : -count;
}
function businessDaysDurationInclusive(start: Date, due: Date) {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
  const b = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 12);
  if (b < a) return 0;
  let cur = new Date(a);
  let count = 0;
  while (cur <= b) {
    if (isWeekday(cur)) count += 1;
    cur = addDays(cur, 1);
  }
  return Math.max(1, count);
}
function nextBusinessDay(d: Date) {
  let cur = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  while (isWeekend(cur)) cur = addDays(cur, 1);
  return cur;
}
function addBusinessDaysFrom(start: Date, businessDaysToAdd: number) {
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
  let n = Math.max(0, Math.floor(businessDaysToAdd));
  while (n > 0) {
    cur = addDays(cur, 1);
    if (isWeekday(cur)) n -= 1;
  }
  return cur;
}

function idsInInclusiveRange(order: string[], a: string, b: string): string[] {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);

  // If either is missing, fall back to single selection behavior
  if (ia === -1 || ib === -1) {
    if (a && a === b) return [a];
    if (b) return [b];
    if (a) return [a];
    return [];
  }

  const start = Math.min(ia, ib);
  const end = Math.max(ia, ib);
  return order.slice(start, end + 1);
}

function depsToArray(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string" && x.trim().length > 0);
  if (typeof raw === "string" && raw.trim().length > 0) return [raw];
  return [];
}

function enforceFinishToStartDependencies(all: Task[]) {
  let next = all.map((t) => ({ ...t }));

  const maxPasses = Math.max(4, all.length * 2);
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    const curById = new Map(next.map((t) => [t.id, t] as const));

    next = next.map((t) => {
      const deps = depsToArray(t.dependsOn);
      if (!deps.length) return t;

      // compute the earliest allowed start based on ALL dependencies
      let requiredStart: Date | null = null;
      for (const fromId of deps) {
        const from = curById.get(fromId);
        if (!from) continue;
        const fromDue = toDate(from.due);
        const r = nextBusinessDay(fromDue);
        if (!requiredStart || r > requiredStart) requiredStart = r;
      }
      if (!requiredStart) return t;

      const curStart = toDate(t.start);
      if (curStart >= requiredStart) return t;

      const curDue = toDate(t.due);
      const dur = businessDaysDurationInclusive(curStart, curDue) || 1;
      const newStart = requiredStart;
      const newDue = addBusinessDaysFrom(newStart, dur - 1);

      changed = true;
      return { ...t, start: toISODate(newStart), due: toISODate(newDue) };
    });

    if (!changed) break;
  }

  return next;
}


function computeTaskMinMax(ts: Task[]) {
  if (!ts.length) {
    const a = noonToday();
    return { minStart: a, maxDue: addDays(a, 60) };
  }
  const starts = ts.map((t) => toDate(t.start));
  const dues = ts.map((t) => toDate(t.due));
  const minStart = starts.reduce((a, b) => (a < b ? a : b), starts[0]);
  const maxDue = dues.reduce((a, b) => (a > b ? a : b), dues[0]);
  return { minStart, maxDue };
}

function normalizeRowOrder(groups: Group[], ts: Task[]) {
  const byGroup = new Map<string, Task[]>();
  for (const t of ts) {
    const arr = byGroup.get(t.groupId) ?? [];
    arr.push(t);
    byGroup.set(t.groupId, arr);
  }

  const next = ts.map((t) => ({ ...t }));
  const nextById = new Map(next.map((t) => [t.id, t] as const));

  for (const g of groups) {
    const list = byGroup.get(g.id) ?? [];
    if (!list.length) continue;

    const missing = list.some((t) => typeof t.rowOrder !== "number");
    if (!missing) continue;

    const sorted = list
      .slice()
      .sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime());

    sorted.forEach((t, i) => {
      const cur = nextById.get(t.id);
      if (!cur) return;
      cur.rowOrder = i + 1;
    });
  }

  return next;
}

// ------------------- Seed data -------------------
const seedGroups: Group[] = [{ id: "g1", name: "Group 1", collapsed: false }];

// AFTER
const seedTasks: Task[] = [
  { id: "t1", groupId: "g1", name: "Sketches", quotedHours: 24, actualHours: 0, assignee: "Xiao Ming", status: "In Progress", start: "2025-11-30", due: "2025-12-03", dependsOn: null },
  { id: "t2", groupId: "g1", name: "Storyboard", quotedHours: 80, actualHours: 0, assignee: "Xiao Ming", status: "In Progress", start: "2025-12-04", due: "2025-12-15", dependsOn: ["t1"] },
  { id: "t3", groupId: "g1", name: "Styleframe", quotedHours: 80, actualHours: 0, assignee: "Xiao Ming", status: "Not Started", start: "2025-12-12", due: "2025-12-22", dependsOn: ["t2"] },
  { id: "t4", groupId: "g1", name: "Asset Build", quotedHours: 90, actualHours: 0, assignee: "Reno", status: "Not Started", start: "2025-12-16", due: "2025-12-26", dependsOn: ["t3"] },
  { id: "t5", groupId: "g1", name: "BGM Options", quotedHours: 12, actualHours: 0, assignee: "Max", status: "Not Started", start: "2025-12-20", due: "2025-12-23", dependsOn: ["t4"] },
  { id: "t6", groupId: "g1", name: "Sound Design", quotedHours: 30, actualHours: 0, assignee: "Max", status: "Not Started", start: "2025-12-26", due: "2026-01-03", dependsOn: ["t5"] },
  { id: "t7", groupId: "g1", name: "Sound Mastering", quotedHours: 18, actualHours: 0, assignee: "Max", status: "Not Started", start: "2026-01-02", due: "2026-01-06", dependsOn: ["t6"] },
  { id: "t8", groupId: "g1", name: "Cut 1", quotedHours: 70, actualHours: 0, assignee: "Aina", status: "Not Started", start: "2025-12-11", due: "2025-12-25", dependsOn: ["t4"] },
  { id: "t9", groupId: "g1", name: "Cut 2", quotedHours: 50, actualHours: 0, assignee: "Aina", status: "Not Started", start: "2025-12-26", due: "2026-01-05", dependsOn: ["t8"] },
  { id: "t10", groupId: "g1", name: "Final Cut", quotedHours: 20, actualHours: 0, assignee: "Aina", status: "Not Started", start: "2026-01-05", due: "2026-01-10", dependsOn: ["t9"] },
];

// ✅ NEW: Leaves settings
const LEAVES_VISIBLE_LIMIT = 2;

// ✅ NEW: Fixed (not editable) leaves data
const seedLeaves: Leave[] = [
  { id: "l1", assignee: "Aina", start: "2025-12-09", due: "2025-12-11", label: "Annual Leave", barColor: "#FFD1DC" },
  { id: "l2", assignee: "Max", start: "2025-12-18", due: "2025-12-19", label: "OOO", barColor: "#B8F2E6" },
  { id: "l3", assignee: "Reno", start: "2025-12-23", due: "2025-12-24", label: "Medical", barColor: "#A7C7E7" },
  { id: "l4", assignee: "Xiao Ming", start: "2025-12-30", due: "2026-01-02", label: "Annual Leave", barColor: "#D7BCE8" },
];


const TEMPLATE_TASKS: Omit<Task, "id" | "groupId" | "start" | "due">[] = [
  { name: "Sketches", quotedHours: 24, actualHours: 0, assignee: "Xiao Ming", status: "Not Started" },
  { name: "Storyboard", quotedHours: 80, actualHours: 0, assignee: "Xiao Ming", status: "Not Started" },
  { name: "Styleframe", quotedHours: 80, actualHours: 0, assignee: "Xiao Ming", status: "Not Started" },
  { name: "Asset Build", quotedHours: 90, actualHours: 0, assignee: "Reno", status: "Not Started" },
  { name: "BGM Options", quotedHours: 12, actualHours: 0, assignee: "Max", status: "Not Started" },
  { name: "Sound Design", quotedHours: 30, actualHours: 0, assignee: "Max", status: "Not Started" },
  { name: "Sound Mastering", quotedHours: 18, actualHours: 0, assignee: "Max", status: "Not Started" },
  { name: "Cut 1", quotedHours: 70, actualHours: 0, assignee: "Aina", status: "Not Started" },
  { name: "Cut 2", quotedHours: 50, actualHours: 0, assignee: "Aina", status: "Not Started" },
  { name: "Final Cut", quotedHours: 20, actualHours: 0, assignee: "Aina", status: "Not Started" },
];

// ------------------- Storage -------------------
const STORAGE_KEY = "producer_timeline_gantt_draft_v5";
const VERSIONS_KEY = "producer_timeline_gantt_versions_v5";

// AFTER
function normalizeDependsOnArray(ts: any[]): Task[] {
  return ts.map((t) => {
    const deps = depsToArray(t?.dependsOn);
    return { ...t, dependsOn: deps.length ? deps : null } as Task;
  });
}

function safeLoadDraft(): { groups: Group[]; tasks: Task[] } {
  if (typeof window === "undefined") return { groups: seedGroups, tasks: seedTasks };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { groups: seedGroups, tasks: seedTasks };
    const parsed = JSON.parse(raw);
    const groups = Array.isArray(parsed?.groups) ? (parsed.groups as Group[]) : seedGroups;

    const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : seedTasks;
    const tasks = normalizeDependsOnArray(rawTasks);

    return { groups, tasks };
  } catch {
    return { groups: seedGroups, tasks: seedTasks };
  }
}

// AFTER
function safeLoadVersions(): TimelineVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v: any) => ({
        id: String(v.id ?? ""),
        label: String(v.label ?? ""),
        createdAt: Number(v.createdAt ?? 0),
        groups: Array.isArray(v.groups) ? (v.groups as Group[]) : [],
        tasks: Array.isArray(v.tasks) ? normalizeDependsOnArray(v.tasks) : [],
      }))
      .filter((v: TimelineVersion) => Boolean(v.id) && Boolean(v.label) && Boolean(v.createdAt));
  } catch {
    return [];
  }
}
function saveVersionsToStorage(list: TimelineVersion[]) {
  try {
    window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(list));
  } catch {}
}
function nextVersionLabel(list: TimelineVersion[]) {
  let max = 0;
  for (const v of list) {
    const m = /^V([0-9]+)$/.exec(String(v.label || "").trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `V${max + 1}`;
}
function formatVersionTimestamp(ms: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

// ------------------- Small UI pieces -------------------
function HoursCell({
  value,
  onChange,
  inputClassName,
}: {
  value: number;
  onChange: (v: number) => void;
  inputClassName?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 min-w-0">
      <Input
        value={Number.isFinite(value) ? String(value) : "0"}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className={cn(
  "w-[64px] text-right tabular-nums",
  inputClassName ?? "h-7 px-2 text-[13px] rounded-lg",
  INPUT_SOFT
)}

        inputMode="numeric"
      />
      <span className="text-xs text-[var(--muted)]">h</span>
    </div>
  );
}


function TodayLine({
  x,
  height,
  top = 0,
  zIndex = 120,
}: {
  x: number;
  height: number | string;
  top?: number | string;
  zIndex?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top,
        left: x - 1,
        width: 2,
        height,
        background: "#EF4444",
        zIndex,
      }}
      aria-hidden
    />
  );
}

function TimelineHeader({
  days,
  cellW,
  showMonths = true,
  todayIdx,
  zoomPreset,
}: {
  days: Date[];
  cellW: number;
  showMonths?: boolean;
  todayIdx?: number;
  zoomPreset: ZoomPreset;
}) {
  const monthGroups = useMemo(() => {
    if (!days.length) return [];
    const groups: { label: string; count: number }[] = [];
    let curLabel = "";
    let curCount = 0;

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const label = d.toLocaleString("en-US", { month: "long", year: "numeric" }); // ✅ Month + Year always
      if (label !== curLabel) {
        if (curCount) groups.push({ label: curLabel, count: curCount });
        curLabel = label;
        curCount = 1;
      } else {
        curCount++;
      }
    }
    if (curCount) groups.push({ label: curLabel, count: curCount });
    return groups;
  }, [days]);

  const showToday = typeof todayIdx === "number" && todayIdx >= 0 && todayIdx < days.length;
  const todayX = showToday ? todayIdx * cellW + cellW / 2 : 0;

  const showWeekday = (zoomPreset === "z400" || zoomPreset === "z200") && cellW >= 14;
  const isZoomedOut = zoomPreset === "z75" || zoomPreset === "z50";
  const isMonday = (d: Date) => d.getDay() === 1;

  const formatWeekStart = (d: Date) => {
    const m = d.toLocaleString("en-US", { month: "short" });
    return `${m} ${pad2(d.getDate())}`;
  };

  const weekBlocks = useMemo(() => {
    if (!days.length) return [] as Array<{ startIdx: number; count: number; label: string }>;
    const out: Array<{ startIdx: number; count: number; label: string }> = [];

    let i = 0;
    while (i < days.length) {
      const startIdx = i;

      let count = 1;
      for (let j = 1; j < 7 && i + j < days.length; j++) {
        const nd = days[i + j];
        if (isMonday(nd)) break;
        count++;
      }

      out.push({ startIdx, count, label: formatWeekStart(days[startIdx]) });
      i += count;
    }

    return out;
  }, [days]);

  return (
    <div className="bg-[var(--surface)]">
      {showMonths && (
        <div className="flex h-9 border-b border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] text-[12px] font-semibold">
          {monthGroups.map((g, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center border-r border-r-[0.5px] border-[var(--border)]"
              style={{ width: g.count * cellW }}
            >
              {g.label}
            </div>
          ))}
        </div>
      )}

      <div className="relative flex h-10 border-b border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] text-[12px] overflow-hidden">
        {showToday && <TodayLine x={todayX} height="100%" zIndex={120} />}

        {isZoomedOut ? (
          <>
            {weekBlocks.map((b, idx) => {
              const w = b.count * cellW;
              const alt = idx % 2 === 0;

              return (
                <div
                  key={`wk-${b.startIdx}-${idx}`}
                  className={cn(
                    "flex h-10 items-center justify-start px-3 border-r border-r-[0.5px] border-[var(--border)] text-[12px] font-semibold",
                    alt ? "bg-[var(--surface)]" : "bg-[var(--bg)]"
                  )}
                  style={{ width: w }}
                  title={b.label}
                >
                  <div className="truncate">{b.label}</div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {days.map((d, idx) => {
              const isT = showToday && idx === todayIdx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex h-10 flex-col items-center justify-center border-r border-r-[0.5px] border-[var(--border)]",
                    isWeekend(d) ? "bg-[var(--panel)]" : "bg-[var(--bg)]",
                    isT && !isWeekend(d) && "bg-red-50/40"
                  )}
                  style={{ width: cellW }}
                >
                  {showWeekday ? (
                    <div className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                      {d.toLocaleString("en-US", { weekday: "short" })}
                      {isT && <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </div>
                  ) : (
                    <div className="h-[11px]" />
                  )}
                  <div className={cn("text-[12px] font-semibold", isT && "text-red-600")}>
                    {pad2(d.getDate())}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function TimelineGrid({
  days,
  cellW,
  rowH,
  idPrefix,
  todayIdx,
  zoomPreset = "z100",
}: {
  days: Date[];
  cellW: number;
  rowH: number;
  idPrefix: string;
  todayIdx?: number;
  zoomPreset?: ZoomPreset;
}) {
  const showToday = typeof todayIdx === "number" && todayIdx >= 0 && todayIdx < days.length;
  const isZoomedOut = zoomPreset === "z75" || zoomPreset === "z50";
  const isMonday = (d: Date) => d.getDay() === 1;

  let weekIdx = -1;

  return (
    <div className="absolute inset-0 flex pointer-events-none" aria-hidden>
      {days.map((d, i) => {
        const wknd = isWeekend(d);
        const isT = showToday && i === todayIdx;

        // ✅ Only weekend gets special tint
        const baseBg = wknd ? "bg-[var(--panel)]" : "bg-[var(--bg)]";

        if (isZoomedOut) {
          if (i === 0 || isMonday(d)) weekIdx++;

          const nextIsNewWeek =
            i === days.length - 1 || (days[i + 1] ? isMonday(days[i + 1]) : true);

          return (
            <div
              key={`${idPrefix}-${i}`}
              className={cn(
                "h-full",
                // ✅ Only show week boundary line in zoomed-out mode
                nextIsNewWeek
                  ? "border-r border-r-[0.5px] border-[var(--border)]"
                  : "border-r border-transparent",
                baseBg,
                isT && !wknd && "bg-red-50/40"
              )}
              style={{ width: cellW, height: rowH }}
            />
          );
        }

        return (
          <div
            key={`${idPrefix}-${i}`}
            className={cn(
              "h-full border-r border-r-[0.5px] border-[var(--border)]",
              baseBg,
              isT && !wknd && "bg-red-50/40"
            )}
            style={{ width: cellW, height: rowH }}
          />
        );
      })}
    </div>
  );
}

// ------------------- Leave lane packing -------------------
// Goal: if leaves don't overlap in dates, they should share the SAME row (lane).
// Only when they overlap (same day / intersecting range) do we stack into multiple lanes.
type PackedLeave = {
  lv: Leave;
  startIdx: number;
  endIdx: number;
  lane: number;
};

function packLeavesIntoLanes(
  leaves: Leave[],
  rangeStart: Date,
  daysLen: number
): { packed: PackedLeave[]; laneCount: number } {
  const lastIdx = Math.max(0, daysLen - 1);

  const spans = leaves
    .map((lv) => {
      const s = toDate(lv.start);
      const e = toDate(lv.end ?? lv.due);

      const startIdx = clamp(dayIndex(rangeStart, s), 0, lastIdx);
      const endIdx = clamp(dayIndex(rangeStart, e), 0, lastIdx);

      const a = Math.min(startIdx, endIdx);
      const b = Math.max(startIdx, endIdx);

      return { lv, startIdx: a, endIdx: b };
    })
    .sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx);

  const laneEnds: number[] = [];
  const packed: PackedLeave[] = [];

  for (const it of spans) {
    // Non-overlap rule (inclusive ranges):
    // Can share a lane only if this starts AFTER the lane's last end.
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (it.startIdx > laneEnds[i]) {
        lane = i;
        break;
      }
    }

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.endIdx);
    } else {
      laneEnds[lane] = Math.max(laneEnds[lane], it.endIdx);
    }

    packed.push({ ...it, lane });
  }

  return { packed, laneCount: Math.max(1, laneEnds.length) };
}

function LeavesSectionRow({
  leaves,
  expanded,
  onToggleExpanded,
  visibleLimit,
  colsCollapsed,
  hideDetails,
  leftGridTemplate,
  leftW,
  splitW,
  timelineW,
  rangeStart,
  days,
  cellW,
  todayIdx,
  zoomPreset,
  taskRowH,
  sectionH,
}: {
  leaves: Leave[];
  expanded: boolean;
  onToggleExpanded: () => void;
  visibleLimit: number;

  colsCollapsed: boolean;
  hideDetails: boolean;
  leftGridTemplate: string;

  leftW: number;
  splitW: number;
  timelineW: number;

  rangeStart: Date;
  days: Date[];
  cellW: number;
  todayIdx?: number;
  zoomPreset: ZoomPreset;

  taskRowH: number;     // slot height per leave bar
  sectionH: number;     // total height (pushes rows)
}) {
  const count = leaves.length;
  const showToggle = count > visibleLimit;

  const visible = expanded ? leaves : leaves.slice(0, visibleLimit);
  const { packed: packedLeaves } = packLeavesIntoLanes(visible, rangeStart, days.length);

  const labelCount = `${count} leave${count === 1 ? "" : "s"}`;

  const barH = Math.max(18, Math.min(22, taskRowH - 10));
  const ICON_BTN = hideDetails ? "h-6 w-6" : "h-7 w-7";

  // ✅ Make Leaves header align like a normal task row (fix vertical alignment)
  const HEADER_H = taskRowH;

  // ✅ Match the "10 tasks" typography (fix font size mismatch)
  const COUNT_TEXT = "text-sm text-[var(--text2)]";

  const ToggleButton = showToggle ? (
    <button
      type="button"
      className={cn(
        ICON_BTN,
        "rounded-lg p-0 inline-flex items-center justify-center",
        BTN_SOFT_ICON
      )}
      onClick={onToggleExpanded}
      title={expanded ? "Collapse leaves" : "Expand leaves"}
    >
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-[var(--text2)]" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[var(--text2)]" />
      )}
    </button>
  ) : null;

  // helper for blank cells so the left area is NEVER transparent
  const BlankCell = () => (
    <div className="flex flex-col h-full">
      <div style={{ height: HEADER_H }} />
      <div className="flex-1" />
    </div>
  );

  return (
    <div
      className={cn("grid border-t border-[var(--border)]")}
      style={{ gridTemplateColumns: `${leftW}px ${splitW}px ${timelineW}px`, height: sectionH }}
    >
      {/* LEFT (table area) */}
      <div
        className={cn(
          "sticky left-0 z-[120] border-r border-[var(--border)] bg-[var(--panel)] relative overflow-hidden"
        )}
        style={{ height: sectionH }}
      >
        {/* ✅ Hard solid paint layer (prevents grid from showing through) */}
        <div className="absolute inset-0 bg-[var(--panel)]" />

        <div
          className={cn("relative z-10 grid h-full")}
          style={{ gridTemplateColumns: leftGridTemplate }}
        >
          {/* NO col (calendar icon) */}
          <div className="flex flex-col h-full">
            <div
              className="flex items-center justify-center"
              style={{ height: HEADER_H }}
            >
              <div
                className={cn(
                  ICON_BTN,
                  "rounded-lg p-0 inline-flex items-center justify-center",
                  BTN_SOFT_ICON
                )}
              >
                <CalendarDays className="h-4 w-4 text-[var(--text2)]" />
              </div>
            </div>
            <div className="flex-1" />
          </div>

          {/* TASK col (Leaves title) */}
          <div className="flex flex-col h-full">
            <div
              className="flex items-center gap-3"
              style={{ height: HEADER_H }}
            >
              <div className="font-semibold text-[13px] leading-none">Leaves</div>

              {/* If columns are collapsed, we must show count + toggle here */}
              {colsCollapsed && (
                <div className="ml-auto flex items-center gap-3 pr-2">
                  <div className={COUNT_TEXT}>{labelCount}</div>
                  {ToggleButton}
                </div>
              )}
            </div>
            <div className="flex-1" />
          </div>

          {/* Remaining columns (use them to place "4 leaves" like "10 tasks") */}
          {!colsCollapsed && hideDetails && (
            <>
              {/* Assignee */}
              <BlankCell />

              {/* Days left (place count here, right-aligned like Group's count area) */}
              <div className="flex flex-col h-full">
                <div
                  className="flex items-center justify-end pr-3"
                  style={{ height: HEADER_H }}
                >
                  <div className={COUNT_TEXT}>{labelCount}</div>
                </div>
                <div className="flex-1" />
              </div>

              {/* Actions (toggle aligned to trash column) */}
              <div className="flex flex-col h-full">
                <div
                  className="flex items-center justify-center"
                  style={{ height: HEADER_H }}
                >
                  {ToggleButton}
                </div>
                <div className="flex-1" />
              </div>
            </>
          )}

          {!colsCollapsed && !hideDetails && (
            <>
              {/* Quoted */}
              <BlankCell />
              {/* Actual */}
              <BlankCell />
              {/* Assignee */}
              <BlankCell />
              {/* Days left */}
              <BlankCell />

              {/* Status (place count here so it sits beside the Actions column like your reference) */}
              <div className="flex flex-col h-full">
                <div
                  className="flex items-center justify-end pr-3"
                  style={{ height: HEADER_H }}
                >
                  <div className={COUNT_TEXT}>{labelCount}</div>
                </div>
                <div className="flex-1" />
              </div>

              {/* Actions (toggle aligned to trash column) */}
              <div className="flex flex-col h-full">
                <div
                  className="flex items-center justify-center"
                  style={{ height: HEADER_H }}
                >
                  {ToggleButton}
                </div>
                <div className="flex-1" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* SPLITTER column */}
      <div
        className={cn("sticky z-[110] bg-[var(--bg)] border-r border-[var(--border)]")}
        style={{ left: leftW, width: splitW, height: sectionH }}
      />

      {/* RIGHT (timeline area) */}
      <div className="relative bg-[var(--surface)]" style={{ height: sectionH }}>
        {/* Leaves row: keep a clean solid background (no grid lines),
            while still tinting weekends + showing the today line. */}
        <div className="absolute inset-0 flex pointer-events-none" aria-hidden>
          {days.map((d, i) => {
            const wknd = isWeekend(d);
            const isToday = todayIdx === i;
            return (
              <div
                key={i}
                className={cn(
                  "relative h-full",
                  wknd ? "bg-[var(--weekend)]" : "bg-[var(--surface)]"
                )}
                style={{ width: cellW, height: sectionH }}
              >
                {isToday && (
                  <div className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-red-500/80" />
                )}
              </div>
            );
          })}
        </div>

        {/* bars stacked inside the Leaves area */}
        {packedLeaves.map((p) => {
          const lv = p.lv;

          const start = toDate(lv.start);
          const end = toDate(lv.end ?? lv.due);

          const startIdx = p.startIdx;
          const endIdx = p.endIdx;
          const span = Math.max(1, endIdx - startIdx + 1);

          const left = startIdx * cellW + BAR_PAD;
          const width = Math.max(1, span * cellW - BAR_PAD * 2);

          const normalized = normalizeHexColor(lv.barColor ?? null);
          const inlineStyle: React.CSSProperties = normalized ? { backgroundColor: normalized } : {};

          const slotTop = p.lane * taskRowH;
          const barTop = slotTop + (taskRowH - barH) / 2;

          return (
            <div
              key={lv.id}
              className="absolute"
              style={{ top: barTop, left, width, height: barH }}
              title={`${lv.assignee}${lv.label ? ` · ${lv.label}` : ""}: ${formatShortDate(start)} → ${formatShortDate(end)}`}
            >
              <div
                className={cn(
                  "h-full w-full rounded-md border shadow-sm px-2 flex items-center",
                  "text-xs font-medium text-[var(--text)]/80",
                  normalized ? "border-[var(--border)]" : "bg-[var(--panel)] border-[var(--border)]"
                )}
                style={inlineStyle}
              >
                <div className="truncate">
                  {lv.assignee}
                  {lv.label ? ` · ${lv.label}` : ""}
                </div>
              </div>
            </div>
          );
        })}

        {count === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted)]">
            0 leaves
          </div>
        )}
      </div>
    </div>
  );
}





function TaskBar({
  task,
  rangeStart,
  days,
  cellW,
  todayIdx,
  zoomPreset = "z100",
  highlight,
  rowHighlight,
  isSource,
  isTarget,
  onBeginEdit,
  onBeginMove,
  onBeginResize,
  rowH: rowHProp,
  showDepDots = true,
  onOpenColor,
  onCancelDrag,
}: {
  task: Task;
  rangeStart: Date;
  days: Date[];
  cellW: number;
  todayIdx?: number;
  zoomPreset?: ZoomPreset;
  highlight?: boolean;
  rowHighlight?: boolean;
  isSource?: boolean;
  isTarget?: boolean;
  onBeginEdit?: (taskId: string, e: React.PointerEvent) => void;
  onBeginMove?: (taskId: string, e: React.PointerEvent) => void;
  onBeginResize?: (taskId: string, edge: "start" | "due", e: React.PointerEvent) => void;
  showDepDots?: boolean;
  rowH?: number;

  onOpenColor?: (taskId: string) => void;
  onCancelDrag?: () => void;
}) {
const rowH = rowHProp ?? 28;

  const start = toDate(task.start);
  const due = toDate(task.due);

  const statusStyle =
    task.status === "Completed"
      ? "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)]"
      : task.status === "In Progress"
      ? "bg-amber-500/15 border-amber-400/30 text-[var(--text)]"
      : "bg-[var(--panel)] border-[var(--border)] text-[var(--text)]";

  // ✅ Only apply valid hex colors
  const normalizedBarColor = normalizeHexColor(task.barColor ?? null);
  const barInlineStyle: React.CSSProperties = normalizedBarColor
    ? { backgroundColor: normalizedBarColor }
    : {};

  const startIdx = clamp(dayIndex(rangeStart, start), 0, days.length - 1);
  const dueIdx = clamp(dayIndex(rangeStart, due), 0, days.length - 1);
  const span = Math.max(1, dueIdx - startIdx + 1);

  const left = startIdx * cellW;
  const width = span * cellW;

  // ✅ Fill day boundaries exactly (no forced min width)
  const barLeft = left + BAR_PAD; // BAR_PAD is now 0
  const barW = Math.max(1, width - BAR_PAD * 2);

  return (
    <div className="relative" style={{ height: rowH }}>
      <TimelineGrid
        days={days}
        cellW={cellW}
        rowH={rowH}
        idPrefix={`t-${task.id}`}
        todayIdx={todayIdx}
        zoomPreset={zoomPreset}
      />

      {/* ✅ Row hover wash */}
      {rowHighlight && (
        <div className={cn("absolute inset-0 pointer-events-none", ROW_HOVER_OVERLAY)} />
      )}

      {(() => {
        // ✅ Expand hover area to include: [LEFT dot] + gap + bar
        const hoverLeft = barLeft - DEP_DOT_OFFSET;
        const hoverW = barW + DEP_DOT_OFFSET; // ✅ removed right side padding
        const barHClass = rowH <= 44 ? "h-5" : "h-6";

        return (
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: hoverLeft, width: hoverW }}
          >
            <div className={cn("group relative", barHClass)} data-task-row={task.id}>
  <motion.div
    data-task-bar={task.id}
    layout
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "relative rounded-md border shadow-sm h-full",
      "cursor-grab active:cursor-grabbing",
      statusStyle,
      highlight && "ring-2 ring-foreground/30",
      isSource && "ring-2 ring-foreground/50",
      isTarget && "ring-2 ring-foreground/60"
    )}
    style={{ width: barW, marginLeft: DEP_DOT_OFFSET, ...barInlineStyle }}
    title={`${task.name}: ${formatShortDate(start)} → ${formatShortDate(due)} (drag to move)`}
    onDoubleClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onCancelDrag?.();
      onOpenColor?.(task.id);
    }}
    onPointerDown={(e) => {
      if ((e as any).detail && (e as any).detail > 1) return;
      if (!onBeginMove) return;

      // ✅ Shift/Cmd/Ctrl = selection only (no dragging)
      if (e.shiftKey || e.metaKey || e.ctrlKey) return;

      const el = e.target as HTMLElement | null;
      if (el?.closest?.("[data-dep-role]") || el?.closest?.("[data-resize-handle]")) return;

      e.preventDefault();
      e.stopPropagation();
      onBeginMove(task.id, e);
    }}
  >

                {/* ✅ Resize handles stay on the bar edges */}
                {onBeginResize && (
                  <>
                    <button
                      type="button"
                      data-resize-handle
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-3 rounded-full border bg-[var(--bg)]/70 shadow-sm",
                        barHClass,
                        "opacity-0 group-hover:opacity-100",
                        "cursor-ew-resize"
                      )}
                      style={{ left: 0, zIndex: 30 }}
                      title="Drag to change start date"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBeginResize(task.id, "start", e);
                      }}
                    />
                    <button
                      type="button"
                      data-resize-handle
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-3 rounded-full border bg-[var(--bg)]/70 shadow-sm",
                        barHClass,
                        "opacity-0 group-hover:opacity-100",
                        "cursor-ew-resize"
                      )}
                      style={{ right: 0, zIndex: 30 }}
                      title="Drag to change due date"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBeginResize(task.id, "due", e);
                      }}
                    />
                  </>
                )}
              </motion.div>

              {/* ✅ ONE dependency dot (LEFT) */}
              {showDepDots && (
                <button
                  type="button"
                  data-dep-role="start"
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border shadow-sm",
                    "opacity-0 group-hover:opacity-100",
                    highlight && "ring-2 ring-foreground/40",
                    "cursor-crosshair",
                    depsToArray((task as any).dependsOn).length ? "bg-violet-50 border-violet-200" : "bg-[var(--bg)] border-[var(--border)]"
                  )}
                  style={{ left: 0, zIndex: 40 }}
                  title={depsToArray((task as any).dependsOn).length ? "Drag to change/remove dependency" : "Drag to set dependency"}
                  onPointerDown={(e) => {
                    if (!onBeginEdit) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onBeginEdit(task.id, e);
                  }}
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* ✅ Move label closer again (right dot removed) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text)]/80 pointer-events-none select-none"
        style={{
          left: barLeft + barW + 8,
          maxWidth: 240,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {task.name}
      </div>
    </div>
  );
}




// AFTER (fix: make the group bar span the full range + solid/opaque so grid doesn't show through)
function GroupSpanBar({
  group,
  rangeStart,
  days,
  cellW,
  groupRange,
  todayIdx,
  zoomPreset = "z100",
  onBeginMoveGroup,
  rowH: rowHProp,
}: {
  group: Group;
  rangeStart: Date;
  days: Date[];
  cellW: number;
  groupRange: { start: Date; due: Date } | null;
  todayIdx?: number;
  zoomPreset?: ZoomPreset;
  onBeginMoveGroup?: (groupId: string, e: React.PointerEvent) => void;
  rowH?: number;
}) {
  const rowH = rowHProp ?? 44;

  let barLeft = 0;
  let barW = 0;

  if (groupRange) {
    const startIdx = clamp(dayIndex(rangeStart, groupRange.start), 0, days.length - 1);
    const dueIdx = clamp(dayIndex(rangeStart, groupRange.due), 0, days.length - 1);
    const span = Math.max(1, dueIdx - startIdx + 1);
    barLeft = startIdx * cellW;
    barW = span * cellW;
  }

  const barHClass = rowH <= 40 ? "h-5" : "h-6";

  return (
    <div className="relative" style={{ height: rowH }}>
      <TimelineGrid
        days={days}
        cellW={cellW}
        rowH={rowH}
        idPrefix={`g-${group.id}`}
        todayIdx={todayIdx}
        zoomPreset={zoomPreset}
      />

      {groupRange && (
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: barLeft, width: barW }}
        >
          <motion.div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative w-full overflow-hidden rounded-md shadow-sm",
              barHClass,
              "bg-[var(--bg)]",
              OUTLINE_SUBTLE,
              onBeginMoveGroup && "cursor-grab active:cursor-grabbing"
            )}
            title={`${group.name}: ${formatShortDate(groupRange.start)} → ${formatShortDate(groupRange.due)}${
              onBeginMoveGroup ? " (drag group to move)" : ""
            }`}
            onPointerDown={(e) => {
              if (!onBeginMoveGroup) return;
              e.preventDefault();
              e.stopPropagation();

              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch {}

              onBeginMoveGroup(group.id, e);
            }}
          >
            <div className="h-full w-full px-3 flex items-center">
              <div className="truncate text-xs font-semibold">{group.name}</div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}



function DependencyOverlay({
  tasks,
  groups,
  taskY,
  totalH,
  rangeStart,
  days,
  cellW,
  leftX,
  timelineW,
  taskRowH,
}: {
  tasks: Task[];
  groups: Group[];
  taskY: Map<string, number>;
  totalH: number;
  rangeStart: Date;
  days: Date[];
  cellW: number;
  leftX: number;
  timelineW: number;
  taskRowH: number;
}) {
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t] as const)), [tasks]);

  // ✅ Tune this ONCE so:
  // - line starts right at pill border (no big empty gap)
  // - mask matches pill height (so arrows disappear only "inside" bars)
  const PILL_HALF_H = useMemo(() => {
    return Math.min(13, Math.max(9, taskRowH * 0.24));
  }, [taskRowH]);

  // ✅ Build bar rectangles for an SVG mask (so arrows never render over bars)
  const barRects = useMemo(() => {
    const rects: Array<{ x: number; y: number; w: number; h: number; rx: number }> = [];

    for (const t of tasks) {
      const yc = taskY.get(t.id);
      if (typeof yc !== "number") continue;

      const sIdx = clamp(dayIndex(rangeStart, toDate(t.start)), 0, days.length - 1);
      const dIdx = clamp(dayIndex(rangeStart, toDate(t.due)), 0, days.length - 1);
      const span = Math.max(1, dIdx - sIdx + 1);

      const left = sIdx * cellW;
      const width = span * cellW;

      const barLeft = left + BAR_PAD;
      const barW = Math.max(1, width - BAR_PAD * 2);

      const x = clamp(barLeft, 0, timelineW);
      const w = clamp(barW, 0, Math.max(0, timelineW - x));

      const y = clamp(yc - PILL_HALF_H, 0, totalH);
      const h = clamp(PILL_HALF_H * 2, 0, Math.max(0, totalH - y));

      // rx close to the pill rounding (safe approximation)
      const rx = Math.min(PILL_HALF_H, 14);

      rects.push({ x, y, w, h, rx });
    }

    return rects;
  }, [tasks, taskY, rangeStart, days.length, cellW, timelineW, totalH, PILL_HALF_H]);

  const links = useMemo(() => {
    const out: Array<{
      fromId: string;
      toId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      title: string;
      sameDay: boolean;
      capX1: number; // ✅ last-day cell left edge
      capX2: number; // ✅ last-day cell right edge
    }> = [];

    for (const to of tasks) {
      // ✅ supports both old (string) and new (string[]) formats
      const rawDeps = (to as any).dependsOn as string | string[] | null | undefined;
const depIds = depsToArray(rawDeps as any);

      for (const fromId of depIds) {
        if (!fromId) continue;
        if (fromId === to.id) continue;

        const from = taskMap.get(fromId);
        if (!from) continue;

        const y1 = taskY.get(fromId);
        const y2 = taskY.get(to.id);
        if (typeof y1 !== "number" || typeof y2 !== "number") continue;

        // ---- source bar geometry ----
        const rawFromStartIdx = dayIndex(rangeStart, toDate(from.start));
        const rawFromDueIdx = dayIndex(rangeStart, toDate(from.due));

        const fromStartIdx = clamp(rawFromStartIdx, 0, days.length - 1);
        const fromDueIdx = clamp(rawFromDueIdx, 0, days.length - 1);
        const fromSpan = Math.max(1, fromDueIdx - fromStartIdx + 1);

        const fromLeft = fromStartIdx * cellW;
        const fromWidth = fromSpan * cellW;

        const fromBarLeft = fromLeft + BAR_PAD;
        const fromBarW = Math.max(1, fromWidth - BAR_PAD * 2);

        // ✅ center of the LAST day cell of the predecessor
        const fromLastDayMidX = fromLeft + (fromSpan - 0.5) * cellW;

        // ✅ cap = EXACTLY the last-day cell width (what you want)
        const capX1 = fromDueIdx * cellW;
        const capX2 = capX1 + cellW;

        // ---- target bar geometry ----
        const rawToStartIdx = dayIndex(rangeStart, toDate(to.start));
        const rawToDueIdx = dayIndex(rangeStart, toDate(to.due));

        const toStartIdx = clamp(rawToStartIdx, 0, days.length - 1);
        const toDueIdx = clamp(rawToDueIdx, 0, days.length - 1);
        const toSpan = Math.max(1, toDueIdx - toStartIdx + 1);

        const toLeft = toStartIdx * cellW;
        const toWidth = toSpan * cellW;

        const toBarLeft = toLeft + BAR_PAD;
        const toBarW = Math.max(1, toWidth - BAR_PAD * 2);

        // ✅ "same-day" in TERMS OF THE GRID COLUMN (more reliable than String(date))
        const sameDay = rawFromDueIdx === rawToStartIdx;

        // default anchors
        let fromAnchorX = clamp(fromLastDayMidX, fromBarLeft, fromBarLeft + fromBarW);
        let toAnchorX = toBarLeft; // default: connect to start edge of successor bar

        // ✅ SAME-DAY: vertical-only drop aligned to predecessor LAST DAY (center)
        if (sameDay) {
          const overlapMin = Math.max(fromBarLeft, toBarLeft);
          const overlapMax = Math.min(fromBarLeft + fromBarW, toBarLeft + toBarW);

          let x = fromLastDayMidX;

          if (overlapMin <= overlapMax) {
            x = clamp(x, overlapMin, overlapMax);
          } else {
            x = clamp(x, fromBarLeft, fromBarLeft + fromBarW);
            x = clamp(x, toBarLeft, toBarLeft + toBarW);
          }

          fromAnchorX = x;
          toAnchorX = x;
        }

        out.push({
          fromId,
          toId: to.id,
          x1: fromAnchorX,
          y1,
          x2: toAnchorX,
          y2,
          title: "",
          sameDay,
          capX1,
          capX2,
        });
      }
    }

    return out;
  }, [tasks, taskMap, taskY, rangeStart, days.length, cellW]);

  if (!links.length) return null;

  return (
    <svg
      className="absolute top-0 pointer-events-none text-[var(--text)]/80"
      // keep it visible above the grid, but we will MASK it under pills
      style={{ left: leftX, width: timelineW, height: totalH, zIndex: 200 }}
    >
      <defs>
        {/* ✅ Mask punches out all task bars, so arrows NEVER render over pills */}
        <mask id="dep-mask" maskUnits="userSpaceOnUse">
          <rect x={0} y={0} width={timelineW} height={totalH} fill="white" />
          {barRects.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={r.rx}
              ry={r.rx}
              fill="black"
            />
          ))}
        </mask>
      </defs>

      <g mask="url(#dep-mask)">
        {links.map((l) => {
          const STROKE_PX = 2;
          const LINE_OPACITY = 0.8;

          const ARROW_LEN_PX = 7;
          const ARROW_HALF_PX = 2.6;
          const ARROW_GAP_PX = 1; // ✅ smaller gap so it feels like it drops right at the border

          const y1c = clamp(l.y1, 0, totalH);
          const y2c = clamp(l.y2, 0, totalH);

          const startX = clamp(l.x1, 0, timelineW);

          // ✅ start exactly at pill bottom border (no huge empty gap)
          const startY = clamp(y1c + PILL_HALF_H + STROKE_PX / 2, 0, totalH);

          // ✅ base cap = last-day cell width
          const baseX1 = clamp(l.capX1, 0, timelineW);
          const baseX2 = clamp(l.capX2, 0, timelineW);

          const tipX = clamp(l.x2, 0, timelineW);

          // ✅ SAME-DAY: vertical-only arrow landing on target pill border
          if (l.sameDay) {
            const dirY = y2c >= startY ? 1 : -1;

            // Arrow tip sits on top/bottom edge of the target pill
            const tipY = clamp(y2c - dirY * (PILL_HALF_H + STROKE_PX / 2), 0, totalH);

            // Stop the line just before the arrowhead
            const lineEndY = clamp(tipY - dirY * (ARROW_LEN_PX + ARROW_GAP_PX), 0, totalH);

            const d = `M ${baseX1} ${startY} H ${baseX2} M ${startX} ${startY} V ${lineEndY}`;

            const arrowD =
              dirY === 1
                ? `M ${startX} ${tipY} L ${startX - ARROW_HALF_PX} ${
                    tipY - ARROW_LEN_PX
                  } L ${startX + ARROW_HALF_PX} ${tipY - ARROW_LEN_PX} Z`
                : `M ${startX} ${tipY} L ${startX - ARROW_HALF_PX} ${
                    tipY + ARROW_LEN_PX
                  } L ${startX + ARROW_HALF_PX} ${tipY + ARROW_LEN_PX} Z`;

            return (
              <g key={`${l.fromId}->${l.toId}`}>
                <path
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={STROKE_PX}
                  strokeOpacity={LINE_OPACITY}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>{l.title}</title>
                </path>

                <path
                  d={arrowD}
                  fill="currentColor"
                  fillOpacity={1}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
              </g>
            );
          }

          // ✅ normal elbow arrow (unchanged behavior)
          const dir = tipX >= startX ? 1 : -1;

          const tipY = clamp(y2c, 0, totalH);
          const deltaY = tipY - startY;
          const sgnY = deltaY === 0 ? 1 : Math.sign(deltaY);

          const rWanted = clamp(Math.abs(deltaY) * 0.35, 6, 9);
          const r = Math.min(rWanted, Math.abs(deltaY));

          const lineEndX = clamp(tipX - dir * (ARROW_LEN_PX + ARROW_GAP_PX), 0, timelineW);

          const maxRByX = Math.abs(lineEndX - startX);
          const rSafe = Math.min(r, maxRByX);

          const vEndY = clamp(tipY - sgnY * rSafe, 0, totalH);

          let d: string;
          if (rSafe < 0.5) {
            d = `M ${baseX1} ${startY} H ${baseX2} M ${startX} ${startY} V ${tipY} H ${lineEndX}`;
          } else {
            d =
              `M ${baseX1} ${startY} H ${baseX2} ` +
              `M ${startX} ${startY} V ${vEndY} Q ${startX} ${tipY} ${
                startX + dir * rSafe
              } ${tipY} H ${lineEndX}`;
          }

          const arrowD = `M ${tipX} ${tipY} L ${tipX - dir * ARROW_LEN_PX} ${
            tipY - ARROW_HALF_PX
          } L ${tipX - dir * ARROW_LEN_PX} ${tipY + ARROW_HALF_PX} Z`;

          return (
            <g key={`${l.fromId}->${l.toId}`}>
              <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE_PX}
                strokeOpacity={LINE_OPACITY}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>{l.title}</title>
              </path>

              <path
                d={arrowD}
                fill="currentColor"
                fillOpacity={1}
                stroke="currentColor"
                strokeWidth={1}
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}


















function SnapshotPreview({ groups, tasks, autoRows }: { groups: Group[]; tasks: Task[]; autoRows: boolean }) {
  const filteredTasks = useMemo(() => tasks ?? [], [tasks]);

  const taskRange = useMemo(() => computeTaskMinMax(filteredTasks), [filteredTasks]);
  const timelineStart = useMemo(() => addDays(taskRange.minStart, -7), [taskRange.minStart]);
  const timelineEnd = useMemo(() => addDays(taskRange.maxDue, 7), [taskRange.maxDue]);

  const days = useMemo(() => {
    const out: Date[] = [];
    const total = Math.max(1, dayDiffInclusive(timelineStart, timelineEnd));
    for (let i = 0; i < total; i++) out.push(addDays(timelineStart, i));
    return out;
  }, [timelineStart, timelineEnd]);

  const cellW = 22;
  const timelineW = days.length * cellW;
  const leftW = 280;
  const todayIdx = dayIndex(timelineStart, noonToday());

  const tasksByGroup = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const arr = map.get(t.groupId) ?? [];
      arr.push(t);
      map.set(t.groupId, arr);
    }
    for (const [gid, arr] of map.entries()) {
      arr.sort((a, b) => {
        if (autoRows) return toDate(a.start).getTime() - toDate(b.start).getTime();
        const ao = a.rowOrder ?? 999999;
        const bo = b.rowOrder ?? 999999;
        if (ao !== bo) return ao - bo;
        return toDate(a.start).getTime() - toDate(b.start).getTime();
      });
      map.set(gid, arr);
    }
    return map;
  }, [filteredTasks, autoRows]);

  const groupRanges = useMemo(() => {
    const map = new Map<string, { start: Date; due: Date }>();
    for (const g of groups) {
      const list = tasksByGroup.get(g.id) ?? [];
      if (!list.length) continue;
      const starts = list.map((t) => toDate(t.start));
      const dues = list.map((t) => toDate(t.due));
      const start = starts.reduce((a, b) => (a < b ? a : b), starts[0]);
      const due = dues.reduce((a, b) => (a > b ? a : b), dues[0]);
      map.set(g.id, { start, due });
    }
    return map;
  }, [groups, tasksByGroup]);

  return (
    <div className={cn("rounded-xl overflow-hidden", OUTLINE_SUBTLE)}>
      <div className="grid" style={{ gridTemplateColumns: `${leftW}px ${timelineW}px` }}>
        <div className={cn("border-b border-b-[0.5px] border-r border-r-[0.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--muted)]")}>Preview</div>
        <div className={cn("border-b border-b-[0.5px] border-[var(--border)] bg-[var(--bg)]")}>
          <TimelineHeader days={days} cellW={cellW} todayIdx={todayIdx} zoomPreset="z100" />
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <div style={{ width: leftW + timelineW }}>
          {/* ✅ NEW: Leaves row (preview, fixed 2 bars) */}
{(() => {
  const previewLeaves = seedLeaves.slice(0, 2);
  const leavesH = Math.max(1, previewLeaves.length) * 28;

  return (
    <div
      className={cn("grid border-t border-t-[0.5px] border-[var(--border)]")}
      style={{ gridTemplateColumns: `${leftW}px ${timelineW}px`, height: leavesH }}
    >
      <div className={cn("border-r border-r-[0.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2")}>
        <div className="font-semibold">Leaves</div>
        <div className="text-xs text-[var(--muted)]">{seedLeaves.length} leaves</div>
      </div>

      <div className="relative" style={{ height: leavesH }}>
        <TimelineGrid
          days={days}
          cellW={cellW}
          rowH={leavesH}
          idPrefix="preview-leaves"
          todayIdx={todayIdx}
          zoomPreset="z100"
        />

        {previewLeaves.map((lv, i) => {
          const start = toDate(lv.start);
          const due = toDate(lv.due);

          const startIdx = clamp(dayIndex(timelineStart, start), 0, days.length - 1);
          const dueIdx = clamp(dayIndex(timelineStart, due), 0, days.length - 1);
          const span = Math.max(1, dueIdx - startIdx + 1);

          const left = startIdx * cellW + BAR_PAD;
          const width = Math.max(1, span * cellW - BAR_PAD * 2);

          const normalized = normalizeHexColor(lv.barColor ?? null);
          const inlineStyle: React.CSSProperties = normalized ? { backgroundColor: normalized } : {};

          const slotTop = i * 28;
          const barH = 18;
          const barTop = slotTop + (28 - barH) / 2;

          return (
            <div
              key={lv.id}
              className="absolute"
              style={{ top: barTop, left, width, height: barH }}
              title={`${lv.assignee}${lv.label ? ` · ${lv.label}` : ""}`}
            >
              <div
                className={cn("h-full w-full rounded-md border shadow-sm px-2 flex items-center text-xs")}
                style={inlineStyle}
              >
                <div className="truncate">{lv.assignee}{lv.label ? ` · ${lv.label}` : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
})()}

{groups.map((g) => {
  const list = tasksByGroup.get(g.id) ?? [];

  return (
    <React.Fragment key={g.id}>
      <div
        className={cn("grid border-t border-t-[0.5px] border-[var(--border)]")}
        style={{
          gridTemplateColumns: `${leftW}px ${timelineW}px`,
          height: 44,
        }}
      >
        <div
          className={cn(
            "border-r border-r-[0.5px] border-[var(--border)] bg-[var(--surface)] px-3 flex items-center"
          )}
        >
          <div className="font-semibold truncate">{g.name}</div>
        </div>

        <div className="relative" style={{ height: 44 }}>
          <GroupSpanBar
            group={g}
            rangeStart={timelineStart}
            days={days}
            cellW={cellW}
            todayIdx={todayIdx}
            groupRange={groupRanges.get(g.id) ?? null}
          />
        </div>
      </div>

      {list.map((t) => (
        <div
          key={t.id}
          className={cn("grid border-t border-t-[0.5px] border-[var(--border)]")}
          style={{
            gridTemplateColumns: `${leftW}px ${timelineW}px`,
            height: 28,
          }}
        >
          <div
            className={cn(
              "border-r border-r-[0.5px] border-[var(--border)] bg-[var(--bg)] px-3 flex items-center justify-between gap-2"
            )}
          >
            <div className="truncate text-sm">{t.name}</div>
            <div className="text-[11px] text-[var(--muted)] shrink-0">{t.assignee}</div>
          </div>

          <div className="relative" style={{ height: 28 }}>
            <TaskBar
              rowH={28}
              task={t}
              rangeStart={timelineStart}
              days={days}
              cellW={cellW}
              todayIdx={todayIdx}
              showDepDots={false}
            />
          </div>
        </div>
      ))}
    </React.Fragment>
  );
})}

        </div>
      </div>
    </div>
  );
}

// ------------------- MiniMap -------------------
// Removed (user requested deleting the expanding pill scrubber)

// Solid hover wash (opaque so the day grid doesn't show through)
const ROW_HOVER_OVERLAY = "bg-black/5";
// or: "bg-[var(--hover)]"

export default function ProducerTimelineGanttApp() {
  const [groups, setGroups] = useState<Group[]>(seedGroups);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  // ...
// --- Task name input refs (so we can focus the newly inserted row) ---
const taskNameInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
const [pendingFocusTaskId, setPendingFocusTaskId] = useState<string | null>(null);

const bindTaskNameInputRef =
  (taskId: string) =>
  (el: HTMLInputElement | null) => {
    if (el) taskNameInputRefs.current.set(taskId, el);
    else taskNameInputRefs.current.delete(taskId);
  };

useEffect(() => {
  if (!pendingFocusTaskId) return;

  // Wait for the row to render
  requestAnimationFrame(() => {
    const el = taskNameInputRefs.current.get(pendingFocusTaskId);
    if (el) {
      el.focus();
      el.select();
    }
    setPendingFocusTaskId(null);
  });
}, [pendingFocusTaskId, tasks]);

// --- Insert a new task directly BELOW the current task (shifts following tasks down) ---
function insertTaskBelow(taskId: string) {
  const createdId = newId("t");

  setTasks((prev) => {
    const cur = prev.find((t) => t.id === taskId);
    if (!cur) return prev;

    const groupId = cur.groupId;

    // Use current manual order (rowOrder). If some rows don't have rowOrder, normalize first.
    const groupTasks = prev
      .filter((t) => t.groupId === groupId)
      .slice()
      .sort((a, b) => {
        const ao = a.rowOrder ?? 999999;
        const bo = b.rowOrder ?? 999999;
        if (ao !== bo) return ao - bo;
        return toDate(a.start).getTime() - toDate(b.start).getTime();
      });

    const idx = groupTasks.findIndex((t) => t.id === taskId);
    if (idx < 0) return prev;

    // Normalize rowOrder for this group (1..n) based on current displayed order
    const normalizedOrder = new Map<string, number>();
    groupTasks.forEach((t, i) => normalizedOrder.set(t.id, i + 1));

    const insertPos = idx + 1; // insert AFTER current row (0-based position in groupTasks)
    const successor = groupTasks[insertPos] ?? null;

    // Shift rowOrder for tasks after the insert point
    const next = prev.map((t) => {
      if (t.groupId !== groupId) return t;

      const pos0 = (normalizedOrder.get(t.id) ?? (t.rowOrder ?? 999999)) - 1;
      const newPos0 = pos0 >= insertPos ? pos0 + 1 : pos0;

      return { ...t, rowOrder: newPos0 + 1 };
    });

    // New task defaults:
    // - assignee matches current row (so it stays visible under assignee filters)
    // - dependsOn current task (keeps a sensible chain)
    const baseStart = nextBusinessDay(toDate(cur.due));
    const newTask: Task = {
      id: createdId,
      groupId,
      name: "New task",
      rowOrder: insertPos + 1, // because rowOrder is 1-based
      quotedHours: 0,
      actualHours: 0,
      assignee: cur.assignee,
      status: "Not Started",
      start: toISODate(baseStart),
      due: toISODate(addBusinessDaysFrom(baseStart, 1)),
      dependsOn: [cur.id],
    };

    // OPTIONAL (nice behavior): if the next task was a simple chain (depends only on cur),
    // move it to depend on the inserted task instead.
    if (successor) {
      const sIdx = next.findIndex((t) => t.id === successor.id);
      if (sIdx >= 0) {
        const deps = depsToArray((next[sIdx] as any).dependsOn);
        if (deps.length === 1 && deps[0] === cur.id) {
          next[sIdx] = { ...next[sIdx], dependsOn: [createdId] };
        }
      }
    }

    return enforceFinishToStartDependencies([...next, newTask]);
  });

  setPendingFocusTaskId(createdId);
}

// --- Enter key handler for task name input ---
function handleTaskNameKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  taskId: string
) {
  if (e.key !== "Enter") return;
  if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;

  e.preventDefault();
  e.stopPropagation();
  cancelAnyDrag();

  // If Auto rows is ON, freeze to rowOrder first (so "insert below" works exactly like your expectation)
  if (autoRows) {
    freezeRowOrderFromCurrentDates();
    setAutoRows(false);
  }

  insertTaskBelow(taskId);
}

  // ✅ Fullscreen support
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    const el = fullscreenRef.current;
    if (!el) return;

    const isThisElFullscreen = document.fullscreenElement === el;

    const request =
      el.requestFullscreen || (el as any).webkitRequestFullscreen;
    const exit =
      document.exitFullscreen || (document as any).webkitExitFullscreen;

    try {
      if (!isThisElFullscreen) {
        if (request) await Promise.resolve(request.call(el));
      } else {
        if (exit) await Promise.resolve(exit.call(document));
      }
    } catch {
      // ignore (browser may block fullscreen)
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const el = fullscreenRef.current;
      setIsFullscreen(!!el && document.fullscreenElement === el);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    // Safari older
    document.addEventListener("webkitfullscreenchange" as any, onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange" as any, onFsChange);
    };
  }, []);

  const [versions, setVersions] = useState<TimelineVersion[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // ✅ ADD THIS: keeps dependency cycle checks using the latest tasks
  const tasksRef = useRef<Task[]>(seedTasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  const [hideCompleted, setHideCompleted] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);

  // ✅ NEW: Leaves expand/collapse (fixed row, not editable)
  // Option A: default to expanded (matches the intended UI in your Image 2/3)
  const [leavesExpanded, setLeavesExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const raw = window.localStorage.getItem("pt_leavesExpanded");
    if (raw === null) return true;
    return raw === "1";
  });

  // Persist user's toggle so it stays consistent after refresh
  useEffect(() => {
    try {
      window.localStorage.setItem("pt_leavesExpanded", leavesExpanded ? "1" : "0");
    } catch {
      // ignore (private mode / blocked storage)
    }
  }, [leavesExpanded]);

  // ✅ NEW: Collapse columns toggle (ONLY No + Task name)
  const [colsCollapsed, setColsCollapsed] = useState(false);

  const [autoRows, setAutoRows] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [assigneeFilter, setAssigneeFilter] = useState<"All" | Assignee>("All");

  const [depMode, setDepMode] = useState<DepMode>("hover");
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>("z100");


type TaskOptionsTab = "general" | "barColor" | "dates" | "assignees" | "costed" | "dependencies";

// ✅ Task options dialog (opens on double-click)
const [taskOptionsTaskId, setTaskOptionsTaskId] = useState<string | null>(null);
const [taskOptionsTab, setTaskOptionsTab] = useState<TaskOptionsTab>("general");

// local drafts (saved only when user clicks Save)
const [nameDraft, setNameDraft] = useState<string>("");
const [statusDraft, setStatusDraft] = useState<Status>("Not Started");
const [assigneeDraft, setAssigneeDraft] = useState<Assignee>("Max");
const [quotedDraft, setQuotedDraft] = useState<number>(0);
const [actualDraft, setActualDraft] = useState<number>(0);
const [depsDraft, setDepsDraft] = useState<string[]>([]);

const [barColorDraft, setBarColorDraft] = useState<string | null>(null);
const [dateStartDraft, setDateStartDraft] = useState<string>("");
const [dateDueDraft, setDateDueDraft] = useState<string>("");

function openTaskOptions(taskId: string, tab: TaskOptionsTab = "general") {
  const t = tasks.find((x) => x.id === taskId);
  setTaskOptionsTaskId(taskId);
  setTaskOptionsTab(tab);

  // drafts
  setNameDraft(t?.name ?? "");
  setStatusDraft((t?.status as Status) ?? "Not Started");
  setAssigneeDraft((t?.assignee as Assignee) ?? "Max");
  setQuotedDraft(Number.isFinite(t?.quotedHours as any) ? Number(t?.quotedHours) : 0);
  setActualDraft(Number.isFinite(t?.actualHours as any) ? Number(t?.actualHours) : 0);
  setDepsDraft(depsToArray((t as any)?.dependsOn));

  setBarColorDraft(t?.barColor ?? null);
  setDateStartDraft(t?.start ?? "");
  setDateDueDraft(t?.due ?? "");
}

function closeTaskOptions() {
  setTaskOptionsTaskId(null);
  setTaskOptionsTab("general");

  setNameDraft("");
  setStatusDraft("Not Started");
  setAssigneeDraft("Max");
  setQuotedDraft(0);
  setActualDraft(0);
  setDepsDraft([]);

  setBarColorDraft(null);
  setDateStartDraft("");
  setDateDueDraft("");
}

function resetTaskDrafts(tab: TaskOptionsTab) {
  if (!taskOptionsTaskId) return;
  const t = tasks.find((x) => x.id === taskOptionsTaskId);
  if (!t) return;

  if (tab === "general") {
    setNameDraft(t.name ?? "");
    setStatusDraft((t.status as Status) ?? "Not Started");
    return;
  }
  if (tab === "assignees") {
    setAssigneeDraft((t.assignee as Assignee) ?? "Max");
    return;
  }
  if (tab === "costed") {
    setQuotedDraft(Number.isFinite((t as any).quotedHours) ? Number((t as any).quotedHours) : 0);
    setActualDraft(Number.isFinite((t as any).actualHours) ? Number((t as any).actualHours) : 0);
    return;
  }
  if (tab === "dependencies") {
    setDepsDraft(depsToArray((t as any).dependsOn));
    return;
  }
  if (tab === "barColor") {
    setBarColorDraft((t as any).barColor ?? null);
    return;
  }
  if (tab === "dates") {
    setDateStartDraft((t as any).start ?? "");
    setDateDueDraft((t as any).due ?? "");
    return;
  }
}

function saveGeneral() {
  if (!taskOptionsTaskId) return;
  patchTask(taskOptionsTaskId, { name: nameDraft, status: statusDraft });
}

function saveAssignee() {
  if (!taskOptionsTaskId) return;
  patchTask(taskOptionsTaskId, { assignee: assigneeDraft });
}

function saveCosted() {
  if (!taskOptionsTaskId) return;
  patchTask(taskOptionsTaskId, {
    quotedHours: Math.max(0, Math.floor(Number(quotedDraft) || 0)),
    actualHours: Math.max(0, Math.floor(Number(actualDraft) || 0)),
  });
}

function saveDependencies() {
  if (!taskOptionsTaskId) return;
  const uniq = Array.from(new Set(depsDraft.filter(Boolean)));
  patchTask(taskOptionsTaskId, { dependsOn: uniq.length ? uniq : null });
}

function saveTaskBarColor() {
  if (!taskOptionsTaskId) return;
  const normalized = normalizeHexColor(barColorDraft);
  patchTask(taskOptionsTaskId, { barColor: normalized });
}

function saveTaskDates() {
  if (!taskOptionsTaskId) return;

  const nextStart = dateStartDraft;
  let nextDue = dateDueDraft;

  // basic guard: due cannot be before start
  try {
    if (nextStart && nextDue && toDate(nextDue).getTime() < toDate(nextStart).getTime()) {
      nextDue = nextStart;
    }
  } catch {}

  patchTask(taskOptionsTaskId, { start: nextStart, due: nextDue });
}

function cancelAnyDrag() {
  dragMoveRef.current = null;
  dragResizeRef.current = null;
  dragMoveGroupRef.current = null;

  setDragMoveTaskId(null);
  setDragMoveGroupId(null);
  setDragResizeTaskId(null);

  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

// ✅ derived (top-level in component)
const canZoomIn = zoomPreset !== ZOOM_ORDER[0];
const canZoomOut = zoomPreset !== ZOOM_ORDER[ZOOM_ORDER.length - 1];


  // 6) Resizable left Task column
  const [taskColW, setTaskColW] = useState<number>(260);
  const panelResizeRef = useRef<{ startX: number; startW: number } | null>(null);

  // ...inside ProducerTimelineGanttApp()

// 8) Hover sync
const [hoverTaskId, setHoverTaskId] = useState<string | null>(null);
const [hoverGroupId, setHoverGroupId] = useState<string | null>(null);

// ✅ NEW: selected task(s) (click to select, Shift for range, Cmd/Ctrl for toggle)
const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);

const selectedTaskSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds]);

const visibleTaskIdsRef = useRef<string[]>([]);
const selectionAnchorRef = useRef<string | null>(null);

useEffect(() => {
  selectionAnchorRef.current = selectionAnchorId;
}, [selectionAnchorId]);

// Keep the "visible order" list updated for Shift-range selection
// (Do NOT reference `rows` here, because `rows` is declared later in the component.)
useEffect(() => {
  const base: Task[] = Array.isArray(tasks) ? tasks : [];

  const filtered = base.filter((t) => {
    if (hideCompleted && t.status === "Completed") return false;
    if (assigneeFilter !== "All" && t.assignee !== assigneeFilter) return false;
    return true;
  });

  const byGroup = new Map<string, Task[]>();
  for (const t of filtered) {
    const arr = byGroup.get(t.groupId) ?? [];
    arr.push(t);
    byGroup.set(t.groupId, arr);
  }

  const order: string[] = [];

  for (const g of groups) {
    if (g.collapsed) continue;

    const list = (byGroup.get(g.id) ?? []).slice();

    list.sort((a, b) => {
      if (autoRows) return toDate(a.start).getTime() - toDate(b.start).getTime();
      const ao = a.rowOrder ?? 999999;
      const bo = b.rowOrder ?? 999999;
      if (ao !== bo) return ao - bo;
      return toDate(a.start).getTime() - toDate(b.start).getTime();
    });

    for (const t of list) order.push(t.id);
  }

  visibleTaskIdsRef.current = order;
}, [tasks, groups, hideCompleted, assigneeFilter, autoRows]);


// ✅ Click to select (works on bar OR row), Shift=range, Cmd/Ctrl=toggle
useEffect(() => {
  const onPointerDown = (ev: PointerEvent) => {
    const el = ev.target as HTMLElement | null;

    const bar = el?.closest?.("[data-task-bar]") as HTMLElement | null;
    const row = el?.closest?.("[data-task-row]") as HTMLElement | null;

    const id = (bar?.dataset.taskBar ?? row?.dataset.taskRow) ?? null;

    // Clicked outside any task → deselect
    if (!id) {
      setSelectedTaskIds([]);
      setSelectionAnchorId(null);
      return;
    }

    const isShift = ev.shiftKey;
    const isMeta = ev.metaKey || ev.ctrlKey;

    const order = visibleTaskIdsRef.current;

    // Shift = select range from anchor → clicked
    if (isShift) {
      const anchor =
        selectionAnchorRef.current && order.includes(selectionAnchorRef.current)
          ? selectionAnchorRef.current
          : id;

      const range = idsInInclusiveRange(order, anchor, id);

      setSelectedTaskIds((prev) => {
        if (isMeta) {
          const s = new Set(prev);
          for (const rid of range) s.add(rid);
          return Array.from(s);
        }
        return range;
      });

      if (!selectionAnchorRef.current || !order.includes(selectionAnchorRef.current)) {
        setSelectionAnchorId(anchor);
      }
    } else if (isMeta) {
      // Cmd/Ctrl = toggle one
      setSelectedTaskIds((prev) => {
        const s = new Set(prev);
        if (s.has(id)) s.delete(id);
        else s.add(id);
        return Array.from(s);
      });
      setSelectionAnchorId(id);
    } else {
      // Normal click = single select
      setSelectedTaskIds([id]);
      setSelectionAnchorId(id);
    }

    // Blur input so Delete affects selection, not text
    const ae = document.activeElement as HTMLElement | null;
    const isTyping =
      !!ae &&
      (ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        (ae as any).isContentEditable);

    if (isTyping) ae.blur();
  };

  window.addEventListener("pointerdown", onPointerDown, true);
  return () => window.removeEventListener("pointerdown", onPointerDown, true);
}, []);

// ✅ If selected tasks disappear (undo/delete/filter), prune selection
useEffect(() => {
  if (!selectedTaskIds.length && !selectionAnchorId) return;

  const existing = new Set(tasks.map((t) => t.id));

  setSelectedTaskIds((prev) => {
    const next = prev.filter((id) => existing.has(id));
    if (next.length === prev.length) return prev;
    return next;
  });

  setSelectionAnchorId((cur) => (cur && existing.has(cur) ? cur : null));
}, [tasks, selectedTaskIds.length, selectionAnchorId]);


// 9) Undo/Redo
const historyRef = useRef<{
  past: Snapshot[];
  future: Snapshot[];
  last: Snapshot | null;
  timer: number | null;
  applying: boolean;
}>({ past: [], future: [], last: null, timer: null, applying: false });

const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
const [editDatesTaskId, setEditDatesTaskId] = useState<string | null>(null);
const [dragGroupId, setDragGroupId] = useState<string | null>(null);
const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

const [linkFromId, setLinkFromId] = useState<string | null>(null); // task A (predecessor / dragged task)
const [linkHoverToId, setLinkHoverToId] = useState<string | null>(null); // candidate successor B (bar under cursor)
const [linkCursor, setLinkCursor] = useState<{ x: number; y: number } | null>(null);
const linkHoverRef = useRef<string | null>(null);

useEffect(() => {
  linkHoverRef.current = linkHoverToId;
}, [linkHoverToId]);

const depLayerRef = useRef<HTMLDivElement | null>(null);

const [dragMoveTaskId, setDragMoveTaskId] = useState<string | null>(null);
const [dragMoveGroupId, setDragMoveGroupId] = useState<string | null>(null);
const [dragResizeTaskId, setDragResizeTaskId] = useState<string | null>(null);

// ✅ Press Delete/Backspace to delete the selected bar (only if a bar was clicked/selected)
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (!selectedTaskIds.length) return;

    if (e.key !== "Delete" && e.key !== "Backspace") return;

    const target = e.target as HTMLElement | null;
    const isTyping =
      !!target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        (target as any).isContentEditable);
    if (isTyping) return;

    if (taskOptionsTaskId || versionsOpen || deleteGroupId || editDatesTaskId) return;
    if (dragMoveTaskId || dragResizeTaskId || dragMoveGroupId || linkFromId) return;

    e.preventDefault();
    e.stopPropagation();

    deleteTasks(selectedTaskIds);
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [
  selectedTaskIds,
  taskOptionsTaskId,
  versionsOpen,
  deleteGroupId,
  editDatesTaskId,
  dragMoveTaskId,
  dragResizeTaskId,
  dragMoveGroupId,
  linkFromId,
]);



  const dragResizeRef = useRef<
    | null
    | { taskId: string; edge: "start" | "due"; startX: number; baseStart: Date; baseDue: Date; lastDelta: number }
  >(null);

  const dragMoveRef = useRef<
    | null
    | { taskId: string; startX: number; baseStart: Date; baseDue: Date; lastDelta: number }
  >(null);

  const dragMoveGroupRef = useRef<
    | null
    | { groupId: string; startX: number; base: Map<string, { start: Date; due: Date }>; lastDelta: number }
  >(null);

  const cellW = useMemo(() => {
    switch (zoomPreset) {
      case "z400":
        return 44; // 400%
      case "z200":
        return 30; // 200%
      case "z100":
        return 20; // 100%
      case "z75":
        return 16; // 75%
      case "z50":
        return 12; // 50%
      default:
        return 20;
    }
  }, [zoomPreset]);

  const [rangeAnchor, setRangeAnchor] = useState<{ start: Date; end: Date }>(() => {
    const r = computeTaskMinMax(seedTasks);
    return { start: addDays(r.minStart, -RANGE_PAD_DAYS), end: addDays(r.maxDue, RANGE_PAD_DAYS) };
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const headerRowRef = useRef<HTMLDivElement | null>(null);

  // ✅ Width of the visible scroll viewport (so Row A doesn't live in the huge timeline width)
  const [viewportW, setViewportW] = useState<number>(0);

  useLayoutEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;

    const update = () => setViewportW(sc.clientWidth);
    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(sc);
    }

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  const [stickyHeaderH, setStickyHeaderH] = useState(112);

  // Keep scroll position stable when zoom changes (preserve center date)
  const prevCellWRef = useRef<number>(cellW);

  useLayoutEffect(() => {
    const sc = scrollRef.current;
    const prevW = prevCellWRef.current;

    if (!sc) {
      prevCellWRef.current = cellW;
      return;
    }
    if (prevW === cellW) return;

    const centerPx = sc.scrollLeft + sc.clientWidth * 0.5;
    const centerIdx = centerPx / prevW;

    const nextLeft = centerIdx * cellW - sc.clientWidth * 0.5;
    sc.scrollLeft = Math.max(0, nextLeft);

    prevCellWRef.current = cellW;
  }, [cellW]);

  // ------------------- Load draft & versions -------------------
  useEffect(() => {
    const loaded = safeLoadDraft();
    const normalizedTasks = normalizeRowOrder(loaded.groups, loaded.tasks);
    setGroups(loaded.groups);
    setTasks(normalizedTasks);

    const vs = safeLoadVersions();
    setVersions(vs);

    const r = computeTaskMinMax(normalizedTasks);
    setRangeAnchor({
      start: addDays(r.minStart, -RANGE_PAD_DAYS),
      end: addDays(r.maxDue, RANGE_PAD_DAYS),
    });

    // init history baseline
    historyRef.current.last = {
      groups: loaded.groups.map((g) => ({ ...g })),
      tasks: normalizedTasks.map((t) => ({ ...t })),
    };

    setHydrated(true);
  }, []);

  const pendingShiftPxRef = useRef(0);
  const extendingRef = useRef(false);

  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;

    const onScroll = () => {
      if (extendingRef.current) return;

      const nearLeft = sc.scrollLeft < EDGE_PX;
      const nearRight = sc.scrollLeft + sc.clientWidth > sc.scrollWidth - EDGE_PX;

      if (nearLeft) {
        extendingRef.current = true;
        pendingShiftPxRef.current += LOAD_CHUNK_DAYS * cellW;
        setRangeAnchor((prev) => ({
          start: addDays(prev.start, -LOAD_CHUNK_DAYS),
          end: prev.end,
        }));
        return;
      }

      if (nearRight) {
        extendingRef.current = true;
        setRangeAnchor((prev) => ({
          start: prev.start,
          end: addDays(prev.end, LOAD_CHUNK_DAYS),
        }));
      }
    };

    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, [cellW]);

  useLayoutEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;

    const shift = pendingShiftPxRef.current;
    if (shift) {
      pendingShiftPxRef.current = 0;
      sc.scrollLeft += shift;
    }

    extendingRef.current = false;
  }, [rangeAnchor.start.getTime(), rangeAnchor.end.getTime(), cellW]);

  // ------------------- Auto-save draft -------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, tasks }));
      } catch {}
      setSavedAt(Date.now());
    }, 350);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [groups, tasks, hydrated]);

  // ------------------- History (Undo/Redo) -------------------
  const cloneSnapshot = (): Snapshot => ({
    groups: groups.map((g) => ({ ...g })),
    tasks: tasks.map((t) => ({ ...t })),
  });

  useEffect(() => {
    if (!hydrated) return;
    const h = historyRef.current;
    if (h.applying) return;

    if (h.timer) window.clearTimeout(h.timer);
    h.timer = window.setTimeout(() => {
      const cur = cloneSnapshot();
      const last = h.last;

      // push only if changed
      const changed =
        !last ||
        last.groups.length !== cur.groups.length ||
        last.tasks.length !== cur.tasks.length ||
        JSON.stringify(last) !== JSON.stringify(cur);

      if (!changed) return;

      if (last) h.past.push(last);
      if (h.past.length > 60) h.past.shift();
      h.future = [];
      h.last = cur;
    }, 650);

    return () => {
      if (h.timer) window.clearTimeout(h.timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, tasks, hydrated]);

  const applySnapshot = (snap: Snapshot) => {
    const h = historyRef.current;
    h.applying = true;

    setGroups(snap.groups.map((g) => ({ ...g })));
    setTasks(normalizeRowOrder(snap.groups, snap.tasks.map((t) => ({ ...t }))));

    h.last = {
      groups: snap.groups.map((g) => ({ ...g })),
      tasks: snap.tasks.map((t) => ({ ...t })),
    };

    window.setTimeout(() => {
      h.applying = false;
    }, 0);
  };

  const undo = () => {
    const h = historyRef.current;
    if (!h.past.length) return;
    const current = h.last ?? cloneSnapshot();
    const prev = h.past.pop()!;
    h.future.unshift(current);
    applySnapshot(prev);
  };

  const redo = () => {
    const h = historyRef.current;
    if (!h.future.length) return;
    const current = h.last ?? cloneSnapshot();
    const next = h.future.shift()!;
    h.past.push(current);
    applySnapshot(next);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as any).isContentEditable);

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "z") {
        if (isTyping) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key.toLowerCase() === "y") {
        if (isTyping) return;
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    const r = computeTaskMinMax(tasks);
    const desiredStart = addDays(r.minStart, -RANGE_PAD_DAYS);
    const desiredEnd = addDays(r.maxDue, RANGE_PAD_DAYS);

    setRangeAnchor((prev) => {
      const start = prev.start > desiredStart ? desiredStart : prev.start;
      const end = prev.end < desiredEnd ? desiredEnd : prev.end;
      if (toISODate(start) === toISODate(prev.start) && toISODate(end) === toISODate(prev.end)) return prev;
      return { start, end };
    });
  }, [tasks]);

  // ------------------- Derived data -------------------
  const filteredTasks = useMemo(() => {
    let base = Array.isArray(tasks) ? tasks : [];
    if (hideCompleted) base = base.filter((t) => t.status !== "Completed");
    if (assigneeFilter !== "All") base = base.filter((t) => t.assignee === assigneeFilter);
    return base;
  }, [tasks, hideCompleted, assigneeFilter]);

  const taskRange = useMemo(() => computeTaskMinMax(filteredTasks), [filteredTasks]);

  const timelineStart = rangeAnchor.start;
  const timelineEnd = rangeAnchor.end;

  const days = useMemo(() => {
    const out: Date[] = [];
    const total = Math.max(1, dayDiffInclusive(timelineStart, timelineEnd));
    for (let i = 0; i < total; i++) out.push(addDays(timelineStart, i));
    return out;
  }, [timelineStart, timelineEnd]);

  const timelineW = days.length * cellW;
  const todayIdx = useMemo(() => dayIndex(timelineStart, noonToday()), [timelineStart]);
  const showTodayLine = todayIdx >= 0 && todayIdx < days.length;
  const todayX = todayIdx * cellW + cellW / 2;

  // Table layout widths (TASK col is resizable)
  const COLS = useMemo(() => {
  // ✅ Collapse = only No + Task name
  if (colsCollapsed) {
    return {
      NO: 36,
      TASK: clamp(taskColW, 220, 560),

      // hidden
      QUOTED: 0,
      ACTUAL: 0,
      ASSIGNEE: 0,
      DAYSLEFT: 0,
      STATUS: 0,
      ACTION: 0,
    } as const;
  }

  // ✅ Compact mode (still shows assignee etc)
  if (hideDetails) {
    return {
      NO: 36,
      TASK: clamp(taskColW, 200, 520),
      ASSIGNEE: 150,
      DAYSLEFT: 90,
      ACTION: 70,

      QUOTED: 0,
      ACTUAL: 0,
      STATUS: 0,
    } as const;
  }

  // ✅ Full detail mode
return {
  NO: 36,
  TASK: clamp(taskColW, 220, 560),
  QUOTED: 84,   // was 64
  ACTUAL: 84,   // was 64
  ASSIGNEE: 160, // was 150 (optional but helps)
  DAYSLEFT: 90,
  STATUS: 150,  // was 140 (optional)
  ACTION: 160,  // was 140 (optional)
} as const;
}, [colsCollapsed, hideDetails, taskColW]);

const leftGridTemplate = colsCollapsed
  ? `${COLS.NO}px ${COLS.TASK}px`
  : hideDetails
  ? `${COLS.NO}px ${COLS.TASK}px ${COLS.ASSIGNEE}px ${COLS.DAYSLEFT}px ${COLS.ACTION}px`
  : `${COLS.NO}px ${COLS.TASK}px ${COLS.QUOTED}px ${COLS.ACTUAL}px ${COLS.ASSIGNEE}px ${COLS.DAYSLEFT}px ${COLS.STATUS}px ${COLS.ACTION}px`;

const leftW = useMemo(() => {
  if (colsCollapsed) {
    return COLS.NO + COLS.TASK + 24;
  }

  return hideDetails
    ? COLS.NO + COLS.TASK + COLS.ASSIGNEE + COLS.DAYSLEFT + COLS.ACTION + 24
    : COLS.NO + COLS.TASK + COLS.QUOTED + COLS.ACTUAL + COLS.ASSIGNEE + COLS.DAYSLEFT + COLS.STATUS + COLS.ACTION + 24;
}, [colsCollapsed, hideDetails, COLS]);


  const timelineLeftX = leftW + SPLIT_W;

// Row heights
const GROUP_ROW_H = hideDetails ? 40 : 44;

// Keep your row heights, but make the *controls taller* to reduce the empty gap
const TASK_ROW_H = hideDetails ? 32 : 34;

// ✅ NEW: Leaves (fixed row under headers)
  const leavesAll = useMemo(() => seedLeaves, []);

  // Only show leaves that intersect the current visible timeline range.
  const leavesInRange = useMemo(() => {
    if (!days.length) return [];
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];
    return leavesAll.filter((lv) => {
      const s = toDate(lv.start);
      const e = toDate(lv.end ?? lv.due);
      return s <= rangeEnd && e >= rangeStart;
    });
  }, [leavesAll, days]);

  const visibleLeaves = useMemo(
    () => (leavesExpanded ? leavesInRange : leavesInRange.slice(0, LEAVES_VISIBLE_LIMIT)),
    [leavesInRange, leavesExpanded]
  );

  // ✅ Pack leaves into the minimum number of lanes.
  // If leaves don't overlap in days, they will share 1 lane (1 row height).
  const visibleLeavesLaneCount = useMemo(() => {
    if (!days.length) return 1;
    return packLeavesIntoLanes(visibleLeaves, timelineStart, days.length).laneCount;
  }, [visibleLeaves, timelineStart, days.length]);

  // ✅ Height grows only when lanes are needed (overlapping leaves)
  const LEAVES_ROW_H = useMemo(() => {
    return Math.max(1, visibleLeavesLaneCount) * TASK_ROW_H;
  }, [visibleLeavesLaneCount, TASK_ROW_H]);


// ✅ Taller controls = less vertical whitespace inside the row
const TASK_CTRL_H = hideDetails ? "h-6 text-xs" : "h-7 text-[13px]";

// Keep padding tight so the height is what you actually see
const TASK_CTRL_PAD = "px-2 py-0";

// ✅ Rounded-rectangle (NOT pill)
const TASK_CTRL_ROUND = "rounded-lg";

// ✅ Match icon buttons to the new control height
const TASK_ICON_BTN  = hideDetails ? "h-6 w-6" : "h-7 w-7";
const TASK_ICON_SIZE = "h-4 w-4";

// ✅ Match badge height too
const TASK_BADGE = hideDetails
  ? "h-6 px-2 text-xs"
  : "h-7 px-3 text-[13px]";




  const tasksByGroup = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const arr = map.get(t.groupId) ?? [];
      arr.push(t);
      map.set(t.groupId, arr);
    }
    for (const [gid, arr] of map.entries()) {
      arr.sort((a, b) => {
        if (autoRows) return toDate(a.start).getTime() - toDate(b.start).getTime();
        const ao = a.rowOrder ?? 999999;
        const bo = b.rowOrder ?? 999999;
        if (ao !== bo) return ao - bo;
        return toDate(a.start).getTime() - toDate(b.start).getTime();
      });
      map.set(gid, arr);
    }
    return map;
  }, [filteredTasks, autoRows]);

  const groupRanges = useMemo(() => {
    const map = new Map<string, { start: Date; due: Date }>();
    for (const g of groups) {
      const list = tasksByGroup.get(g.id) ?? [];
      if (!list.length) continue;
      const starts = list.map((t) => toDate(t.start));
      const dues = list.map((t) => toDate(t.due));
      const start = starts.reduce((a, b) => (a < b ? a : b), starts[0]);
      const due = dues.reduce((a, b) => (a > b ? a : b), dues[0]);
      map.set(g.id, { start, due });
    }
    return map;
  }, [groups, tasksByGroup]);

  const rows = useMemo(() => {
    const out: Array<
      | { kind: "group"; group: Group }
      | { kind: "task"; task: Task; index: number }
      | { kind: "add"; group: Group }
    > = [];
    let idx = 1;
    for (const g of groups) {
      out.push({ kind: "group", group: g });
      const list = tasksByGroup.get(g.id) ?? [];
      if (!g.collapsed) {
        for (const t of list) out.push({ kind: "task", task: t, index: idx++ });
        out.push({ kind: "add", group: g });
      }
    }
    return out;
  }, [groups, tasksByGroup]);

const ROW_BORDER_H = 1; // ✅ now truly matches the rendered row border (1px)
const rowLayout = useMemo(() => {
  let y = 0;
  const taskY = new Map<string, number>();

  // ✅ NEW: Leaves row sits BEFORE any groups/tasks
  y += ROW_BORDER_H;
  y += LEAVES_ROW_H;

  for (const r of rows) {
    const rowH = r.kind === "group" ? GROUP_ROW_H : TASK_ROW_H;

    // ✅ Each row wrapper has a 1px top border ("border-t")
    y += ROW_BORDER_H;

    // taskY stores the vertical center of the task pill in the timeline layer.
    if (r.kind === "task") taskY.set(r.task.id, y + rowH / 2);

    y += rowH;
  }

  return { taskY, totalH: y };
}, [rows, GROUP_ROW_H, TASK_ROW_H, LEAVES_ROW_H]);



  const initialScrollSetRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (initialScrollSetRef.current) return;
    const sc = scrollRef.current;
    if (!sc) return;

    const idx = clamp(dayIndex(timelineStart, taskRange.minStart), 0, days.length - 1);
    sc.scrollLeft = Math.max(0, idx * cellW - sc.clientWidth * 0.25);

    initialScrollSetRef.current = true;
  }, [hydrated, days.length, cellW, timelineStart, taskRange.minStart]);

  // ------------------- Actions -------------------
  function newId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
  }

  function forceSaveNow() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, tasks }));
    } catch {}
    setSavedAt(Date.now());
  }

  function patchGroup(groupId: string, patch: Partial<Group>) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  }

  function patchTask(taskId: string, patch: Partial<Task>) {
    setTasks((prev) => enforceFinishToStartDependencies(prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))));
  }

  function freezeRowOrderFromCurrentDates() {
    setTasks((prev) => {
      const next = prev.map((t) => ({ ...t }));
      const byGroup = new Map<string, Task[]>();
      for (const t of next) {
        const arr = byGroup.get(t.groupId) ?? [];
        arr.push(t);
        byGroup.set(t.groupId, arr);
      }
      for (const g of groups) {
        const list = byGroup.get(g.id) ?? [];
        if (!list.length) continue;
        list
          .slice()
          .sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime())
          .forEach((t, i) => {
            t.rowOrder = i + 1;
          });
      }
      return next;
    });
  }

  function onToggleRowArrangement(nextAuto: boolean) {
    if (!nextAuto && autoRows) freezeRowOrderFromCurrentDates();
    setAutoRows(nextAuto);
  }

function deleteTasks(taskIds: string[]) {
  const ids = Array.from(new Set(taskIds.filter(Boolean)));
  if (!ids.length) return;

  const removed = new Set(ids);

  setSelectedTaskIds((prev) => prev.filter((id) => !removed.has(id)));
  setSelectionAnchorId((cur) => (cur && removed.has(cur) ? null : cur));

  setTasks((prev) => {
    const remaining = prev.filter((t) => !removed.has(t.id));

    const cleared = remaining.map((t) => {
      const deps = depsToArray((t as any).dependsOn);
      if (!deps.length) return t;

      const nextDeps = deps.filter((d) => !removed.has(d));
      if (nextDeps.length === deps.length) return t;

      return { ...t, dependsOn: nextDeps.length ? nextDeps : null };
    });

    return enforceFinishToStartDependencies(cleared);
  });
}

function deleteTask(taskId: string) {
  deleteTasks([taskId]);
}



  function deleteGroupAndItsTasks(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setTasks((prev) => {
      const removedIds = new Set(prev.filter((t) => t.groupId === groupId).map((t) => t.id));
      const remaining = prev.filter((t) => t.groupId !== groupId);
      const cleared = remaining.map((t) => {
        const deps = depsToArray((t as any).dependsOn);
        if (!deps.length) return t;
        const nextDeps = deps.filter((d) => !removedIds.has(d));
        if (nextDeps.length === deps.length) return t;
        return { ...t, dependsOn: nextDeps.length ? nextDeps : null };
      });
      return enforceFinishToStartDependencies(cleared);
    });
  }

  function addTaskToGroup(groupId: string) {
    setTasks((prev) => {
      const list = prev
        .filter((t) => t.groupId === groupId)
        .slice()
        .sort((a, b) => toDate(a.due).getTime() - toDate(b.due).getTime());

      const maxOrder = Math.max(0, ...list.map((t) => (typeof t.rowOrder === "number" ? t.rowOrder : 0))) + 1;
      const baseStart = list.length ? nextBusinessDay(toDate(list[list.length - 1].due)) : nextBusinessDay(noonToday());


     // AFTER (inside addTaskToGroup)
const t: Task = {
  id: newId("t"),
  groupId,
  name: "New task",
  rowOrder: maxOrder,
  quotedHours: 0,
  actualHours: 0,
  assignee: "Max",
  status: "Not Started",
  start: toISODate(baseStart),
  due: toISODate(addBusinessDaysFrom(baseStart, 1)),

  dependsOn: list.length ? [list[list.length - 1].id] : null,
};

      return enforceFinishToStartDependencies([...prev, t]);
    });
  }

  function addGroup() {
    const gid = newId("g");
    setGroups((prev) => [...prev, { id: gid, name: `Group ${prev.length + 1}`, collapsed: false }]);

    setTasks((prev) => {
      const allDues = prev.map((t) => toDate(t.due));
      const base = allDues.length
        ? addDays(allDues.reduce((a, b) => (a > b ? a : b), allDues[0]), 1)
        : noonToday();

      const newTasks: Task[] = TEMPLATE_TASKS.map((tpl, i) => {
        const start = addDays(base, i * 2);
        const due = addDays(start, 1);
        return {
          id: newId("t"),
          groupId: gid,
          rowOrder: i + 1,
          name: tpl.name,
          quotedHours: tpl.quotedHours,
          actualHours: tpl.actualHours,
          assignee: tpl.assignee,
          status: tpl.status,
          start: toISODate(start),
          due: toISODate(due),
          dependsOn: null,
        };
      });

// AFTER (inside addGroup)
const chained = newTasks.map((t, i) => (i === 0 ? { ...t, dependsOn: null } : { ...t, dependsOn: [newTasks[i - 1].id] }));
      return enforceFinishToStartDependencies([...prev, ...chained]);
    });
  }

  function publishVersion() {
    const createdAt = Date.now();
    const label = nextVersionLabel(versions);
    const snap: TimelineVersion = {
      id: newId("v"),
      label,
      createdAt,
      groups: groups.map((g) => ({ ...g })),
      tasks: tasks.map((t) => ({ ...t })),
    };
    const next = [snap, ...versions];
    setVersions(next);
    saveVersionsToStorage(next);
    setActiveVersionId(snap.id);
    setVersionsOpen(true);
  }

  function loadVersionToEditor(v: TimelineVersion) {
    setGroups(v.groups.map((g) => ({ ...g })));
    const normalized = normalizeRowOrder(v.groups, v.tasks.map((t) => ({ ...t })));
    setTasks(normalized);

    const r = computeTaskMinMax(normalized);
    setRangeAnchor({
      start: addDays(r.minStart, -RANGE_PAD_DAYS),
      end: addDays(r.maxDue, RANGE_PAD_DAYS),
    });

    setVersionsOpen(false);
  }

  const nextPublish = useMemo(() => nextVersionLabel(versions), [versions]);
  const activeVersion = useMemo(() => {
    if (!versions.length) return null;
    const id = activeVersionId ?? versions[0]?.id;
    return versions.find((v) => v.id === id) ?? versions[0];
  }, [versions, activeVersionId]);

  function onGroupDrop(targetGroupId: string) {
    if (!dragGroupId || dragGroupId === targetGroupId) return;
    setGroups((prev) => {
      const fromIdx = prev.findIndex((g) => g.id === dragGroupId);
      const toIdx = prev.findIndex((g) => g.id === targetGroupId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const copy = prev.slice();
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
    setDragGroupId(null);
    setDragOverGroupId(null);
  }

  function renderDaysLeft(task: Task) {
    const today = noonToday();
    const due = toDate(task.due);
    const diff = businessDaysDiff(today, due);

    if (diff === 0) return { label: "Due", hint: `Due ${formatShortDate(due)}`, state: "due" as const };
    if (diff < 0) return { label: `Over ${Math.abs(diff)}d`, hint: `Overdue since ${formatShortDate(due)}`, state: "over" as const };
    return { label: `${diff}d`, hint: `Due ${formatShortDate(due)}`, state: "ok" as const };
  }

  function goToToday() {
    const sc = scrollRef.current;
    if (!sc) return;
    const idx = clamp(dayIndex(timelineStart, noonToday()), 0, days.length - 1);
    const x = idx * cellW;
    sc.scrollTo({ left: Math.max(0, x - sc.clientWidth * 0.25), behavior: "smooth" });
  }

  // Keep group sticky row offset in sync with the real header height
  useEffect(() => {
    const el = headerRowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setStickyHeaderH((prev) => (prev === h ? prev : h));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hideDetails, zoomPreset, depMode]);

  // ------------------- Drag move / resize helpers -------------------
  function withDragUX(cursor: string, fn: () => void) {
    document.body.style.userSelect = "none";
    document.body.style.cursor = cursor;
    fn();
  }

function beginMoveTask(taskId: string, e: React.PointerEvent) {
  if (dragResizeTaskId) return;
  if (linkFromId) return;
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;

    withDragUX("grabbing", () => {
      dragMoveRef.current = { taskId, startX: e.clientX, baseStart: toDate(t.start), baseDue: toDate(t.due), lastDelta: 0 };
      setDragMoveTaskId(taskId);
    });
  }

function beginMoveGroup(groupId: string, e: React.PointerEvent) {
  if (dragResizeTaskId) return;
  if (dragMoveTaskId) return;
  if (linkFromId) return;

    const groupTasks = tasks.filter((t) => t.groupId === groupId);
    if (!groupTasks.length) return;

    const base = new Map<string, { start: Date; due: Date }>();
    for (const t of groupTasks) base.set(t.id, { start: toDate(t.start), due: toDate(t.due) });

    withDragUX("grabbing", () => {
      dragMoveGroupRef.current = { groupId, startX: e.clientX, base, lastDelta: 0 };
      setDragMoveGroupId(groupId);
    });
  }

  function beginResizeTask(taskId: string, edge: "start" | "due", e: React.PointerEvent) {
  if (dragMoveTaskId) {
    dragMoveRef.current = null;
    setDragMoveTaskId(null);
    }
 if (linkFromId) return;

    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;

    withDragUX("ew-resize", () => {
      dragResizeRef.current = { taskId, edge, startX: e.clientX, baseStart: toDate(t.start), baseDue: toDate(t.due), lastDelta: 0 };
      setDragResizeTaskId(taskId);
    });
  }

  // Begin drag-to-link dependency (Finish-to-Start)
  function beginEditDependency(taskId: string, e: React.PointerEvent) {
    if (linkFromId) return;
    // prevent accidental bar move/resize while starting dependency link
    e.preventDefault();
    e.stopPropagation();
    cancelAnyDrag();

    setLinkFromId(taskId);

    const layer = depLayerRef.current;
    if (layer) {
      const r = layer.getBoundingClientRect();
      setLinkCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    } else {
      setLinkCursor(null);
    }

    setLinkHoverToId(null);
  }


  // 6) Splitter drag (resizable TASK col)
  const beginResizePanel = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    panelResizeRef.current = { startX: e.clientX, startW: taskColW };

    const onMove = (ev: PointerEvent) => {
      if (!panelResizeRef.current) return;
      const dx = ev.clientX - panelResizeRef.current.startX;
      setTaskColW(clamp(panelResizeRef.current.startW + dx, 200, 560));
    };

    const onUp = () => {
      panelResizeRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
  };

  // ------------------- Dependencies (drag to link/unlink) -------------------
 function wouldCreateCycle(predecessorId: string, successorId: string) {
  const tasksNow = tasksRef.current;

  const succ = new Map<string, string[]>();
  for (const t of tasksNow) {
    const deps = depsToArray((t as any).dependsOn);
    for (const d of deps) {
      const arr = succ.get(d) ?? [];
      arr.push(t.id);
      succ.set(d, arr);
    }
  }

  const stack = [successorId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === predecessorId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const nxt = succ.get(cur) ?? [];
    for (const k of nxt) stack.push(k);
  }

  return false;
}



useEffect(() => {
  if (!linkFromId) return;

  const layer = depLayerRef.current;

  const onMove = (ev: PointerEvent) => {
    if (!layer) return;
    ev.preventDefault();

    const r = layer.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    setLinkCursor({ x, y });

    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;

    // ✅ Drop target is the BAR itself (this becomes the PREDECESSOR)
    const barEl = el?.closest?.("[data-task-bar]") as HTMLElement | null;
    const candPredId = barEl?.dataset?.taskBar ?? null;

    if (!candPredId || candPredId === linkFromId) {
      setLinkHoverToId(null);
      return;
    }

    // ✅ new edge would be: candPredId -> linkFromId
    if (wouldCreateCycle(candPredId, linkFromId)) {
      setLinkHoverToId(null);
      return;
    }

    setLinkHoverToId(candPredId);
  };

  const onUp = (ev: PointerEvent) => {
    const successorId = linkFromId;

    // ✅ Determine what we're actually releasing on (PREDECESSOR bar)
    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
    const barEl = el?.closest?.("[data-task-bar]") as HTMLElement | null;
    const dropPredId = barEl?.dataset?.taskBar ?? null;

    if (
      successorId &&
      dropPredId &&
      dropPredId !== successorId &&
      !wouldCreateCycle(dropPredId, successorId)
    ) {
      // ✅ Finish-to-Start: SUCCESSOR depends on PREDECESSOR
      const successorTask = tasksRef.current.find((t) => t.id === successorId);
      const cur = depsToArray((successorTask as any)?.dependsOn);
      const next = Array.from(new Set([...cur, dropPredId]));
      patchTask(successorId, { dependsOn: next.length ? next : null });
    } else if (successorId && !dropPredId) {
      // ✅ Dropped on empty space → clear this task’s dependencies
      patchTask(successorId, { dependsOn: null });
    }

    setLinkFromId(null);
    setLinkCursor(null);
    setLinkHoverToId(null);
  };

  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);

  return () => {
    window.removeEventListener("pointermove", onMove as any);
    window.removeEventListener("pointerup", onUp as any);
  };
}, [linkFromId]);






  useEffect(() => {
    if (!dragMoveTaskId) return;

    const onMove = (ev: PointerEvent) => {
      const st = dragMoveRef.current;
      if (!st) return;
      ev.preventDefault();
      const dx = ev.clientX - st.startX;
      const deltaDays = Math.round(dx / cellW);
      if (deltaDays === st.lastDelta) return;

      const newStart = addDays(st.baseStart, deltaDays);
      const newDue = addDays(st.baseDue, deltaDays);

      st.lastDelta = deltaDays;
      patchTask(st.taskId, { start: toISODate(newStart), due: toISODate(newDue) });
    };

    const onUp = () => {
      dragMoveRef.current = null;
      setDragMoveTaskId(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove as any);
      window.removeEventListener("pointerup", onUp as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragMoveTaskId, cellW]);

  useEffect(() => {
    if (!dragMoveGroupId) return;

    const onMove = (ev: PointerEvent) => {
      const st = dragMoveGroupRef.current;
      if (!st) return;
      ev.preventDefault();

      const dx = ev.clientX - st.startX;
      const deltaDays = Math.round(dx / cellW);
      if (deltaDays === st.lastDelta) return;

      st.lastDelta = deltaDays;

      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.groupId !== st.groupId) return t;
          const base = st.base.get(t.id);
          if (!base) return t;
          const ns = addDays(base.start, deltaDays);
          const nd = addDays(base.due, deltaDays);
          return { ...t, start: toISODate(ns), due: toISODate(nd) };
        });
        return enforceFinishToStartDependencies(updated);
      });
    };

    const onUp = () => {
      dragMoveGroupRef.current = null;
      setDragMoveGroupId(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove as any);
      window.removeEventListener("pointerup", onUp as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragMoveGroupId, cellW]);

  useEffect(() => {
    if (!dragResizeTaskId) return;

    const onMove = (ev: PointerEvent) => {
      const st = dragResizeRef.current;
      if (!st) return;
      ev.preventDefault();

      const dx = ev.clientX - st.startX;
      const deltaDays = Math.round(dx / cellW);
      if (deltaDays === st.lastDelta) return;

      st.lastDelta = deltaDays;

      if (st.edge === "start") {
        let newStart = addDays(st.baseStart, deltaDays);
        const fixedDue = st.baseDue;
        if (newStart > fixedDue) newStart = fixedDue;
        patchTask(st.taskId, { start: toISODate(newStart), due: toISODate(fixedDue) });
      } else {
        const fixedStart = st.baseStart;
        let newDue = addDays(st.baseDue, deltaDays);
        if (newDue < fixedStart) newDue = fixedStart;
        patchTask(st.taskId, { start: toISODate(fixedStart), due: toISODate(newDue) });
      }
    };

    const onUp = () => {
      dragResizeRef.current = null;
      setDragResizeTaskId(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove as any);
      window.removeEventListener("pointerup", onUp as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragResizeTaskId, cellW]);

  const linkPreview = useMemo(() => {
  if (!linkFromId || !linkCursor) return null;

  const from = tasks.find((x) => x.id === linkFromId);
  if (!from) return null;

  const yMid = rowLayout.taskY.get(linkFromId);
  if (typeof yMid !== "number") return null;

  const startY = clamp(yMid, 0, rowLayout.totalH);
  const endY = clamp(linkCursor.y, 0, rowLayout.totalH);

  // ---- FROM bar geometry (match TaskBar) ----
  const fromStartIdx = clamp(dayIndex(timelineStart, toDate(from.start)), 0, days.length - 1);
  const fromBarLeft = fromStartIdx * cellW + BAR_PAD;

  // ✅ Start from the LEFT dependency dot center (dot is outside the bar)
  // DOT_CENTER_INSET is already -10 in your file, which matches your dot placement.
  const startX = clamp(fromBarLeft + DOT_CENTER_INSET, 0, timelineW);

  const endX = clamp(linkCursor.x, 0, timelineW);

  // ✅ Route DOWN (or UP) first, then across — so it "comes out downward" immediately
  const laneY = clamp(
    endY >= startY ? startY + TASK_ROW_H / 2 - 4 : startY - TASK_ROW_H / 2 + 4,
    0,
    rowLayout.totalH
  );

  const d = `M ${startX} ${startY} V ${laneY} H ${endX} V ${endY}`;

  return { active: true, d, fromX: startX, fromY: startY, toX: endX, toY: endY };
}, [
  linkFromId,
  linkCursor,
  tasks,
  rowLayout.taskY,
  rowLayout.totalH,
  timelineStart,
  days.length,
  cellW,
  timelineW,
  TASK_ROW_H,
]);






    const deleteGroupOpen = Boolean(deleteGroupId);
  const groupToDelete = deleteGroupId ? groups.find((g) => g.id === deleteGroupId) ?? null : null;

  const editDatesOpen = Boolean(editDatesTaskId);
  const taskToEditDates = editDatesTaskId ? tasks.find((t) => t.id === editDatesTaskId) ?? null : null;
// ✅ Task options dialog (settings-style)
const taskOptionsOpen = Boolean(taskOptionsTaskId);
const taskToOptions = taskOptionsTaskId ? tasks.find((t) => t.id === taskOptionsTaskId) ?? null : null;
const groupToOptions = taskToOptions ? groups.find((g) => g.id === taskToOptions.groupId) ?? null : null;
 const showDepOverlay =
  depMode === "always" ||
  (depMode === "hover" && (hoverTaskId || hoverGroupId || linkFromId)) ||
  Boolean(linkFromId);

  const depDotsEnabled = depMode !== "off";

  return (
  <div
    ref={fullscreenRef}
    className="chatshell-roadmap w-full overflow-hidden"
    style={{ height: isFullscreen ? "100vh" : `calc(100vh - ${APP_TOPBAR_H}px)` }}
  >
    <Card className="w-full h-full flex flex-col rounded-2xl border-0 shadow-none bg-[var(--bg)] text-[var(--text)]">

        {/* ---------------- Header (3 rows) ---------------- */}
        <CardHeader className="pb-2 px-4 pt-4 md:px-6">
  {/* Row 1: Title */}
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <CardTitle className="text-2xl truncate">Project timeline</CardTitle>
    </div>
  </div>

  {/* Row 2: Meta (left) + Saved (right) */}
  <div className="mt-1 flex items-center justify-between gap-4">
    <div className="text-sm text-[var(--muted)]">
      Always editable · Auto-saves · Days left excludes Sat/Sun
    </div>

    <div className="text-sm text-[var(--muted)] shrink-0">
      {savedAt
        ? `Saved ${new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(savedAt))}`
        : "Not saved"}
    </div>
  </div>
</CardHeader>


        {/* ---------------- Body ---------------- */}
        <CardContent className="p-0 min-w-0 flex-1 overflow-hidden">
          <div className="w-full min-w-0 rounded-2xl overflow-hidden bg-[var(--bg)] flex flex-col h-full">
            <div ref={scrollRef} className="flex-1 w-full min-w-0 overflow-auto overscroll-contain">
              <div className="min-w-full relative" style={{ minWidth: leftW + SPLIT_W + timelineW }}>
  {/* ✅ Today line for the BODY (does NOT go over left panel) */}
  {showTodayLine && (
    <div
      className="absolute pointer-events-none"
      style={{
        // start under the sticky header area (header has its own Today line)
        top: stickyHeaderH,
        left: timelineLeftX + todayX - 1, // ✅ key: offset by left panel width
        width: 2,
        height: rowLayout.totalH,
        background: "#EF4444",
        zIndex: 180, // above bars if needed, but still doesn't touch left because of the left offset
      }}
      aria-hidden
    />
  )}

  <div
    ref={headerRowRef}
    className="relative z-[500] bg-[var(--bg)] border-b border-b-[0.5px] border-[var(--border)] shadow-sm"
  >
   {/* Row A: stays pinned to TOP and LEFT (viewport toolbar) */}
  <div
    className="sticky top-0 left-0 z-[700] h-11 border-b border-b-[0.5px] border-[var(--border)] bg-[var(--bg)]"
    style={{ width: viewportW ? viewportW : "100vw" }}
  >
    <div className="h-11 w-full flex items-center justify-between gap-3 px-2">
      {/* LEFT: Project + Range (same row as toolbar) */}
      <div className="min-w-0 text-sm text-[var(--muted)]">
        <div className="truncate">
          Project: <b className="text-[var(--text)]">UOB Explainer Video</b> · Range:{" "}
          <b className="text-[var(--text)]">{formatShortDate(taskRange.minStart)}</b> →{" "}
          <b className="text-[var(--text)]">{formatShortDate(taskRange.maxDue)}</b>
        </div>
      </div>

      {/* RIGHT: Buttons */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <Button
          variant="outline"
          className={cn("h-9 rounded-xl px-3", BTN_SOFT, BTN_TINT_INDIGO)}
          onClick={() => setVersionsOpen(true)}
          title="Versions"
        >
          <Layers className="mr-2 h-4 w-4" />
          Versions
        </Button>

        <Button
          variant="outline"
          className={cn("h-9 rounded-xl px-3", BTN_SOFT, BTN_TINT_EMERALD)}
          onClick={publishVersion}
          title="Publish snapshot"
        >
          Publish {nextPublish}
        </Button>

        <div className={cn("h-9 inline-flex items-center gap-2 rounded-xl px-3", BTN_SOFT)}>
  <span className="text-xs text-[var(--muted)]">Auto rows (A)</span>
  <Switch checked={autoRows} onCheckedChange={(v) => onToggleRowArrangement(v)} />
</div>

<Button
  variant="outline"
  className={cn("h-9 w-9 rounded-xl p-0", BTN_SOFT_ICON)}
  onClick={() => setColsCollapsed((v) => !v)}
  title={colsCollapsed ? "Expand task columns" : "Collapse task columns"}
>
  {colsCollapsed ? (
    <ChevronRight className="h-4 w-4 text-[var(--text2)]" />
  ) : (
    <ChevronLeft className="h-4 w-4 text-[var(--text2)]" />
  )}
</Button>

<Button
  variant="outline"
  className={cn("h-9 w-9 rounded-xl p-0", BTN_SOFT_ICON)}
  onClick={() => setZoomPreset((z) => zoomInPreset(z))}
  disabled={!canZoomIn}
  title={`Zoom in → ${ZOOM_LABEL[zoomInPreset(zoomPreset)]}`}
>
  <ZoomIn className="h-4 w-4 text-[var(--text2)]" />
</Button>


        <Button
          variant="outline"
          className={cn("h-9 rounded-xl px-3", BTN_SOFT, BTN_TINT_SKY)}
          onClick={goToToday}
          title="Today"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Today
        </Button>

        <Button
          variant="outline"
          className={cn("h-9 w-9 rounded-xl p-0", BTN_SOFT_ICON)}
          onClick={() => setZoomPreset((z) => zoomOutPreset(z))}
          disabled={!canZoomOut}
          title={`Zoom out → ${ZOOM_LABEL[zoomOutPreset(zoomPreset)]}`}
        >
          <ZoomOut className="h-4 w-4 text-[var(--text2)]" />
        </Button>

        <Button
          variant="outline"
          className={cn("h-9 w-9 rounded-xl p-0", BTN_SOFT_ICON)}
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-[var(--text2)]" />
          ) : (
            <Maximize2 className="h-4 w-4 text-[var(--text2)]" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn("h-9 w-9 rounded-xl p-0", BTN_SOFT_ICON)}
              title="More"
            >
              <MoreHorizontal className="h-4 w-4 text-[var(--text2)]" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className={cn("w-72", POPUP_SURFACE)}>
            <DropdownMenuLabel className="text-xs text-[var(--muted)]">Views</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[var(--border)]" />

            <DropdownMenuItem
              className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
              onSelect={(e) => {
                e.preventDefault();
                setHideCompleted((v) => !v);
              }}
            >
              {hideCompleted ? "Show completed" : "Hide completed"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
              onSelect={(e) => {
                e.preventDefault();
                setHideDetails((v) => !v);
              }}
            >
              {hideDetails ? "Switch to Detail" : "Switch to Compact"}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[var(--border)]" />
            <DropdownMenuLabel className="text-xs text-[var(--muted)]">Assignee filter</DropdownMenuLabel>

            <DropdownMenuItem
              className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
              onSelect={(e) => {
                e.preventDefault();
                setAssigneeFilter("All");
              }}
            >
              All assignees
            </DropdownMenuItem>

            {ASSIGNEES.map((a) => (
              <DropdownMenuItem
                key={a}
                className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
                onSelect={(e) => {
                  e.preventDefault();
                  setAssigneeFilter(a);
                }}
              >
                {a}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-[var(--border)]" />
            <DropdownMenuLabel className="text-xs text-[var(--muted)]">Dependencies</DropdownMenuLabel>

            {(["off", "hover", "always"] as const).map((m) => (
              <DropdownMenuItem
                key={m}
                className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
                onSelect={(e) => {
                  e.preventDefault();
                  setDepMode(m);
                }}
              >
                {m === "off" ? "Deps: Off" : m === "hover" ? "Deps: On hover" : "Deps: Always"}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-[var(--border)]" />
            <DropdownMenuLabel className="text-xs text-[var(--muted)]">Quick actions</DropdownMenuLabel>

            <DropdownMenuItem
              className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
              onSelect={(e) => {
                e.preventDefault();
                setVersionsOpen(true);
              }}
            >
              Open Versions
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-[var(--text)] focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)]"
              onSelect={(e) => {
                e.preventDefault();
                forceSaveNow();
              }}
            >
              Save now
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* ✅ THIS WAS MISSING */}
  </div>

  {/* Row B + C: months + days header (sticky under Row A, BUT still horizontally scrolls with content) */}
  <div className="sticky top-[44px] z-[650] bg-[var(--bg)]">

    <div
      className="grid"
      style={{ gridTemplateColumns: `${leftW}px ${SPLIT_W}px ${timelineW}px` }}
    >
                    {/* LEFT HEADER STACK */}
                    <div className={cn("sticky left-0 z-[550] bg-[var(--bg)] border-r border-r-[0.5px] border-[var(--border)]")}>
                      <div className="flex flex-col">
                        {/* Row B (month-row height): New group + Collapse/Expand (inside grid) */}
                        <div className={cn("h-9 border-b border-b-[0.5px] border-[var(--border)] flex items-center justify-between gap-2 px-3 py-1")}>
                          <Button
                            variant="outline"
                            className={cn("h-7 rounded-xl px-3 text-xs", BTN_SOFT)}
                            onClick={addGroup}
                            title="New group"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New group
                          </Button>

                          <Button
  variant="outline"
  className={cn("h-7 w-7 rounded-xl p-0 shrink-0", BTN_SOFT_ICON)}
  onClick={() => setColsCollapsed((v) => !v)}
  title={colsCollapsed ? "Expand columns" : "Collapse columns"}
>
  {colsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
</Button>

                        </div>

                        {/* Row C (day-row height): column labels */}
                       <div
  className="grid h-10 items-center px-3 text-xs text-[var(--muted)]"
  style={{ gridTemplateColumns: leftGridTemplate }}
>
  <div className="text-center">No</div>
  <div>Task name</div>

  {!colsCollapsed && (
    hideDetails ? (
      <>
        <div>Assignee</div>
        <div>Days left</div>
        <div className="text-right pr-2">Actions</div>
      </>
    ) : (
      <>
        <div className="text-right pr-2">Quoted</div>
        <div className="text-right pr-2">Actual</div>
        <div>Assignee</div>
        <div>Days left</div>
        <div>Status</div>
        <div className="text-right pr-2">Actions</div>
      </>
    )
  )}
</div>

                      </div>
                    </div>

                    {/* SPLITTER HEADER STACK (resize handle only) */}
                    <div className={cn("sticky z-[560] bg-[var(--bg)] border-r border-r-[0.5px] border-[var(--border)]")} style={{ left: leftW }}>
                      <div className="flex flex-col">
                        {/* Row B spacer — keep height aligned with TimelineHeader month row */}
                        <div className={cn("h-9 border-b border-b-[0.5px] border-[var(--border)]")} />

                        {/* Row C (day row): resizer handle */}
                        <div className="h-10">
                          <div
                            className="h-full w-full cursor-col-resize hover:bg-[var(--hover)] active:bg-[var(--active)]"
                            onPointerDown={beginResizePanel}
                            title="Drag to resize left panel"
                          />
                        </div>
                      </div>
                    </div>

                    {/* TIMELINE HEADER STACK (months + days only) */}
                    <div className="relative bg-[var(--panel)]">
                      <TimelineHeader
                        days={days}
                        cellW={cellW}
                        showMonths
                        todayIdx={todayIdx}
                        zoomPreset={zoomPreset}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {/* Today line body */}
                  <div
  className="absolute top-0 pointer-events-none"
  style={{
    left: timelineLeftX,
    width: timelineW,
    height: rowLayout.totalH,
    zIndex: 430, // ✅ above group row (420), still below left panel (440+)
    overflow: "hidden",
  }}
  aria-hidden
>
  {showTodayLine && <TodayLine x={todayX} height="100%" zIndex={430} />}
</div>


                  {/* dependency layer base rect */}
                  <div
                    ref={depLayerRef}
                    className="absolute top-0 pointer-events-none"
                    style={{ left: timelineLeftX, width: timelineW, height: rowLayout.totalH, zIndex: 130 }}
                  />

{linkPreview?.active && (
  <svg
    className="absolute top-0 pointer-events-none"
    style={{ left: timelineLeftX, width: timelineW, height: rowLayout.totalH, zIndex: 210 }}
  >
    <path d={linkPreview.d} stroke="#111" strokeWidth={3} fill="none" />
    <circle cx={linkPreview.fromX} cy={linkPreview.fromY} r={4} fill="#111" />
    <circle cx={linkPreview.toX} cy={linkPreview.toY} r={4} fill="#111" />
  </svg>
)}


                  {showDepOverlay && depMode !== "off" && (
  <DependencyOverlay
    tasks={filteredTasks}
    groups={groups}
    taskY={rowLayout.taskY}
    totalH={rowLayout.totalH}
    rangeStart={timelineStart}
    days={days}
    cellW={cellW}
    leftX={timelineLeftX}
    timelineW={timelineW}
    taskRowH={TASK_ROW_H} // ✅ NEW (this creates the “lane”)
  />
)}
{/* ✅ PATCH 5 — Leaves row under headers (before groups) */}
<LeavesSectionRow
  leaves={leavesInRange}
  expanded={leavesExpanded}
  onToggleExpanded={() => setLeavesExpanded((v) => !v)}
  visibleLimit={LEAVES_VISIBLE_LIMIT}
  colsCollapsed={colsCollapsed}
  hideDetails={hideDetails}
  leftGridTemplate={leftGridTemplate}
  leftW={leftW}
  splitW={SPLIT_W}
  timelineW={timelineW}
  rangeStart={timelineStart}
  days={days}
  cellW={cellW}
  todayIdx={todayIdx}
  zoomPreset={zoomPreset}
  taskRowH={TASK_ROW_H}
  sectionH={LEAVES_ROW_H}
/>

                  {rows.map((r, rowIdx) => {
                    const rowH = r.kind === "group" ? GROUP_ROW_H : TASK_ROW_H;
                    const key =
                      r.kind === "task" ? `t-${r.task.id}` : r.kind === "group" ? `g-${r.group.id}` : `add-${r.group.id}`;

                    const isGroupRow = r.kind === "group";
                    const groupIdForDnD = r.kind === "group" ? r.group.id : null;

                    const isHoveredTask = r.kind === "task" && hoverTaskId === r.task.id;
const isSelectedTask = r.kind === "task" && selectedTaskSet.has(r.task.id);
                    const isHoveredGroup = r.kind === "group" && hoverGroupId === r.group.id;

                    return (
                      <div
  key={key}
  className={cn(
    "border-t border-[var(--border)]",
    isGroupRow && "bg-[var(--panel)]" // ✅ no sticky here
  )}
                        onMouseEnter={() => {
                          if (r.kind === "task") setHoverTaskId(r.task.id);
                          if (r.kind === "group") setHoverGroupId(r.group.id);
                        }}
                        onMouseLeave={() => {
                          if (r.kind === "task") setHoverTaskId((cur) => (cur === r.task.id ? null : cur));
                          if (r.kind === "group") setHoverGroupId((cur) => (cur === r.group.id ? null : cur));
                        }}
                      >
                        <div className="grid" style={{ gridTemplateColumns: `${leftW}px ${SPLIT_W}px ${timelineW}px` }}>
                          {/* LEFT */}
                          <div
  className={cn(
    "sticky left-0 border-r border-r-[0.5px] border-[var(--border)] overflow-hidden relative",
    isGroupRow ? "z-[440] bg-[var(--panel)]" : "z-[320] bg-[var(--bg)]",
    groupIdForDnD && dragOverGroupId === groupIdForDnD && "bg-[var(--panel)]"
  )}
  style={{ height: rowH }}
  onDoubleClick={(e) => {
    if (r.kind !== "task") return;

    const el = e.target as HTMLElement | null;
    if (el?.closest?.("input,button,[role='combobox'],[data-resize-handle],[data-dep-role]")) return;

    e.preventDefault();
    e.stopPropagation();
    cancelAnyDrag();
    openTaskOptions(r.task.id);
  }}
  onDragOver={(e) => {
    if (!dragGroupId || !groupIdForDnD) return;
    e.preventDefault();
    setDragOverGroupId(groupIdForDnD);
  }}
  onDrop={(e) => {
    if (!groupIdForDnD) return;
    e.preventDefault();
    onGroupDrop(groupIdForDnD);
  }}
>
  {/* ✅ FIX: make Group rows fully opaque so timeline grid can't bleed through */}
  {isGroupRow && (
    <>
      <div aria-hidden className="absolute inset-0 pointer-events-none bg-[var(--bg)]" />
      <div aria-hidden className="absolute inset-0 pointer-events-none bg-[var(--panel)]" />
    </>
  )}

  {/* ✅ LEFT row hover wash (same tint as timeline) */}
  {r.kind === "task" && isHoveredTask && (
    <div
      aria-hidden
      className={cn("absolute inset-0 pointer-events-none z-0", ROW_HOVER_OVERLAY)}
    />
  )}

  <div
    className="relative z-10 grid items-center h-full px-3"
    style={{ gridTemplateColumns: leftGridTemplate }}
  >
                             {r.kind === "group" && (
  <>
    {/* Column 1: No */}
    <div className="flex items-center justify-center">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-8 w-8 rounded-full p-0 cursor-grab active:cursor-grabbing",
          BTN_SOFT_ICON,
          dragGroupId === r.group.id && "opacity-60"
        )}
        draggable
        onDragStart={(e) => {
          setDragGroupId(r.group.id);
          e.dataTransfer.effectAllowed = "move";
          try {
            e.dataTransfer.setData("text/plain", r.group.id);
          } catch {}
        }}
        onDragEnd={() => {
          setDragGroupId(null);
          setDragOverGroupId(null);
        }}
        title="Drag to reorder group"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </div>

    {/* Column 2: Task name (also holds delete button when collapsed) */}
    <div className="min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          type="button"
          variant="outline"
          className={cn("h-8 w-8 rounded-full p-0 shrink-0", BTN_SOFT_ICON)}
          onClick={() => patchGroup(r.group.id, { collapsed: !r.group.collapsed })}
          title={r.group.collapsed ? "Expand group" : "Collapse group"}
        >
          {r.group.collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        <Input
          value={r.group.name}
          onChange={(e) => patchGroup(r.group.id, { name: e.target.value })}
          className={cn("rounded-full flex-1 min-w-0", INPUT_TITLE, hideDetails ? "h-8" : "h-9")}
        />

        <Badge variant="secondary" className="rounded-full shrink-0">
          {(tasksByGroup.get(r.group.id)?.length ?? 0)} tasks
        </Badge>

        {colsCollapsed && (
          <Button
            type="button"
            variant="outline"
            className={cn(
              hideDetails ? "h-8 w-8" : "h-9 w-9",
              "rounded-xl p-0 shrink-0",
              BTN_SOFT_ICON,
              BTN_TINT_ROSE
            )}
            onClick={() => setDeleteGroupId(r.group.id)}
            title="Delete group"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>

    {/* Only render the extra columns when NOT collapsed */}
    {!colsCollapsed &&
      (hideDetails ? (
        <>
          <div />
          <div />
        </>
      ) : (
        <>
          <div />
          <div />
          <div />
          <div />
          <div />
        </>
      ))}

    {!colsCollapsed && (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className={cn(
            hideDetails ? "h-8 w-8" : "h-9 w-9",
            "rounded-xl p-0",
            BTN_SOFT_ICON,
            BTN_TINT_ROSE
          )}
          onClick={() => setDeleteGroupId(r.group.id)}
          title="Delete group"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}
  </>
)}


                              {r.kind === "task" && (
                                colsCollapsed ? (
                                  <>
                                    <div className="text-xs text-[var(--muted)] tabular-nums">{r.index}.</div>

                                    <div className="min-w-0">
                                      <Input
  ref={bindTaskNameInputRef(r.task.id)}
  value={r.task.name}
  onChange={(e) => patchTask(r.task.id, { name: e.target.value })}
  onKeyDown={(e) => handleTaskNameKeyDown(e, r.task.id)}
  className={cn("w-full min-w-0", INPUT_TITLE, TASK_CTRL_H, TASK_CTRL_PAD, TASK_CTRL_ROUND)}
/>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs text-[var(--muted)] tabular-nums">{r.index}.</div>

                                    <div className="min-w-0">
                                      <Input
  ref={bindTaskNameInputRef(r.task.id)}
  value={r.task.name}
  onChange={(e) => patchTask(r.task.id, { name: e.target.value })}
  onKeyDown={(e) => handleTaskNameKeyDown(e, r.task.id)}
  className={cn("w-full min-w-0", INPUT_TITLE, TASK_CTRL_H, TASK_CTRL_PAD, TASK_CTRL_ROUND)}
/>
                                    </div>

                                    {!hideDetails && (
                                      <>
                                        <HoursCell
  value={r.task.quotedHours}
  onChange={(v) => patchTask(r.task.id, { quotedHours: v })}
  inputClassName={cn(TASK_CTRL_H, TASK_CTRL_PAD, TASK_CTRL_ROUND)}
/>
<HoursCell
  value={r.task.actualHours}
  onChange={(v) => patchTask(r.task.id, { actualHours: v })}
  inputClassName={cn(TASK_CTRL_H, TASK_CTRL_PAD, TASK_CTRL_ROUND)}
/>

                                      </>
                                    )}

                                    <div className="min-w-0">
  <Select value={r.task.assignee} onValueChange={(v: any) => patchTask(r.task.id, { assignee: v })}>
    <SelectTrigger className={cn("w-full", SELECT_SOFT, TASK_CTRL_H, TASK_CTRL_PAD, TASK_CTRL_ROUND)}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {ASSIGNEES.map((a) => (
        <SelectItem key={a} value={a}>
          {a}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{(() => {
  const info = renderDaysLeft(r.task);
  const variant = info.state === "over" ? "destructive" : info.state === "due" ? "secondary" : "outline";
  return (
    <div className="flex items-center" title={info.hint}>
      <Badge
        variant={variant as any}
        className={cn(TASK_CTRL_ROUND, "whitespace-nowrap", TASK_BADGE)}
      >
        {info.label}
      </Badge>
    </div>
  );
})()}

{!hideDetails && (
  <div className="min-w-0">
    <Select value={r.task.status} onValueChange={(v: any) => patchTask(r.task.id, { status: v })}>
      <SelectTrigger className={cn("w-full", SELECT_SOFT, TASK_CTRL_H, TASK_CTRL_PAD, TASK_CTRL_ROUND)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}


                                    <div className="flex items-center justify-end gap-2">

                                      {!hideDetails && (
                                        <>
                                         <Button
  type="button"
  variant="outline"
  className={cn(TASK_ICON_BTN, "rounded-xl p-0", BTN_SOFT_ICON, BTN_TINT_SKY)}
  onClick={() => openTaskOptions(r.task.id, "dates")}
  title="Edit Start/Due dates"
>
  <CalendarDays className={cn(TASK_ICON_SIZE)} />
</Button>

<Button
  type="button"
  variant="outline"
  className={cn(
    TASK_ICON_BTN,
    "rounded-xl p-0",
    BTN_SOFT_ICON,
    BTN_TINT_VIOLET,
    depsToArray((r.task as any).dependsOn).length > 0 && "ring-1 ring-violet-200/70"
  )}
  onClick={() => openTaskOptions(r.task.id, "dependencies")}
  title={depsToArray((r.task as any).dependsOn).length ? "Edit dependencies" : "Set dependencies"}
>
  <Link2 className={cn(TASK_ICON_SIZE)} />
</Button>

<Button
  type="button"
  variant="outline"
  className={cn(TASK_ICON_BTN, "rounded-xl p-0", BTN_SOFT_ICON, BTN_TINT_ROSE)}
  onClick={() => deleteTask(r.task.id)}
  title="Delete task"
>
  <Trash2 className={cn(TASK_ICON_SIZE)} />
</Button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )
                              )}

                             {r.kind === "add" && (
  colsCollapsed ? (
    <>
      <div />

      <div className="min-w-0">
        <Button
          type="button"
          variant="outline"
          className={cn(TASK_CTRL_ROUND, BTN_SOFT, TASK_CTRL_H, TASK_CTRL_PAD)}
          onClick={() => addTaskToGroup(r.group.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>
    </>
  ) : (
    <>
      <div />

      <div className="min-w-0">
        <Button
          type="button"
          variant="outline"
          className={cn(TASK_CTRL_ROUND, BTN_SOFT, TASK_CTRL_H, TASK_CTRL_PAD)}
          onClick={() => addTaskToGroup(r.group.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>

      {hideDetails ? (
        <>
          <div />
          <div />
        </>
      ) : (
        <>
          <div />
          <div />
          <div />
          <div />
          <div />
        </>
      )}

      <div />
    </>
  )
)}

                            </div>
                          </div>

                          {/* SPLITTER (sticky) */}
                          <div
  className={cn(
    "sticky bg-[var(--bg)] border-r border-r-[0.5px] border-[var(--border)]",
    isGroupRow ? "z-[450]" : "z-[330]"
  )}
  style={{ left: leftW, height: rowH }}
>


                            <div
                              className="h-full w-full cursor-col-resize hover:bg-[var(--hover)] active:bg-[var(--active)]"
                              onPointerDown={beginResizePanel}
                              title="Drag to resize left panel"
                            />
                          </div>

                         {/* TIMELINE */}
<div
  className={cn(
    "group/timeline relative overflow-hidden bg-[var(--bg)]",
    r.kind === "group" && "bg-[var(--panel)]",
    isHoveredTask && "bg-[var(--surface)]"
  )}
  style={{ height: rowH }}
>


  {r.kind === "group" ? (
    <GroupSpanBar
      rowH={GROUP_ROW_H}
      group={r.group}
      rangeStart={timelineStart}
      days={days}
      cellW={cellW}
      todayIdx={todayIdx}
      zoomPreset={zoomPreset}
      groupRange={groupRanges.get(r.group.id) ?? null}
      onBeginMoveGroup={beginMoveGroup}
    />
  ) : r.kind === "task" ? (
    <TaskBar
  rowH={TASK_ROW_H}
  task={r.task}
  rangeStart={timelineStart}
  days={days}
  cellW={cellW}
  todayIdx={todayIdx}
  zoomPreset={zoomPreset}
  highlight={
    isHoveredTask ||
    isSelectedTask ||
    linkFromId === r.task.id ||
    linkHoverToId === r.task.id
  }
  rowHighlight={
    isHoveredTask ||
    isSelectedTask ||
    linkFromId === r.task.id ||
    linkHoverToId === r.task.id ||
    dragMoveTaskId === r.task.id ||
    dragResizeTaskId === r.task.id
  }
  isSource={linkFromId === r.task.id}       // ✅ dragged task (FROM)
  isTarget={linkHoverToId === r.task.id}    // ✅ hovered drop target (TO)
  onBeginEdit={depDotsEnabled ? beginEditDependency : undefined}
  onBeginMove={beginMoveTask}
  onBeginResize={beginResizeTask}
  showDepDots={depDotsEnabled}
  onOpenColor={(id) => openTaskOptions(id, 'barColor')}
  onCancelDrag={cancelAnyDrag}
/>

  ) : (
    <div className="relative" style={{ height: TASK_ROW_H }}>
      <TimelineGrid
        days={days}
        cellW={cellW}
        rowH={TASK_ROW_H}
        idPrefix={`add-${r.group.id}-${rowIdx}`}
        todayIdx={todayIdx}
        zoomPreset={zoomPreset}
      />
    </div>
  )}
</div>

                        </div>
                      </div>
                    );
                  })}

                  <div className="grid" style={{ gridTemplateColumns: `${leftW}px ${SPLIT_W}px ${timelineW}px` }}>
                    <div className="sticky left-0 z-[320] bg-[var(--bg)] border-t border-t-[0.5px] border-r border-r-[0.5px] border-[var(--border)] overflow-hidden">
                      <div className="px-4 py-2 text-xs text-[var(--muted)]">
                        Project range: {formatShortDate(taskRange.minStart)} → {formatShortDate(taskRange.maxDue)} · Sat/Sun are gray.
                      </div>
                    </div>
                    <div className="sticky z-[330] bg-[var(--bg)] border-t border-t-[0.5px] border-r border-r-[0.5px] border-[var(--border)]" style={{ left: leftW }} />
                    <div className="bg-[var(--panel)] border-t border-t-[0.5px] border-[var(--border)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
        </CardContent>
      </Card>

      {/* Delete group confirm dialog */}
      <Dialog open={deleteGroupOpen} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <DialogContent className={cn("max-w-md", DIALOG_SURFACE)}>
          <DialogHeader>
            <DialogTitle>Delete group?</DialogTitle>
            <div className="text-sm text-[var(--muted)]">
              This will permanently delete <span className="font-medium">{groupToDelete?.name ?? "this group"}</span> and all tasks inside it.
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className={cn("rounded-xl", BTN_SOFT)}
              onClick={() => setDeleteGroupId(null)}
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              className={cn("rounded-xl", BTN_SOFT, BTN_TINT_ROSE)}
              onClick={() => {
                if (deleteGroupId) deleteGroupAndItsTasks(deleteGroupId);
                setDeleteGroupId(null);
              }}
            >
              Delete group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dates dialog */}
      <Dialog open={editDatesOpen} onOpenChange={(open) => !open && setEditDatesTaskId(null)}>
        <DialogContent className={cn("max-w-md", DIALOG_SURFACE)}>
          <DialogHeader>
            <DialogTitle>Edit dates</DialogTitle>
            <div className="text-sm text-[var(--muted)]">Adjust Start & Due. “Days left” auto-updates and excludes Sat/Sun.</div>
          </DialogHeader>
          {taskToEditDates ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">{taskToEditDates.name}</div>
              <div className="grid gap-2">
                <div className="text-xs text-[var(--muted)]">Start</div>
                <Input
                  type="date"
                  value={taskToEditDates.start}
                  onChange={(e) => patchTask(taskToEditDates.id, { start: e.target.value })}
                  className={cn("h-9 rounded-xl", INPUT_SOFT)}
                />
              </div>
              <div className="grid gap-2">
                <div className="text-xs text-[var(--muted)]">Due</div>
                <Input
                  type="date"
                  value={taskToEditDates.due}
                  onChange={(e) => patchTask(taskToEditDates.id, { due: e.target.value })}
                  className={cn("h-9 rounded-xl", INPUT_SOFT)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className={cn("rounded-full", BTN_SOFT)} onClick={() => setEditDatesTaskId(null)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)]">No task selected.</div>
          )}
        </DialogContent>
      </Dialog>

{/* ✅ Task options dialog (settings-style multi sections) */}
<Dialog open={taskOptionsOpen} onOpenChange={(open) => !open && closeTaskOptions()}>
  <DialogContent
    className={cn(
      "max-w-[1100px] w-[95vw] rounded-3xl p-0 overflow-hidden border",
      MODAL_SHELL
    )}
  >
    {/* Header (matches Settings modal style) */}
    <div className={cn("flex items-center justify-between border-b px-5 py-4", MODAL_BORDER)}>
      <div className="text-base font-semibold text-[var(--text)]">Task options</div>
      <button
        type="button"
        onClick={closeTaskOptions}
        className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--panel)] text-[var(--text2)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
        aria-label="Close"
        title="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    <div className="grid h-[min(70vh,680px)] min-h-0 grid-cols-[260px_1fr]">
      {/* LEFT NAV */}
      <div className={cn("min-h-0 overflow-y-auto border-r p-4", MODAL_LEFT_BG, MODAL_BORDER)}>
        <div className="space-y-2">
          {([
            { key: "general", label: "General", icon: Layers },
            { key: "barColor", label: "Bar color", icon: Palette },
            { key: "dates", label: "Dates", icon: CalendarDays },
            { key: "assignees", label: "Assignees", icon: Menu },
            { key: "costed", label: "Costed", icon: MoreHorizontal },
            { key: "dependencies", label: "Dependencies", icon: Link2 },
          ] as const).map((it) => {
            const active = taskOptionsTab === (it.key as any);
            const Icon = it.icon as any;
            return (
              <button
                key={it.key}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition",
                  active
                    ? "bg-[var(--active)] text-[var(--text)]"
                    : "text-[var(--text2)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                )}
                onClick={() => setTaskOptionsTab(it.key as any)}
              >
                <div
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl",
                    active ? "bg-[var(--active)]" : "bg-[var(--panel)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{it.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT */}
      <div className={cn("min-h-0 overflow-y-auto p-6 sm:p-8", MODAL_RIGHT_BG)}>
        <div className="space-y-1">
          <div className="text-3xl font-semibold tracking-tight text-[var(--text)]">
            {nameDraft || taskToOptions?.name || "Task"}
          </div>
          <div className={cn("text-sm", MODAL_MUTED)}>
            {groupToOptions?.name ?? "Group"} · {assigneeDraft || taskToOptions?.assignee}
          </div>
        </div>

        <div className="mt-7">
          {/* GENERAL */}
          {taskOptionsTab === "general" && taskToOptions && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-sm font-semibold text-[var(--text)]">Task name</div>
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className={cn("mt-2 h-11 rounded-2xl", MODAL_INPUT)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Days left</div>
                  <div className="mt-2">
                    {(() => {
                      const info = renderDaysLeft(taskToOptions);
                      const pill =
                        info.state === "over"
                          ? "border-rose-500/20 bg-rose-500/12 text-rose-400"
                          : info.state === "due"
                          ? "border-amber-500/20 bg-amber-500/12 text-amber-400"
                          : "border-emerald-500/15 bg-emerald-500/10 text-emerald-400";
                      return (
                        <span className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold", pill)}>
                          {info.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Status</div>
                  <div className="mt-2">
                    <Select value={statusDraft} onValueChange={(v: any) => setStatusDraft(v)}>
                      <SelectTrigger className={cn("w-full h-11 rounded-2xl", MODAL_SELECT)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => resetTaskDrafts("general")}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className={cn("h-11 rounded-2xl px-5", MODAL_BTN_DANGER)}
                    onClick={() => {
                      if (!taskOptionsTaskId) return;
                      if (window.confirm("Delete this task?")) {
                        deleteTask(taskOptionsTaskId);
                        closeTaskOptions();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>

                  <Button className={cn("h-11 rounded-2xl px-6", MODAL_BTN_PRIMARY)} onClick={saveGeneral}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* BAR COLOR */}
          {taskOptionsTab === "barColor" && (
            <div className="space-y-5">
              <div className={cn("text-sm", MODAL_MUTED)}>
                Pick a pastel color (or type a hex). This only affects the task bar’s fill color.
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap gap-6">
                  {PASTEL_BAR_COLORS.map(({ hex }) => (
                    <button
                      key={hex}
                      type="button"
                      className={cn(
                        "h-16 w-16 rounded-full border border-[var(--border)] shadow-sm",
                        barColorDraft === hex && "ring-2 ring-emerald-500/30"
                      )}
                      style={{ backgroundColor: hex }}
                      onClick={() => setBarColorDraft(hex)}
                      title={hex}
                    />
                  ))}
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-[var(--text)]">Custom hex</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      value={barColorDraft ?? ""}
                      onChange={(e) => setBarColorDraft(e.target.value)}
                      placeholder="#A7C7E7"
                      className={cn("h-11 rounded-2xl", MODAL_INPUT)}
                    />
                    <div
                      className="h-11 w-16 rounded-2xl border border-[var(--border)]"
                      style={{ backgroundColor: normalizeHexColor(barColorDraft) ?? "transparent" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => resetTaskDrafts("barColor")}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => setBarColorDraft(null)}
                >
                  Clear
                </Button>
                <Button className={cn("h-11 rounded-2xl px-6", MODAL_BTN_PRIMARY)} onClick={saveTaskBarColor}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* DATES */}
          {taskOptionsTab === "dates" && (
            <div className="space-y-5">
              <div className={cn("text-sm", MODAL_MUTED)}>
                Adjust Start & Due. “Days left” auto-updates and excludes Sat/Sun.
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Start</div>
                    <Input
                      type="date"
                      value={dateStartDraft}
                      onChange={(e) => setDateStartDraft(e.target.value)}
                      className={cn("mt-2 h-11 rounded-2xl", MODAL_INPUT)}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Due</div>
                    <Input
                      type="date"
                      value={dateDueDraft}
                      onChange={(e) => setDateDueDraft(e.target.value)}
                      className={cn("mt-2 h-11 rounded-2xl", MODAL_INPUT)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => resetTaskDrafts("dates")}
                >
                  Cancel
                </Button>
                <Button className={cn("h-11 rounded-2xl px-6", MODAL_BTN_PRIMARY)} onClick={saveTaskDates}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* ASSIGNEES */}
          {taskOptionsTab === "assignees" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-sm font-semibold text-[var(--text)]">Assignee</div>
                <div className="mt-2">
                  <Select value={assigneeDraft} onValueChange={(v: any) => setAssigneeDraft(v)}>
                    <SelectTrigger className={cn("w-full h-11 rounded-2xl", MODAL_SELECT)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNEES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => resetTaskDrafts("assignees")}
                >
                  Cancel
                </Button>
                <Button className={cn("h-11 rounded-2xl px-6", MODAL_BTN_PRIMARY)} onClick={saveAssignee}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* COSTED */}
          {taskOptionsTab === "costed" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Quoted</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={String(quotedDraft)}
                        onChange={(e) => setQuotedDraft(Number(e.target.value || 0))}
                        className={cn("h-11 rounded-2xl text-right tabular-nums", MODAL_INPUT)}
                        inputMode="numeric"
                      />
                      <span className={cn("text-sm", MODAL_MUTED)}>h</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Actual</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={String(actualDraft)}
                        onChange={(e) => setActualDraft(Number(e.target.value || 0))}
                        className={cn("h-11 rounded-2xl text-right tabular-nums", MODAL_INPUT)}
                        inputMode="numeric"
                      />
                      <span className={cn("text-sm", MODAL_MUTED)}>h</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => resetTaskDrafts("costed")}
                >
                  Cancel
                </Button>
                <Button className={cn("h-11 rounded-2xl px-6", MODAL_BTN_PRIMARY)} onClick={saveCosted}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* DEPENDENCIES */}
          {taskOptionsTab === "dependencies" && taskToOptions && (
            <div className="space-y-5">
              <div className={cn("text-sm", MODAL_MUTED)}>
                Pick one or more tasks that must finish before this task starts.
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-sm font-semibold text-[var(--text)]">Selected</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {depsDraft.length ? (
                    depsDraft.map((id) => {
                      const t = tasks.find((x) => x.id === id);
                      if (!t) return null;
                      const g = groups.find((gg) => gg.id === t.groupId);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--text)]"
                        >
                          <span>{(g?.name ?? "Group") + " · " + t.name}</span>
                          <button
                            type="button"
                            className="text-[var(--muted)] hover:text-[var(--text)]"
                            onClick={() => setDepsDraft((cur) => cur.filter((x) => x !== id))}
                          >
                            Remove
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className={cn("text-sm", MODAL_MUTED)}>No dependencies</span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-sm font-semibold text-[var(--text)] mb-3">All tasks</div>
                <div className="max-h-[260px] overflow-auto space-y-2 pr-1">
                  {tasks
                    .filter((t) => t.id !== taskToOptions.id)
                    .map((t) => {
                      const g = groups.find((gg) => gg.id === t.groupId);
                      const label = `${g?.name ?? "Group"} · ${t.name}`;

                      const checked = depsDraft.includes(t.id);
                      const disabled = wouldCreateCycle(t.id, taskToOptions.id);

                      return (
                        <label
                          key={t.id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2 border border-[var(--border)]",
                            disabled
                              ? "opacity-50"
                              : "bg-[var(--bg)] hover:bg-[var(--hover)]"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => {
                              const on = e.target.checked;
                              setDepsDraft((cur) => {
                                const next = new Set(cur);
                                if (on) next.add(t.id);
                                else next.delete(t.id);
                                return Array.from(next);
                              });
                            }}
                          />
                          <span className="text-sm text-[var(--text)]">{label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => resetTaskDrafts("dependencies")}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-2xl px-5", MODAL_BTN)}
                  onClick={() => setDepsDraft([])}
                >
                  Clear
                </Button>
                <Button className={cn("h-11 rounded-2xl px-6", MODAL_BTN_PRIMARY)} onClick={saveDependencies}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
{/* Versions dialog */}
<Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className={cn("max-w-6xl", DIALOG_SURFACE)}>
          <DialogHeader>
            <DialogTitle>Published versions</DialogTitle>
            <div className="text-sm text-[var(--muted)]">
              Publish creates a snapshot (V1, V2, …). Preview any version and load it back into the main timeline to rework.
            </div>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className={cn("rounded-xl overflow-hidden", OUTLINE_SUBTLE)}>
              <div className="px-3 py-2 border-b border-b-[0.5px] border-[var(--border)] bg-[var(--panel)]">
                <div className="text-xs font-semibold">Versions</div>
              </div>

              <div className="max-h-[520px] overflow-auto">
                {versions.length === 0 ? (
                  <div className="p-3 text-sm text-[var(--muted)]">
                    No published versions yet. Click <span className="font-medium">Publish {nextPublish}</span> to create your first snapshot.
                  </div>
                ) : (
                  versions.map((v) => {
                    const active = v.id === (activeVersionId ?? versions[0]?.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveVersionId(v.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 border-b border-b-[0.5px] border-[var(--border)] transition",
                          active ? "bg-[var(--hover)]" : "hover:bg-[var(--panel)]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">{v.label}</div>
                          <Badge variant="secondary" className="rounded-full">
                            {v.tasks?.length ?? 0} tasks
                          </Badge>
                        </div>
                        <div className="text-xs text-[var(--muted)]">{formatVersionTimestamp(v.createdAt)}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={cn("rounded-xl overflow-hidden", OUTLINE_SUBTLE)}>
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-b-[0.5px] border-[var(--border)] bg-[var(--surface)]">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{activeVersion ? `${activeVersion.label} preview` : "Select a version"}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {activeVersion ? formatVersionTimestamp(activeVersion.createdAt) : "Pick a version on the left."}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className={cn("h-8 rounded-full", BTN_SOFT)}
                    disabled={!activeVersion}
                    onClick={() => activeVersion && loadVersionToEditor(activeVersion)}
                  >
                    Load to editor
                  </Button>
                  <Button className={cn("h-8 rounded-full", BTN_SOFT, BTN_TINT_EMERALD)} onClick={publishVersion}>
                    Publish {nextPublish}
                  </Button>
                </div>
              </div>

              <div className="p-3">
                {activeVersion ? (
                  <SnapshotPreview groups={activeVersion.groups} tasks={activeVersion.tasks} autoRows={autoRows} />
                ) : (
                  <div className="text-sm text-[var(--muted)]">Choose a version to preview.</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
