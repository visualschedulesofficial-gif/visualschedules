import React, { useState, useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Bell, Search, Plus, Printer, FileText,
  Image as ImageIcon, Check, X, Trash2, GripVertical, MoreVertical,
  Home, LayoutGrid, BookOpen, User, Settings, Package, Tag, BarChart3,
  Pencil, Users, Globe, Lock,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Visual Schedule — mobile prototype
 * Green/white/rounded identity (matches the uploaded mockup exactly),
 * deliberately different from the live app's brown/cream desktop look.
 * Two experiences in one file: the parent App and a mobile Admin panel.
 * Everything is in-memory React state — safe, nothing wired to the DB.
 * ------------------------------------------------------------------ */

const C = {
  green: "#2E9E6A", greenDark: "#24845A", greenSoft: "#E9F6EF",
  greenBorder: "#BFE3CF", ink: "#1E2A24", sub: "#6C7A72", faint: "#9AA69E",
  bg: "#F5F8F5", card: "#FFFFFF", border: "#E6EBE6", red: "#DC4C4C",
  redSoft: "#FCECEC", gold: "#E8B23A",
};
const SWATCHES = ["#B9E6C9", "#FCE38A", "#F6B27A", "#F4A6B4", "#A9C7F0", "#C6A9E8", "#F2A29A"];

const TEMPLATES = [
  { id: "school", name: "School Morning", emoji: "🌅", tint: "#EAF6EC", ring: C.green,
    steps: ["🛏️ Wake up", "🚽 Toilet", "🪥 Brush teeth", "👕 Get dressed", "🥣 Breakfast", "👟 Shoes", "🎒 Backpack", "🚌 Go to school"] },
  { id: "bedtime", name: "Bedtime Routine", emoji: "🌙", tint: "#EFEAFA",
    steps: ["🛁 Bath", "👚 Pyjamas", "🪥 Brush teeth", "📖 Story", "🚽 Toilet", "🧸 Cuddle", "😴 Sleep"] },
  { id: "afterschool", name: "After School", emoji: "🎒", tint: "#FBF3E2",
    steps: ["🎒 Unpack bag", "🍎 Snack", "🧼 Wash hands", "✏️ Homework", "🧩 Play", "🍽️ Dinner"] },
  { id: "bathroom", name: "Bathroom Routine", emoji: "🚽", tint: "#E6F1FA",
    steps: ["🚽 Toilet", "🧻 Wipe", "🚰 Flush", "🧼 Wash hands", "🌀 Dry hands"] },
  { id: "weekend", name: "Weekend Routine", emoji: "🌈", tint: "#FCEBEF",
    steps: ["🛏️ Wake up", "🥣 Breakfast", "🪥 Brush teeth", "🧩 Play", "🌳 Outside", "📺 Screen time"] },
];

const LIB = {
  Morning:  [["🛏️","Wake up"],["👕","Get dressed"],["🥣","Breakfast"],["🌅","Curtains"]],
  Hygiene:  [["🪥","Brush teeth"],["🧼","Wash face"],["💇","Comb hair"],["🚿","Shower"],["🧴","Lotion"]],
  School:   [["🎒","Backpack"],["📚","Books"],["✏️","Homework"],["🚌","Go to school"],["🥪","Lunchbox"]],
  Food:     [["🥣","Breakfast"],["🍎","Snack"],["🍽️","Dinner"],["🥛","Milk"],["🧑‍🍳","Help cook"]],
  Play:     [["🧩","Puzzle"],["⚽","Ball"],["🎨","Draw"],["🧸","Toys"]],
  OT:       [["🤸","Stretch"],["🧘","Calm down"],["🫧","Deep breath"],["🖐️","Squeeze"]],
};
const CHARACTERS = [
  { id: "neutral", label: "Neutral", emoji: "🧒" },
  { id: "boy", label: "Boy", emoji: "👦" },
  { id: "girl", label: "Girl", emoji: "👧" },
  { id: "brown", label: "Brown", emoji: "🧒🏽" },
];
const charEmoji = (c) => (CHARACTERS.find((x) => x.id === c) || CHARACTERS[0]).emoji;
const PEOPLE = ["Me", "Wave hello", "Sit down", "All done"];
const PAID_CATS = ["School", "OT"]; // free by default: Daily, Morning, Hygiene, Food, Play, People

const LIB_CATS = ["All", "People", ...Object.keys(LIB)];
function libCards(cat, character = "neutral") {
  const people = PEOPLE.map((l) => ({ e: charEmoji(character), l, c: "People", char: true, paid: false }));
  if (cat === "People") return people;
  const mk = (e, l, c) => ({ e, l, c, paid: PAID_CATS.includes(c) });
  const base = cat === "All"
    ? Object.entries(LIB).flatMap(([c, arr]) => arr.map(([e, l]) => mk(e, l, c)))
    : LIB[cat].map(([e, l]) => mk(e, l, cat));
  return cat === "All" ? [...people, ...base] : base;
}

function CharacterRow({ character, setCharacter }) {
  return (
    <div className="flex gap-2">
      {CHARACTERS.map((c) => {
        const active = character === c.id;
        return (
          <button key={c.id} onClick={() => setCharacter(c.id)} className="flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5"
            style={active ? { background: C.greenSoft, border: `1.5px solid ${C.green}` } : { background: C.card, border: `1px solid ${C.border}` }}>
            <span className="text-lg">{c.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: active ? C.greenDark : C.sub }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const LANGS = ["English", "Hindi", "Marathi", "Punjabi", "Gujarati", "Tamil", "Telugu", "Bengali", "Kannada", "Spanish"];

const SEED_SCHEDULES = [
  { id: 1, name: "School Morning", emoji: "🌅", steps: 8, when: "Today, 7:30 AM", kind: "Routines" },
  { id: 2, name: "Bedtime Routine", emoji: "🌙", steps: 7, when: "Yesterday, 8:45 PM", kind: "Routines" },
  { id: 3, name: "After School", emoji: "🎒", steps: 6, when: "2 days ago", kind: "Custom" },
  { id: 4, name: "Weekend Routine", emoji: "🌈", steps: 6, when: "Jun 8, 5:20 PM", kind: "Custom" },
];

const parse = (s) => { const i = s.indexOf(" "); return { emoji: s.slice(0, i), label: s.slice(i + 1) }; };

/* ---------- small shared UI ---------- */
function Screen({ children }) {
  return <div className="flex flex-col h-full" style={{ background: C.bg }}>{children}</div>;
}
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-xs font-semibold" style={{ color: C.ink }}>
      <span>9:41</span>
      <span className="tracking-tight" style={{ color: C.sub }}>●●●  ᯤ  ▮</span>
    </div>
  );
}
function TopBar({ title, sub, onBack, right }) {
  return (
    <div className="px-4 pt-1 pb-3" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center">
        <div className="w-9">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full active:opacity-60" style={{ color: C.ink }}>
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        <div className="flex-1 text-center">
          <div className="font-bold text-[17px] leading-tight" style={{ color: C.ink }}>{title}</div>
          {sub && <div className="text-[12px] mt-0.5" style={{ color: C.sub }}>{sub}</div>}
        </div>
        <div className="w-9 flex justify-end">{right}</div>
      </div>
    </div>
  );
}
function GreenBtn({ children, onClick, className = "", outline = false, style = {} }) {
  return (
    <button onClick={onClick}
      className={`w-full py-3.5 rounded-2xl font-bold text-[15px] active:opacity-90 transition ${className}`}
      style={outline
        ? { background: C.card, color: C.green, border: `1.5px solid ${C.green}`, ...style }
        : { background: C.green, color: "#fff", boxShadow: "0 6px 16px rgba(46,158,106,0.28)", ...style }}>
      {children}
    </button>
  );
}
function Num({ n }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
      style={{ border: `2px solid ${C.green}`, color: C.green }}>{n}</div>
  );
}
function AppTabBar({ tab, go }) {
  const items = [["Home", Home, "home"], ["Templates", LayoutGrid, "templates"], ["My Library", BookOpen, "library"], ["Profile", User, "profile"]];
  return (
    <div className="flex" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
      {items.map(([label, Icon, key]) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => go(key)} className="flex-1 py-2.5 flex flex-col items-center gap-1">
            <Icon size={21} strokeWidth={active ? 2.4 : 1.9} style={{ color: active ? C.green : C.faint }} />
            <span className="text-[10px] font-semibold" style={{ color: active ? C.green : C.faint }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== *
 *  PARENT APP
 * ================================================================== */
function ParentApp() {
  const [screen, setScreen] = useState("home");     // home|templates|steps|preview|printOptions|printPreview|success|schedules|library|profile
  const [tab, setTab] = useState("home");
  const [schedules, setSchedules] = useState(SEED_SCHEDULES);
  const [filter, setFilter] = useState("All");
  const [draft, setDraft] = useState({ name: "New Schedule", emoji: "🗓️", steps: [] });
  const [editing, setEditing] = useState(null);      // index for bottom sheet
  const [showNumbers, setShowNumbers] = useState(true);
  const [libCat, setLibCat] = useState("All");
  const [character, setCharacter] = useState("neutral");
  const [subscribed, setSubscribed] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [plansBack, setPlansBack] = useState("library");

  const goTab = (t) => { setTab(t); setScreen(t === "home" ? "home" : t); };

  const startTemplate = (tpl) => {
    setDraft({ name: tpl.name, emoji: tpl.emoji,
      steps: tpl.steps.map((s, i) => ({ id: Date.now() + i, ...parse(s), color: SWATCHES[i % SWATCHES.length] })) });
    setScreen("steps");
  };
  const addLibCard = (card) => {
    setDraft((d) => ({ ...d, steps: [...d.steps, { id: Date.now(), emoji: card.e, label: card.l, color: SWATCHES[d.steps.length % SWATCHES.length] }] }));
    setScreen("steps");
  };
  const saveDraft = () => {
    setSchedules((s) => [{ id: Date.now(), name: draft.name, emoji: draft.emoji, steps: draft.steps.length, when: "Today, just now", kind: "Custom" }, ...s]);
    setScreen("success");
  };

  return (
    <>
      {screen === "home" && <HomeScreen schedules={schedules} onCreate={() => setScreen("templates")} onSeeAll={() => { setTab("home"); setScreen("schedules"); }} tab={tab} goTab={goTab} />}
      {screen === "templates" && <TemplatesScreen onBack={() => setScreen("home")} onUse={startTemplate} onCustom={() => { setDraft({ name: "Custom Routine", emoji: "✨", steps: [] }); setScreen("steps"); }} />}
      {screen === "steps" && <StepsScreen draft={draft} setDraft={setDraft} onBack={() => setScreen("templates")} onEdit={setEditing} onAdd={() => setScreen("library")} onDone={() => setScreen("preview")} />}
      {screen === "preview" && <PreviewScreen draft={draft} showNumbers={showNumbers} onBack={() => setScreen("steps")} onEditSteps={() => setScreen("steps")} onPrint={() => setScreen("printOptions")} />}
      {screen === "printOptions" && <PrintOptionsScreen showNumbers={showNumbers} setShowNumbers={setShowNumbers} onBack={() => setScreen("preview")} onPrint={() => setScreen("printPreview")} onSaved={saveDraft} />}
      {screen === "printPreview" && <PrintPreviewScreen draft={draft} showNumbers={showNumbers} onBack={() => setScreen("printOptions")} onDone={saveDraft} />}
      {screen === "success" && <SuccessScreen name={draft.name} onView={() => { setTab("home"); setScreen("schedules"); }} onAgain={() => setScreen("templates")} />}
      {screen === "schedules" && <SchedulesScreen schedules={schedules} filter={filter} setFilter={setFilter} onNew={() => setScreen("templates")} tab={tab} goTab={goTab} />}
      {screen === "library" && <LibraryScreen cat={libCat} setCat={setLibCat} character={character} setCharacter={setCharacter} subscribed={subscribed} onUpgrade={() => { setPlansBack("library"); setScreen("plans"); }} onBack={() => setScreen("steps")} onPick={addLibCard} />}
      {screen === "plans" && <PlansScreen user={user} subscribed={subscribed} onBack={() => setScreen(plansBack)} onNeedLogin={() => setShowLogin(true)} onSubscribe={() => { setSubscribed(true); setScreen(plansBack); }} />}
      {screen === "profile" && <ProfileScreen character={character} setCharacter={setCharacter} user={user} subscribed={subscribed} onSignIn={() => setShowLogin(true)} onSignOut={() => setUser(null)} onUpgrade={() => { setPlansBack("profile"); setScreen("plans"); }} tab={tab} goTab={goTab} />}

      {editing !== null && (
        <EditStepSheet
          step={draft.steps[editing]}
          onClose={() => setEditing(null)}
          onSave={(patch) => { setDraft((d) => ({ ...d, steps: d.steps.map((s, i) => i === editing ? { ...s, ...patch } : s) })); setEditing(null); }}
          onDelete={() => { setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== editing) })); setEditing(null); }}
        />
      )}

      {showLogin && <LoginSheet onClose={() => setShowLogin(false)} onDone={(u) => { setUser(u); setShowLogin(false); }} />}
    </>
  );
}

/* 1. HOME / DASHBOARD */
function HomeScreen({ schedules, onCreate, onSeeAll, tab, goTab }) {
  return (
    <Screen>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-bold text-[15px]" style={{ color: C.ink }}>Visual Schedule</span>
        </div>
        <Bell size={20} style={{ color: C.sub }} />
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        <h1 className="text-[26px] font-extrabold leading-tight mt-3" style={{ color: C.ink }}>
          Make your child's routine easier to follow.
        </h1>
        <p className="text-[14px] mt-2 mb-4" style={{ color: C.sub }}>Create simple visual schedules in under a minute.</p>
        <GreenBtn onClick={onCreate}><span className="inline-flex items-center gap-2 justify-center"><Plus size={18} /> Create Schedule</span></GreenBtn>

        <div className="flex items-center justify-between mt-7 mb-2">
          <span className="font-bold text-[15px]" style={{ color: C.ink }}>My Schedules</span>
          <button onClick={onSeeAll} className="text-[13px] font-semibold" style={{ color: C.green }}>See all</button>
        </div>
        <div className="space-y-2.5 pb-4">
          {schedules.slice(0, 3).map((s) => <ScheduleRow key={s.id} s={s} />)}
        </div>
      </div>
      <AppTabBar tab={tab} go={goTab} />
    </Screen>
  );
}
function ScheduleRow({ s, onMenu }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: C.greenSoft }}>{s.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{s.name}</div>
        <div className="text-[12px]" style={{ color: C.sub }}>{s.steps} steps · {s.when}</div>
      </div>
      <button onClick={onMenu}><MoreVertical size={18} style={{ color: C.faint }} /></button>
    </div>
  );
}

/* 2. CHOOSE ROUTINE / TEMPLATE */
function TemplatesScreen({ onBack, onUse, onCustom }) {
  const [sel, setSel] = useState("school");
  const chosen = TEMPLATES.find((t) => t.id === sel);
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Choose a routine" sub="Start with a template or create your own" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const active = sel === t.id;
            return (
              <button key={t.id} onClick={() => setSel(t.id)} className="relative rounded-2xl p-4 text-left h-28 flex flex-col justify-between"
                style={{ background: t.tint, border: active ? `2px solid ${C.green}` : "2px solid transparent" }}>
                {active && <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: C.green }}><Check size={13} color="#fff" strokeWidth={3} /></div>}
                <span className="text-2xl">{t.emoji}</span>
                <span className="font-bold text-[13px]" style={{ color: C.ink }}>{t.name}</span>
              </button>
            );
          })}
          <button onClick={onCustom} className="rounded-2xl p-4 h-28 flex flex-col items-center justify-center gap-1.5"
            style={{ background: C.card, border: `1.5px dashed ${C.greenBorder}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.greenSoft }}><Plus size={20} style={{ color: C.green }} /></div>
            <span className="font-bold text-[13px]" style={{ color: C.ink }}>Custom Routine</span>
          </button>
        </div>
        <div className="mt-4 p-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: C.greenSoft, color: C.greenDark }}>
          <span>✨</span><span><b>{chosen.name}</b> includes {chosen.steps.length} ready-to-use steps that you can edit or reorder.</span>
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <GreenBtn onClick={() => onUse(chosen)}>Use This Template</GreenBtn>
      </div>
    </Screen>
  );
}

/* 3. ADD / EDIT STEPS  (with drag-to-reorder) */
function StepsScreen({ draft, setDraft, onBack, onEdit, onAdd, onDone }) {
  const rowRefs = useRef([]);
  const drag = useRef({ from: -1 });
  const [dragI, setDragI] = useState(-1);

  const onDown = (i) => (e) => { e.preventDefault(); drag.current.from = i; setDragI(i);
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); };
  const onMove = useCallback((e) => {
    const y = e.clientY;
    let target = drag.current.from;
    rowRefs.current.forEach((el, i) => { if (!el) return; const r = el.getBoundingClientRect(); if (y > r.top && y < r.bottom) target = i; });
    if (target !== drag.current.from && target >= 0) {
      setDraft((d) => { const arr = [...d.steps]; const [m] = arr.splice(drag.current.from, 1); arr.splice(target, 0, m); return { ...d, steps: arr }; });
      drag.current.from = target; setDragI(target);
    }
  }, [setDraft]);
  const onUp = () => { drag.current.from = -1; setDragI(-1); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };

  return (
    <Screen>
      <StatusBar />
      <TopBar title={draft.name} sub={`${draft.steps.length} steps`} onBack={onBack}
        right={<button onClick={onDone} className="text-[14px] font-bold" style={{ color: C.green }}>Done</button>} />
      <div className="px-5 pt-3 text-[12px]" style={{ color: C.sub }}>Tap a step to edit. Drag <GripVertical size={12} className="inline -mt-0.5" /> to reorder.</div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
        {draft.steps.map((s, i) => (
          <div key={s.id} ref={(el) => (rowRefs.current[i] = el)}
            className="flex items-center gap-2 p-3 rounded-2xl transition"
            style={{ background: C.card, border: `1px solid ${dragI === i ? C.green : C.border}`, boxShadow: dragI === i ? "0 8px 20px rgba(0,0,0,0.10)" : "none", opacity: dragI >= 0 && dragI !== i ? 0.7 : 1 }}>
            <button onPointerDown={onDown(i)} className="touch-none cursor-grab active:cursor-grabbing p-1" style={{ color: C.faint }}><GripVertical size={18} /></button>
            <Num n={i + 1} />
            <span className="text-xl">{s.emoji}</span>
            <button onClick={() => onEdit(i)} className="flex-1 text-left font-semibold text-[14px] py-1" style={{ color: C.ink }}>{s.label}</button>
            <button onClick={() => onEdit(i)}><MoreVertical size={18} style={{ color: C.faint }} /></button>
          </div>
        ))}
        {draft.steps.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: C.faint }}>No steps yet — add one below to begin.</div>}
        <button onClick={onAdd} className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2"
          style={{ background: C.card, color: C.green, border: `1.5px solid ${C.green}` }}><Plus size={18} /> Add Step</button>
      </div>
    </Screen>
  );
}

/* 4. EDIT STEP — bottom sheet */
function EditStepSheet({ step, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(step.label);
  const [color, setColor] = useState(step.color);
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(28,27,25,0.5)" }} onClick={onClose}>
      <div className="rounded-t-3xl p-5 pb-6" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-[16px]" style={{ color: C.ink }}>Edit Step</span>
          <button onClick={onClose}><X size={20} style={{ color: C.sub }} /></button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl" style={{ background: C.greenSoft }}>{step.emoji}</div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: C.bg, color: C.ink, border: `1px solid ${C.border}` }}>
            <ImageIcon size={16} style={{ color: C.green }} /> Change Image
          </button>
        </div>
        <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.sub }}>Step Title</div>
        <div className="relative mb-4">
          <input value={title} maxLength={20} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: C.card, border: `1.5px solid ${C.greenBorder}`, color: C.ink }} />
          <span className="absolute right-3 top-3.5 text-[11px]" style={{ color: C.faint }}>{title.length}/20</span>
        </div>
        <div className="flex gap-3 mb-5 justify-between">
          {SWATCHES.map((s) => (
            <button key={s} onClick={() => setColor(s)} className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: s, border: color === s ? `2px solid ${C.ink}` : "2px solid transparent" }}>
              {color === s && <Check size={13} color={C.ink} strokeWidth={3} />}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onDelete} className="flex-1 py-3 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-1.5" style={{ background: C.redSoft, color: C.red }}>
            <Trash2 size={16} /> Delete Step
          </button>
          <button onClick={() => onSave({ label: title, color })} className="flex-1 py-3 rounded-2xl font-bold text-[14px]" style={{ background: C.green, color: "#fff" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* 5. PREVIEW */
function PreviewScreen({ draft, showNumbers, onBack, onEditSteps, onPrint }) {
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Preview" sub="This is how your schedule will look." onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
          <div className="text-center font-extrabold text-[18px] mb-4" style={{ color: C.ink }}>{draft.name} <span>{draft.emoji}</span></div>
          <div className="space-y-3">
            {draft.steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                {showNumbers && <Num n={i + 1} />}
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-semibold text-[15px]" style={{ color: C.ink }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex gap-3" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <button onClick={onEditSteps} className="flex-1 py-3.5 rounded-2xl font-bold text-[15px]" style={{ background: C.card, color: C.green, border: `1.5px solid ${C.green}` }}>Edit Steps</button>
        <button onClick={onPrint} className="flex-1 py-3.5 rounded-2xl font-bold text-[15px]" style={{ background: C.green, color: "#fff" }}>Print / Download</button>
      </div>
    </Screen>
  );
}

/* 6. PRINT / DOWNLOAD OPTIONS */
function PrintOptionsScreen({ showNumbers, setShowNumbers, onBack, onPrint, onSaved }) {
  const Opt = ({ Icon, title, sub, onClick, color }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "22" }}><Icon size={20} style={{ color }} /></div>
      <div className="flex-1 text-left"><div className="font-bold text-[14px]" style={{ color: C.ink }}>{title}</div><div className="text-[12px]" style={{ color: C.sub }}>{sub}</div></div>
      <ChevronRight size={18} style={{ color: C.faint }} />
    </button>
  );
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Print / Download" sub="Choose how you want to use it." onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <Opt Icon={Printer} title="Print" sub="Best for charts and checklists" color={C.green} onClick={onPrint} />
        <Opt Icon={FileText} title="Download PDF" sub="Save to your device" color="#D9534F" onClick={onSaved} />
        <Opt Icon={ImageIcon} title="Download Images" sub="Save each step as images" color="#3E7CB1" onClick={onSaved} />
        <div className="flex items-center justify-between p-4 rounded-2xl mt-1" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <span className="font-bold text-[14px]" style={{ color: C.ink }}>Show step numbers</span>
          <button onClick={() => setShowNumbers((v) => !v)} className="w-12 h-7 rounded-full p-1 transition" style={{ background: showNumbers ? C.green : "#CFD6CF" }}>
            <div className="w-5 h-5 rounded-full bg-white transition" style={{ transform: showNumbers ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>
        <div className="p-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "#FCF6E4", color: "#8A6D1F" }}>
          <span>💡</span><span>Tip: Print on A4 paper and use Velcro or magnets.</span>
        </div>
      </div>
    </Screen>
  );
}

/* 10. PRINT PREVIEW */
function PrintPreviewScreen({ draft, showNumbers, onBack, onDone }) {
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Print Preview" sub="A4 · Portrait" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto rounded-xl p-5" style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 28px rgba(0,0,0,0.10)", aspectRatio: "794/1123" }}>
          <div className="text-center font-extrabold text-[16px] mb-4" style={{ color: C.ink }}>{draft.name} <span>{draft.emoji}</span></div>
          <div className="space-y-2.5">
            {draft.steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                {showNumbers && <Num n={i + 1} />}
                <span className="text-xl">{s.emoji}</span>
                <span className="font-semibold text-[13px]" style={{ color: C.ink }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <GreenBtn onClick={onDone}>Print</GreenBtn>
      </div>
    </Screen>
  );
}

/* 7. SUCCESS */
function SuccessScreen({ name, onView, onAgain }) {
  const dots = [["#F4A6B4", -60, -30], ["#A9C7F0", 60, -20], ["#FCE38A", -50, 20], ["#B9E6C9", 55, 30], ["#C6A9E8", 0, -55], ["#F6B27A", 20, 50]];
  return (
    <Screen>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-6">
          {dots.map(([c, x, y], i) => <div key={i} className="absolute w-2.5 h-2.5 rounded-sm" style={{ background: c, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }} />)}
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: C.green, boxShadow: "0 10px 30px rgba(46,158,106,0.35)" }}>
            <Check size={48} color="#fff" strokeWidth={3.5} />
          </div>
        </div>
        <h2 className="text-[22px] font-extrabold" style={{ color: C.ink }}>Your schedule is ready!</h2>
        <p className="text-[14px] mt-2" style={{ color: C.sub }}>"{name}" has been saved to My Schedules.</p>
      </div>
      <div className="px-5 py-5 space-y-3">
        <GreenBtn onClick={onView}>View My Schedules</GreenBtn>
        <GreenBtn outline onClick={onAgain}>Create Another</GreenBtn>
      </div>
    </Screen>
  );
}

/* 8. MY SCHEDULES LIST */
function SchedulesScreen({ schedules, filter, setFilter, onNew, tab, goTab }) {
  const list = schedules.filter((s) => filter === "All" || s.kind === filter);
  return (
    <Screen>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-1 pb-3">
        <h1 className="text-[22px] font-extrabold" style={{ color: C.ink }}>My Schedules</h1>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}><Search size={17} style={{ color: C.sub }} /></button>
          <button onClick={onNew} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.green }}><Plus size={18} color="#fff" /></button>
        </div>
      </div>
      <div className="flex gap-2 px-5 pb-3">
        {["All", "Routines", "Custom"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-4 py-1.5 rounded-full text-[13px] font-semibold"
            style={filter === f ? { background: C.green, color: "#fff" } : { background: C.card, color: C.sub, border: `1px solid ${C.border}` }}>{f}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-2.5 pb-4">
        {list.map((s) => <ScheduleRow key={s.id} s={s} />)}
      </div>
      <AppTabBar tab={tab} go={goTab} />
    </Screen>
  );
}

/* 9. STEP LIBRARY / ADD STEP */
function LibraryScreen({ cat, setCat, character, setCharacter, subscribed, onUpgrade, onBack, onPick }) {
  const cards = libCards(cat, character);
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Add Step" onBack={onBack} />
      <div className="px-5 pt-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Search size={16} style={{ color: C.faint }} /><span className="text-[13px]" style={{ color: C.faint }}>Search steps</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold" style={{ color: C.sub }}>Character</span>
          <span className="text-[11px]" style={{ color: C.faint }}>Set as default in Profile</span>
        </div>
        <div className="mb-3"><CharacterRow character={character} setCharacter={setCharacter} /></div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {LIB_CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
              style={cat === c ? { background: C.green, color: "#fff" } : { background: C.card, color: C.sub, border: `1px solid ${C.border}` }}>{c}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="grid grid-cols-3 gap-3">
          {cards.map((card, i) => {
            const locked = card.paid && !subscribed;
            return (
              <button key={i} onClick={() => (locked ? onUpgrade() : onPick(card))} className="relative rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                {card.paid && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={locked ? { background: "#FFF3E6" } : { background: C.greenSoft }}>
                    <Lock size={11} style={{ color: locked ? "#B5761F" : C.green }} />
                  </div>
                )}
                <span className="text-2xl" style={{ opacity: locked ? 0.55 : 1 }}>{card.e}</span>
                <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: locked ? C.faint : C.ink }}>{card.l}</span>
              </button>
            );
          })}
          <div className="rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5" style={{ background: C.card, border: `1px dashed ${C.greenBorder}` }}>
            <MoreVertical size={20} style={{ color: C.faint }} /><span className="text-[11px] font-semibold" style={{ color: C.sub }}>More</span>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* Profile (extra) */
function ProfileScreen({ character, setCharacter, user, subscribed, onSignIn, onSignOut, onUpgrade, tab, goTab }) {
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Profile" />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ background: C.greenSoft }}>{user ? "👤" : "🌱"}</div>
          <div className="flex-1">
            <div className="font-bold text-[15px]" style={{ color: C.ink }}>{user ? user.id : "Not signed in"}</div>
            <div className="text-[12px]" style={{ color: C.sub }}>{user ? "visualschedule.app" : "Sign in to save & sync"}</div>
          </div>
          <button onClick={user ? onSignOut : onSignIn} className="px-3.5 py-2 rounded-xl text-[13px] font-bold" style={user ? { background: C.bg, color: C.sub, border: `1px solid ${C.border}` } : { background: C.green, color: "#fff" }}>{user ? "Sign out" : "Sign in"}</button>
        </div>

        <div className="p-4 rounded-2xl mb-4" style={{ background: subscribed ? C.greenSoft : C.card, border: `1px solid ${subscribed ? C.greenBorder : C.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-[14px]" style={{ color: C.ink }}>{subscribed ? "Active plan · all cards unlocked" : "Free plan"}</div>
              <div className="text-[12px]" style={{ color: C.sub }}>{subscribed ? "One plan · every device" : "3 schedules · free cards only"}</div>
            </div>
            {!subscribed && <button onClick={onUpgrade} className="px-3.5 py-2 rounded-xl text-[13px] font-bold" style={{ background: C.green, color: "#fff" }}>Upgrade</button>}
            {subscribed && <Check size={20} style={{ color: C.green }} strokeWidth={3} />}
          </div>
        </div>

        <div className="p-4 rounded-2xl mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="font-bold text-[14px] mb-0.5" style={{ color: C.ink }}>Child character</div>
          <div className="text-[12px] mb-3" style={{ color: C.sub }}>Applied to every card in the library by default.</div>
          <CharacterRow character={character} setCharacter={setCharacter} />
        </div>
        {[["Language", Globe, "English"], ["Saved schedules", BookOpen, "4"], ["Settings", Settings, ""]].map(([t, Icon, v]) => (
          <div key={t} className="flex items-center gap-3 p-4 rounded-2xl mb-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <Icon size={18} style={{ color: C.green }} /><span className="flex-1 font-semibold text-[14px]" style={{ color: C.ink }}>{t}</span>
            <span className="text-[13px]" style={{ color: C.sub }}>{v}</span><ChevronRight size={16} style={{ color: C.faint }} />
          </div>
        ))}
      </div>
      <AppTabBar tab={tab} go={goTab} />
    </Screen>
  );
}

/* PLANS / PAYWALL */
function PlansScreen({ user, subscribed, onBack, onNeedLogin, onSubscribe }) {
  const plans = [
    { id: "3", months: "3 months", price: "₹399", per: "₹133/mo" },
    { id: "6", months: "6 months", price: "₹699", per: "₹117/mo", best: true },
    { id: "12", months: "12 months", price: "₹1,199", per: "₹100/mo" },
  ];
  const [sel, setSel] = useState("6");
  const perks = ["Unlock all paid cards", "All 7 schedule types", "PDF + image export, no watermark", "25 languages"];
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Unlock everything" sub="One plan · works on every device" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-2xl p-4 mb-4" style={{ background: C.greenSoft, border: `1px solid ${C.greenBorder}` }}>
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-2 py-1"><Check size={16} style={{ color: C.green }} strokeWidth={3} /><span className="text-[13px] font-medium" style={{ color: C.greenDark }}>{p}</span></div>
          ))}
        </div>
        <div className="space-y-2.5">
          {plans.map((p) => {
            const active = sel === p.id;
            return (
              <button key={p.id} onClick={() => setSel(p.id)} className="w-full flex items-center gap-3 p-4 rounded-2xl relative" style={{ background: C.card, border: active ? `2px solid ${C.green}` : `1px solid ${C.border}` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${active ? C.green : C.border}`, background: active ? C.green : "transparent" }}>{active && <Check size={12} color="#fff" strokeWidth={3} />}</div>
                <div className="flex-1 text-left"><div className="font-bold text-[15px]" style={{ color: C.ink }}>{p.months}</div><div className="text-[12px]" style={{ color: C.sub }}>{p.per} · no auto-renewal</div></div>
                <div className="text-[17px] font-extrabold" style={{ color: C.ink }}>{p.price}</div>
                {p.best && <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: C.gold, color: "#fff" }}>POPULAR</div>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        {subscribed
          ? <div className="text-center py-2 font-bold text-[15px]" style={{ color: C.green }}>✓ Your plan is active</div>
          : <GreenBtn onClick={user ? onSubscribe : onNeedLogin}>{user ? "Pay with Razorpay" : "Sign in to continue"}</GreenBtn>}
        {!subscribed && <div className="text-center text-[11px] mt-2" style={{ color: C.faint }}>Secure payment · Razorpay · UPI, cards, netbanking</div>}
      </div>
    </Screen>
  );
}

/* LOGIN — OTP bottom sheet (better-auth) */
function LoginSheet({ onClose, onDone }) {
  const [step, setStep] = useState("id");
  const [id, setId] = useState("");
  const [otp, setOtp] = useState("");
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(28,27,25,0.5)" }} onClick={onClose}>
      <div className="rounded-t-3xl p-5 pb-7" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-[16px]" style={{ color: C.ink }}>{step === "id" ? "Sign in" : "Enter code"}</span>
          <button onClick={onClose}><X size={20} style={{ color: C.sub }} /></button>
        </div>
        {step === "id" ? (
          <>
            <p className="text-[13px] mb-4" style={{ color: C.sub }}>We'll send a one-time code to your phone or email.</p>
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Phone or email"
              className="w-full px-4 py-3 rounded-xl text-[15px] outline-none mb-4" style={{ border: `1.5px solid ${C.greenBorder}`, color: C.ink }} />
            <GreenBtn onClick={() => id.trim() && setStep("otp")}>Send code</GreenBtn>
          </>
        ) : (
          <>
            <p className="text-[13px] mb-4" style={{ color: C.sub }}>Code sent to <b style={{ color: C.ink }}>{id}</b>. Enter any 4 digits to continue.</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="• • • •"
              className="w-full px-4 py-3 rounded-xl text-[20px] tracking-widest text-center outline-none mb-4" style={{ border: `1.5px solid ${C.greenBorder}`, color: C.ink }} />
            <GreenBtn onClick={() => otp.length === 4 && onDone({ id })}>Verify & continue</GreenBtn>
            <button onClick={() => setStep("id")} className="w-full text-center text-[13px] font-semibold mt-3" style={{ color: C.sub }}>Use a different number</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== *
 *  MOBILE ADMIN PANEL  (different UI — data-dense, management-focused)
 * ================================================================== */
const ADMIN_CARDS = [
  { id: 1, en: "Wake up", hi: "उठना", cat: "Morning", emoji: "🛏️", paid: false },
  { id: 2, en: "Brush teeth", hi: "दांत साफ करना", cat: "Hygiene", emoji: "🪥", paid: false },
  { id: 3, en: "Breakfast", hi: "नाश्ता", cat: "Food", emoji: "🥣", paid: false },
  { id: 4, en: "Go to school", hi: "स्कूल जाना", cat: "School", emoji: "🚌", paid: true },
  { id: 5, en: "Homework", hi: "गृहकार्य", cat: "School", emoji: "✏️", paid: true },
  { id: 6, en: "Calm down", hi: "शांत होना", cat: "OT", emoji: "🧘", paid: true },
];

function AdminApp() {
  const [screen, setScreen] = useState("dash");
  const [cards, setCards] = useState(ADMIN_CARDS);
  const [editCard, setEditCard] = useState(null); // card | "new" | null
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const saveCard = (card) => {
    if (card.id) setCards((cs) => cs.map((c) => c.id === card.id ? card : c));
    else setCards((cs) => [{ ...card, id: Date.now() }, ...cs]);
    setEditCard(null);
  };
  const delCard = (id) => { setCards((cs) => cs.filter((c) => c.id !== id)); setEditCard(null); };

  return (
    <>
      {screen === "dash" && <AdminDash cards={cards} screen={screen} setScreen={setScreen} />}
      {screen === "cards" && <AdminCards cards={cards} q={q} setQ={setQ} catFilter={catFilter} setCatFilter={setCatFilter} onEdit={setEditCard} onNew={() => setEditCard("new")} screen={screen} setScreen={setScreen} />}
      {screen === "orders" && <AdminOrders screen={screen} setScreen={setScreen} />}
      {screen === "settings" && <AdminSettings screen={screen} setScreen={setScreen} />}
      {editCard !== null && (
        <AdminCardSheet card={editCard === "new" ? null : editCard} onClose={() => setEditCard(null)} onSave={saveCard} onDelete={delCard} />
      )}
    </>
  );
}

function AdminTabBar({ screen, setScreen }) {
  const items = [["Dashboard", BarChart3, "dash"], ["Cards", Tag, "cards"], ["Orders", Package, "orders"], ["Settings", Settings, "settings"]];
  return (
    <div className="flex" style={{ background: "#1E2A24", borderTop: "1px solid #2A3A31" }}>
      {items.map(([label, Icon, key]) => {
        const active = screen === key;
        return (
          <button key={key} onClick={() => setScreen(key)} className="flex-1 py-2.5 flex flex-col items-center gap-1">
            <Icon size={20} strokeWidth={active ? 2.4 : 1.9} style={{ color: active ? "#7FE0AC" : "#7C8B82" }} />
            <span className="text-[10px] font-semibold" style={{ color: active ? "#7FE0AC" : "#7C8B82" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
function AdminHeader({ title, sub }) {
  return (
    <div className="px-5 pt-2 pb-4" style={{ background: "#1E2A24" }}>
      <div className="flex items-center gap-2 mb-2"><span className="text-lg">🌱</span><span className="text-[12px] font-bold" style={{ color: "#7FE0AC" }}>ADMIN</span></div>
      <div className="text-[22px] font-extrabold text-white">{title}</div>
      {sub && <div className="text-[12px] mt-0.5" style={{ color: "#9FB0A6" }}>{sub}</div>}
    </div>
  );
}

function AdminDash({ cards, screen, setScreen }) {
  const stats = [["Schedules made", "1,284", "#2E9E6A"], ["Active plans", "96", "#3E7CB1"], ["Cards", String(cards.length * 40), "#E8B23A"], ["Orders (30d)", "₹38,400", "#B85C8A"]];
  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <StatusBar />
      <AdminHeader title="Dashboard" sub="Visual Schedule · admin" />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map(([l, v, c]) => (
            <div key={l} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-[22px] font-extrabold" style={{ color: c }}>{v}</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.sub }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="font-bold text-[14px] mb-2.5" style={{ color: C.ink }}>Manage</div>
        {[["Cards", Tag, "Add, edit, free/paid", "cards"], ["Categories", LayoutGrid, "6 categories", null], ["Orders & plans", Package, "Razorpay payments", "orders"], ["Users", Users, "Signed-in parents", null], ["Languages", Globe, "25 languages", null]].map(([t, Icon, sub, target]) => (
          <button key={t} onClick={() => target && setScreen(target)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl mb-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.greenSoft }}><Icon size={18} style={{ color: C.green }} /></div>
            <div className="flex-1 text-left"><div className="font-bold text-[14px]" style={{ color: C.ink }}>{t}</div><div className="text-[12px]" style={{ color: C.sub }}>{sub}</div></div>
            <ChevronRight size={17} style={{ color: C.faint }} />
          </button>
        ))}
      </div>
      <AdminTabBar screen={screen} setScreen={setScreen} />
    </div>
  );
}

function AdminCards({ cards, q, setQ, catFilter, setCatFilter, onEdit, onNew, screen, setScreen }) {
  const cats = ["All", "Morning", "Hygiene", "School", "Food", "OT"];
  const list = cards.filter((c) => (catFilter === "All" || c.cat === catFilter) && (c.en.toLowerCase().includes(q.toLowerCase()) || c.hi.includes(q)));
  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <StatusBar />
      <div className="px-5 pt-2 pb-3" style={{ background: "#1E2A24" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[20px] font-extrabold text-white">Cards</div>
          <button onClick={onNew} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold" style={{ background: C.green, color: "#fff" }}><Plus size={16} /> New</button>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: "#2A3A31" }}>
          <Search size={16} style={{ color: "#7C8B82" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards" className="bg-transparent outline-none text-[13px] text-white flex-1" />
        </div>
      </div>
      <div className="flex gap-2 px-5 py-3 overflow-x-auto" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={catFilter === c ? { background: C.green, color: "#fff" } : { background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>{c}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
        {list.map((c) => (
          <button key={c.id} onClick={() => onEdit(c)} className="w-full flex items-center gap-3 p-3 rounded-2xl text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: C.greenSoft }}>{c.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[14px]" style={{ color: C.ink }}>{c.en}</div>
              <div className="text-[13px]" style={{ color: C.sub, fontFamily: "system-ui" }}>{c.hi} · {c.cat}</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1"
              style={c.paid ? { background: "#FFF3E6", color: "#B5761F" } : { background: C.greenSoft, color: C.greenDark }}>
              {c.paid ? <><Lock size={11} /> Paid</> : "Free"}
            </span>
            <Pencil size={16} style={{ color: C.faint }} />
          </button>
        ))}
        {list.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: C.faint }}>No cards match. Add one to get started.</div>}
      </div>
      <AdminTabBar screen={screen} setScreen={setScreen} />
    </div>
  );
}

function AdminCardSheet({ card, onClose, onSave, onDelete }) {
  const [en, setEn] = useState(card?.en || "");
  const [hi, setHi] = useState(card?.hi || "");
  const [cat, setCat] = useState(card?.cat || "Morning");
  const [paid, setPaid] = useState(card?.paid || false);
  const [emoji, setEmoji] = useState(card?.emoji || "⭐");
  const cats = ["Morning", "Hygiene", "School", "Food", "Play", "OT"];
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(28,27,25,0.5)" }} onClick={onClose}>
      <div className="rounded-t-3xl p-5 pb-6 max-h-[88%] overflow-y-auto" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-[16px]" style={{ color: C.ink }}>{card ? "Edit card" : "New card"}</span>
          <button onClick={onClose}><X size={20} style={{ color: C.sub }} /></button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl" style={{ background: C.greenSoft }}>{emoji}</div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.sub }}>Image slots (up to 4)</div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => <div key={i} className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: C.bg, border: `1px dashed ${C.greenBorder}` }}><Plus size={15} style={{ color: C.faint }} /></div>)}
            </div>
          </div>
        </div>
        <Field label="Label (English)"><input value={en} onChange={(e) => setEn(e.target.value)} className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ border: `1.5px solid ${C.greenBorder}`, color: C.ink }} /></Field>
        <Field label="Label (Hindi)"><input value={hi} onChange={(e) => setHi(e.target.value)} className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ border: `1.5px solid ${C.greenBorder}`, color: C.ink }} /></Field>
        <Field label="Category">
          <div className="flex gap-2 flex-wrap">
            {cats.map((c) => <button key={c} onClick={() => setCat(c)} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold" style={cat === c ? { background: C.green, color: "#fff" } : { background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>{c}</button>)}
          </div>
        </Field>
        <div className="flex items-center justify-between p-3.5 rounded-2xl mb-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
          <div><div className="font-bold text-[14px]" style={{ color: C.ink }}>Paid card</div><div className="text-[12px]" style={{ color: C.sub }}>Locked until a plan is active</div></div>
          <button onClick={() => setPaid((v) => !v)} className="w-12 h-7 rounded-full p-1 transition" style={{ background: paid ? C.gold : "#CFD6CF" }}>
            <div className="w-5 h-5 rounded-full bg-white transition" style={{ transform: paid ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>
        <div className="flex gap-3">
          {card && <button onClick={() => onDelete(card.id)} className="flex-1 py-3 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-1.5" style={{ background: C.redSoft, color: C.red }}><Trash2 size={16} /> Delete</button>}
          <button onClick={() => onSave({ id: card?.id, en, hi, cat, paid, emoji })} className="flex-1 py-3 rounded-2xl font-bold text-[14px]" style={{ background: C.green, color: "#fff" }}>Save card</button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return <div className="mb-4"><div className="text-[12px] font-semibold mb-1.5" style={{ color: C.sub }}>{label}</div>{children}</div>;
}

function AdminOrders({ screen, setScreen }) {
  const orders = [["Priya S.", "6-month · ₹699", "Paid", "Today"], ["Ravi K.", "3-month · ₹399", "Paid", "Yesterday"], ["Anita M.", "12-month · ₹1,199", "Pending", "2 days ago"], ["Sunil T.", "6-month · ₹699", "Paid", "Jun 8"]];
  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <StatusBar />
      <AdminHeader title="Orders & plans" sub="Razorpay · no auto-renewal" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
        {orders.map(([name, plan, status, when], i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px]" style={{ background: C.greenSoft, color: C.greenDark }}>{name[0]}</div>
            <div className="flex-1"><div className="font-bold text-[14px]" style={{ color: C.ink }}>{name}</div><div className="text-[12px]" style={{ color: C.sub }}>{plan} · {when}</div></div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={status === "Paid" ? { background: C.greenSoft, color: C.greenDark } : { background: "#FFF3E6", color: "#B5761F" }}>{status}</span>
          </div>
        ))}
      </div>
      <AdminTabBar screen={screen} setScreen={setScreen} />
    </div>
  );
}
function AdminSettings({ screen, setScreen }) {
  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <StatusBar />
      <AdminHeader title="Settings" />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {[["Pricing", "₹399 / ₹699 / ₹1,199"], ["Free schedule limit", "3"], ["Center white-label", "On"], ["Default language", "English + Hindi"], ["Export watermark", "QR on free"]].map(([t, v]) => (
          <div key={t} className="flex items-center justify-between p-4 rounded-2xl mb-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <span className="font-semibold text-[14px]" style={{ color: C.ink }}>{t}</span><span className="text-[13px]" style={{ color: C.sub }}>{v}</span>
          </div>
        ))}
      </div>
      <AdminTabBar screen={screen} setScreen={setScreen} />
    </div>
  );
}

/* ================================================================== *
 *  ROOT — phone frame + App/Admin switch
 * ================================================================== */
export default function App() {
  const [mode, setMode] = useState("app");
  return (
    <div className="min-h-screen w-full flex flex-col items-center py-6" style={{ background: "#DDE4DD", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="mb-4 flex items-center gap-1 p-1 rounded-full" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
        {["app", "admin"].map((m) => (
          <button key={m} onClick={() => setMode(m)} className="px-5 py-1.5 rounded-full text-[13px] font-bold capitalize transition"
            style={mode === m ? { background: C.green, color: "#fff" } : { background: "transparent", color: C.sub }}>
            {m === "app" ? "Parent App" : "Admin Panel"}
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden shadow-2xl" style={{ width: 390, height: 800, borderRadius: 44, background: "#000", padding: 5 }}>
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: 40, background: C.bg }}>
          {mode === "app" ? <ParentApp /> : <AdminApp />}
        </div>
      </div>
      <p className="mt-4 text-[12px]" style={{ color: "#6C7A72" }}>Preview only · in-memory · nothing is saved to your live site</p>
    </div>
  );
}
