import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config/port";
import { Sidebar, Topbar, MobileNav } from "../../../components";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const CALORIE_GOAL = 2000;
const MACRO_TARGETS = { protein: 120, carbs: 200, fat: 60 };

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const EMOJI_OPTIONS = [
  "🍗","🥩","🥦","🍚","🥗","🍜","🍕","🥙","🌮","🍱",
  "🥣","🍳","🥐","🍞","🧆","🥘","🍲","🫕","🥫","🍎",
  "🍌","🥑","🫙","🧀","🥚","🫐","🍇","🍓","🥝","🍽️",
];

const EMPTY_FORM = {
  name: "", emoji: "🍽️", calories: "",
  protein: "", carbs: "", fat: "",
  mealType: "Breakfast", image_url: "",
};

// ─────────────────────────────────────────────
// BACKEND / API FUNCTIONS
// ─────────────────────────────────────────────

/** POST /api/food-logs/analyze-pic — send base64 image, get AI nutrition estimate */
async function apiAnalyzeFoodImage(base64Image) {
  const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const res = await fetch(`${API_BASE_URL}/api/food-logs/analyze-pic`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ base64Image: base64Data }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
  return data; // { food_name, calories, protein, carbs, fat, suggestion }
}

/** POST /api/food-logs/:userId — save a logged meal */
async function apiSaveFoodLog(userId, meal) {
  const res = await fetch(`${API_BASE_URL}/api/food-logs/${userId}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      food_name: meal.food_name,
      calories:  meal.calories  || 0,
      protein:   meal.protein   || 0,
      carbs:     meal.carbs     || 0,
      fat:       meal.fat       || 0,
      image_url: meal.image_url || null,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not save meal");
  return data; // { message, id }
}

/** GET /api/food-logs/:userId — fetch meal history */
async function apiFetchFoodLogs(userId, limit = 20, offset = 0) {
  const res  = await fetch(`${API_BASE_URL}/api/food-logs/${userId}?limit=${limit}&offset=${offset}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not fetch logs");
  return data; // { records: [...], total }
}

/** GET /api/nutrition/:userId/:date — fetch daily macro totals */
async function apiFetchDailySummary(userId) {
  const today = new Date().toISOString().split("T")[0];
  const res   = await fetch(`${API_BASE_URL}/api/nutrition/${userId}/${today}`);
  const data  = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not fetch summary");
  return data; // { total_calories, total_protein, total_carbs, total_fat }
}

// ─────────────────────────────────────────────
// SMALL UI COMPONENTS
// ─────────────────────────────────────────────

function MacroBar({ label, value, unit, color, pct }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-semibold text-[#e5e2e1]">{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 bg-[#D1FD52] text-[#131313] text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap">
      {message}
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <p className="text-[10px] sm:text-xs font-semibold text-[#D1FD52] uppercase tracking-widest mb-3 sm:mb-4">
      {text}
    </p>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white/80 animate-spin inline-block" />
  );
}

// ─────────────────────────────────────────────
// UPLOAD SECTION
// ─────────────────────────────────────────────

function UploadSection({ onAnalyze, isAnalyzing }) {
  const fileInputRef = useRef(null);
  const [preview,  setPreview]  = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-[#1c1c1c] rounded-2xl p-4 sm:p-5 border border-white/5">
      <SectionLabel text="Meal Photo" />

      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer
          ${dragOver ? "border-[#D1FD52]/60 bg-[#D1FD52]/5" : "border-white/10 hover:border-white/20"}
          ${preview ? "border-solid border-white/10" : ""}`}
        style={{ minHeight: 180 }}
        onClick={() => !preview && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Meal preview"
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: 240 }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs font-bold transition-colors touch-manipulation"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 sm:py-12 px-4 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-2xl">
              📷
            </div>
            <p className="text-[#e5e2e1] text-xs sm:text-sm font-medium mb-1">Drop a photo here</p>
            <p className="text-white/30 text-xs">or tap to browse</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"   // opens camera on mobile
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <button
        onClick={() => onAnalyze(preview)}
        disabled={isAnalyzing || !preview}
        className={`mt-3 sm:mt-4 w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 touch-manipulation
          ${isAnalyzing || !preview
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : "bg-[#D1FD52] hover:bg-[#bfea3a] active:scale-[0.98] text-[#131313]"}`}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Analyzing with AI…
          </span>
        ) : (
          "Analyze Meal"
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MANUAL LOG FORM
// ─────────────────────────────────────────────

function ManualLogForm({ onLog }) {
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [open,      setOpen]      = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [errors,    setErrors]    = useState({});

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Meal name is required";
    if (!form.calories || isNaN(form.calories) || Number(form.calories) <= 0)
      e.calories = "Enter a valid calorie amount";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onLog({
      food_name: form.name.trim(),
      emoji:     form.emoji,
      calories:  Number(form.calories),
      protein:   Number(form.protein) || 0,
      carbs:     Number(form.carbs)   || 0,
      fat:       Number(form.fat)     || 0,
      mealType:  form.mealType,
      image_url: form.image_url || "",
    });
    setForm(EMPTY_FORM);
    setOpen(false);
  };

  const inputCls = (err) =>
    `w-full h-10 bg-white/5 rounded-xl px-3 text-sm text-[#e5e2e1] border outline-none focus:border-[#D1FD52]/50 transition-colors ${
      err ? "border-red-500/60" : "border-white/10"
    }`;

  return (
    <div className="bg-[#1c1c1c] rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.03] transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">✏️</span>
          <p className="text-[10px] sm:text-xs font-semibold text-[#D1FD52] uppercase tracking-widest">
            Log Manually
          </p>
        </div>
        <span className={`text-white/30 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-white/5 pt-3 sm:pt-4 space-y-3 sm:space-y-4">

          {/* Meal Name + Emoji */}
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">Meal Name *</label>
            <div className="flex gap-2">
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setEmojiOpen((v) => !v)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg border border-white/10 touch-manipulation"
                >
                  {form.emoji}
                </button>
                {emojiOpen && (
                  <div className="absolute top-12 left-0 z-20 bg-[#252525] border border-white/10 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-xl w-max max-w-[200px]">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        onClick={() => { set("emoji", em); setEmojiOpen(false); }}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-base touch-manipulation"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="e.g. Chicken Adobo"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls(errors.name)}
                />
                {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
              </div>
            </div>
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">Meal Type</label>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => set("mealType", type)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-manipulation ${
                    form.mealType === type
                      ? "bg-[#D1FD52]/10 text-[#D1FD52] border-[#D1FD52]/30"
                      : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Calories */}
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">Calories (kcal) *</label>
            <input
              type="number"
              placeholder="e.g. 450"
              value={form.calories}
              onChange={(e) => set("calories", e.target.value)}
              className={inputCls(errors.calories)}
            />
            {errors.calories && <p className="text-red-400 text-[10px] mt-1">{errors.calories}</p>}
          </div>

          {/* Macros — 3 col on all sizes (fields are simple enough) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: "protein", label: "Protein (g)" },
              { key: "carbs",   label: "Carbs (g)"   },
              { key: "fat",     label: "Fat (g)"     },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[11px] text-white/40 mb-1.5">{label}</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className={inputCls(false)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#D1FD52] hover:bg-[#bfea3a] text-[#131313] transition-colors touch-manipulation"
          >
            + Add to Log
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RESULT CARD (AI analysis output)
// ─────────────────────────────────────────────

function ResultCard({ result, onLog, isLogging }) {
  if (!result) return null;

  const macros = [
    { label: "Protein", value: result.protein, unit: "g", color: "#60a5fa", pct: (result.protein / MACRO_TARGETS.protein) * 100 },
    { label: "Carbs",   value: result.carbs,   unit: "g", color: "#D1FD52", pct: (result.carbs   / MACRO_TARGETS.carbs)   * 100 },
    { label: "Fat",     value: result.fat,     unit: "g", color: "#f97316", pct: (result.fat     / MACRO_TARGETS.fat)     * 100 },
  ];

  return (
    <div className="bg-[#1c1c1c] rounded-2xl p-4 sm:p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <SectionLabel text="Analysis Result" />
        <span className="text-[10px] bg-[#D1FD52]/10 text-[#D1FD52] px-2 py-0.5 rounded-full font-semibold">
          AI Estimated
        </span>
      </div>

      <div className="flex items-start gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
          🍽️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#e5e2e1] font-semibold text-sm sm:text-base leading-tight truncate">
            {result.food_name}
          </p>
          {result.suggestion && (
            <p className="text-white/40 text-[10px] mt-1 italic line-clamp-2">"{result.suggestion}"</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl sm:text-2xl font-black text-[#D1FD52]">{result.calories}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wide">kcal</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
        {macros.map((m) => <MacroBar key={m.label} {...m} />)}
      </div>

      <button
        onClick={() => onLog(result)}
        disabled={isLogging}
        className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/5 hover:bg-[#D1FD52]/10 hover:text-[#D1FD52] text-[#e5e2e1] border border-white/10 transition-all touch-manipulation disabled:opacity-50"
      >
        {isLogging ? (
          <span className="flex items-center justify-center gap-2"><Spinner /> Saving...</span>
        ) : (
          "+ Log This Meal"
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// DAILY SUMMARY — fetches from GET /api/nutrition/:userId/:date
// ─────────────────────────────────────────────

function DailySummary({ userId, refreshSeed }) {
  const [summary, setSummary] = useState({
    total_calories: 0,
    total_protein:  0,
    total_carbs:    0,
    total_fat:      0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiFetchDailySummary(userId)
      .then(setSummary)
      .catch((err) => console.error("DailySummary fetch error:", err))
      .finally(() => setLoading(false));
  }, [userId, refreshSeed]); // re-fetches when refreshSeed increments

  const consumed  = Math.round(summary.total_calories);
  const remaining = Math.max(CALORIE_GOAL - consumed, 0);
  const pct       = Math.min((consumed / CALORIE_GOAL) * 100, 100);
  const over      = consumed > CALORIE_GOAL;

  const macroRows = [
    { label: "Protein", value: `${Math.round(summary.total_protein)}g`, target: `${MACRO_TARGETS.protein}g`, pct: (summary.total_protein / MACRO_TARGETS.protein) * 100, color: "#60a5fa" },
    { label: "Carbs",   value: `${Math.round(summary.total_carbs)}g`,   target: `${MACRO_TARGETS.carbs}g`,   pct: (summary.total_carbs   / MACRO_TARGETS.carbs)   * 100, color: "#D1FD52" },
    { label: "Fat",     value: `${Math.round(summary.total_fat)}g`,     target: `${MACRO_TARGETS.fat}g`,     pct: (summary.total_fat     / MACRO_TARGETS.fat)     * 100, color: "#f97316" },
  ];

  return (
    <div className="bg-[#1c1c1c] rounded-2xl p-4 sm:p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <SectionLabel text="Daily Summary" />
        {loading && <Spinner />}
      </div>

      {/* Goal / Consumed / Remaining tiles */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {[
          { label: "Goal",               val: CALORIE_GOAL, cls: "text-[#e5e2e1]"                          },
          { label: "Consumed",           val: consumed,     cls: over ? "text-red-400" : "text-[#D1FD52]"  },
          { label: over ? "Over" : "Left", val: over ? "0" : remaining, cls: over ? "text-red-400" : "text-[#e5e2e1]" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-white/5 rounded-xl p-2 sm:p-3 text-center">
            <p className={`text-base sm:text-lg font-black ${cls}`}>{val}</p>
            <p className="text-[9px] sm:text-[10px] text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Calorie progress bar */}
      <div className="mb-4 sm:mb-5">
        <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
          <span>Calorie progress</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: over ? "#ef4444" : "#D1FD52" }}
          />
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="space-y-2 sm:space-y-3">
        {macroRows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-white/50">{r.label}</span>
              <span className="text-xs text-white/50">{r.value} / {r.target}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(r.pct, 100)}%`, background: r.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MEAL HISTORY — fetches from GET /api/food-logs/:userId
// ─────────────────────────────────────────────

function MealHistory({ meals, loading }) {
  return (
    <div className="bg-[#1c1c1c] rounded-2xl p-4 sm:p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <SectionLabel text="Today's Meals" />
        {loading && <Spinner />}
      </div>

      {meals.length === 0 ? (
        <p className="text-white/30 text-xs sm:text-sm text-center py-6 sm:py-8">
          No meals logged yet
        </p>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 flex items-center justify-center text-base sm:text-lg flex-shrink-0">
                {meal.emoji || "🍽️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#e5e2e1] truncate">{meal.food_name}</p>
                <p className="text-[10px] text-white/30">{meal.logged_at}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-bold text-[#D1FD52]">{meal.calories} kcal</p>
                {(meal.protein || meal.carbs || meal.fat) ? (
                  <p className="text-[9px] sm:text-[10px] text-white/30 hidden sm:block">
                    P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT: NutritionTracker
// ─────────────────────────────────────────────

const NutritionTracker = () => {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const USER_ID    = storedUser?.id || storedUser?.user?.id || null;

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [result,          setResult]          = useState(null);
  const [isAnalyzing,     setIsAnalyzing]     = useState(false);
  const [isLogging,       setIsLogging]       = useState(false);
  const [history,         setHistory]         = useState([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const [toast,           setToast]           = useState(null);
  // Increment to trigger DailySummary re-fetch without remounting
  const [summarySeed,     setSummarySeed]     = useState(0);

  useEffect(() => {
    if (!USER_ID) { navigate("/login"); return; }
    loadHistory();
  }, [USER_ID]);

  // ── Data loaders ──────────────────────────────

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiFetchFoodLogs(USER_ID);
      if (data.records) setHistory(data.records);
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Toast helper ─────────────────────────────

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Handlers wired to API functions ──────────

  /** Called by UploadSection after image is selected */
  const handleAnalyze = async (base64Image) => {
    if (!base64Image) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await apiAnalyzeFoodImage(base64Image);
      setResult(data);
    } catch (err) {
      showToast("❌ Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** Called by ResultCard "Log This Meal" button and ManualLogForm submit */
  const handleLog = async (meal) => {
    setIsLogging(true);
    try {
      await apiSaveFoodLog(USER_ID, meal);
      showToast(`✓ ${meal.food_name} saved!`);
      setResult(null);
      await loadHistory();
      setSummarySeed((s) => s + 1); // triggers DailySummary re-fetch
    } catch (err) {
      showToast(`❌ ${err.message || "Could not save meal."}`);
    } finally {
      setIsLogging(false);
    }
  };

  const consumed = history.reduce((sum, m) => sum + (m.calories || 0), 0);

  return (
    <div className="min-h-screen min-h-dvh bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif]">

      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
        />
      </div>

      <Topbar sidebarExpanded={sidebarExpanded} userId={USER_ID} />

      <main
        className={`pt-[64px] sm:pt-[72px] md:pt-[80px] pb-24 md:pb-8
                    px-3 sm:px-4 md:px-6 lg:px-8
                    transition-all duration-400
                    ${sidebarExpanded ? "md:ml-[240px]" : "md:ml-[72px]"}`}
      >
        <div className="max-w-5xl mx-auto">

          {/* Page heading */}
          <div className="mb-4 sm:mb-6 pt-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#e5e2e1]">Nutrition Tracker</h1>
            <p className="text-white/40 text-xs sm:text-sm mt-0.5">
              {consumed} / {CALORIE_GOAL} kcal today
            </p>
          </div>

          {/*
            Responsive grid:
              mobile  → 1 column, everything stacks
              md      → 2 columns
              lg      → 3 columns (upload | summary | history)
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Column 1: Upload + AI result + Manual log */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
              {result && (
                <ResultCard result={result} onLog={handleLog} isLogging={isLogging} />
              )}
              <ManualLogForm onLog={handleLog} />
            </div>

            {/* Column 2: Daily summary */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <DailySummary userId={USER_ID} refreshSeed={summarySeed} />
            </div>

            {/* Column 3: Meal history — on md, spans both cols so it sits below */}
            <div className="flex flex-col gap-3 sm:gap-4 md:col-span-2 lg:col-span-1">
              <MealHistory meals={history} loading={historyLoading} />
            </div>

          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
};

export default NutritionTracker;