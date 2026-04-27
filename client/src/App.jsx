import { useMemo, useState } from "react";
import Dots from "./components/Dots";
import {
  CITIES,
  BANGALORE_AREAS,
  CUISINES,
  BUDGET_OPTS,
  VIBES,
} from "./assets/data";

function App() {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  const [step, setStep] = useState(0);
  const [city, setCity] = useState("Bangalore");
  const [area, setArea] = useState("Bellandur");
  const [cuisine, setCuisine] = useState("Fast food");
  const [budget, setBudget] = useState("medium");
  const [minRating, setMinRating] = useState(3.5);
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const ratingPercent = useMemo(
    () => ((minRating - 3.5) / 1.5) * 100,
    [minRating],
  );

  const toggleVibe = (vibe) => {
    setVibes((prev) =>
      prev.includes(vibe) ? prev.filter((x) => x !== vibe) : [...prev, vibe],
    );
  };

  const handleFetchRecommendations = async () => {
    setLoading(true);
    setError("");
    setStep(3);

    try {
      const payload = {
        location: city,
        area: area === "Any" ? null : area,
        budget,
        cuisine: cuisine === "Any" ? [] : [cuisine],
        minRating,
        preferences: vibes,
      };

      const response = await fetch(`${apiBaseUrl}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate recommendations");
      }

      const recs = Array.isArray(data.recommendations)
        ? data.recommendations
        : [];
      if (!recs.length) {
        throw new Error("No restaurants found. Try relaxing your filters.");
      }

      setRecommendations(recs);
      setSummary(
        data.meta?.llmUsed
          ? "Curated using Groq-powered ranking and personalized explanation."
          : "Ranked using smart rule-based filtering and fallback explanation.",
      );
      setStep(4);
    } catch (err) {
      setError(
        err.message || "Something went wrong while fetching recommendations.",
      );
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep(0);
    setCity("Bangalore");
    setArea("Bellandur");
    setCuisine("Fast food");
    setBudget("medium");
    setMinRating(3.5);
    setVibes([]);
    setRecommendations([]);
    setSummary("");
    setError("");
  };

  const selectClass =
    "w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-amber-50 appearance-none cursor-pointer focus:outline-none focus:border-amber-400/50 transition-colors";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#09090A_0%,#0E0D0B_50%,#0B0A08_100%)] text-amber-50">
      <div className="pointer-events-none fixed left-1/2 top-[-15%] z-0 h-[360px] w-[720px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(212,175,55,0.05)_0%,transparent_68%)]" />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
        <header className="mb-2 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
              ✦ AI Dining Concierge ✦
            </span>
          </div>
          <h1 className="bg-[linear-gradient(140deg,#F9F1DC_10%,#D4AF37_45%,#F0E0A0_60%,#C4920A_90%)] bg-clip-text text-4xl font-bold leading-tight text-transparent md:text-5xl">
            Your Table Awaits
          </h1>
          <p className="mt-3 font-mono text-xs tracking-[0.08em] text-white/40">
            Three steps to your perfect restaurant
          </p>
        </header>

        <div className="my-7 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/35" />
          <span className="text-[10px] text-amber-300/60">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/35" />
        </div>

        {step < 4 && step !== 3 && <Dots current={step} total={3} />}

        {step === 0 && (
          <section className="animate-[fadeUp_0.45s_ease]">
            <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-amber-300/70">
              Bangalore is currently available
            </p>
            <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CITIES.map((option) => (
                <button
                  key={option}
                  onClick={() => setCity(option)}
                  className={`rounded-xl border p-5 text-left transition-all duration-300 ${
                    city === option
                      ? "scale-[1.02] border-amber-400/60 bg-amber-400/10 shadow-[0_0_28px_rgba(212,175,55,0.1)]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-2 text-2xl">🌿</div>
                  <div
                    className={`font-serif text-lg ${city === option ? "text-amber-50" : "text-white/70"}`}
                  >
                    {option}
                  </div>
                </button>
              ))}
            </div>
            <button
              disabled={!city}
              onClick={() => setStep(1)}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-700 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {city ? `Explore ${city} →` : "Select a city"}
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="animate-[fadeUp_0.45s_ease]">
            <p className="mb-7 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-amber-300/70">
              Define your appetite
            </p>

            <div className="mb-7">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                Area
              </p>
              <div className="relative">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={selectClass}
                >
                  {BANGALORE_AREAS.map((option) => (
                    <option
                      key={option}
                      value={option}
                      className="bg-[#0E0D0B] capitalize"
                    >
                      {option}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/60 text-xs">
                  ▾
                </span>
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                Cuisine
              </p>
              <div className="relative">
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className={selectClass}
                >
                  {CUISINES.map((option) => (
                    <option
                      key={option}
                      value={option}
                      className="bg-[#0E0D0B] capitalize"
                    >
                      {option}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/60 text-xs">
                  ▾
                </span>
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                Budget
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {BUDGET_OPTS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setBudget(option.key)}
                    className={`rounded-xl border px-3 py-4 text-center transition-all ${
                      budget === option.key
                        ? "scale-[1.02] border-amber-400/60 bg-amber-400/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="mb-1 text-lg">{option.icon}</div>
                    <div
                      className={`text-sm font-semibold ${budget === option.key ? "text-amber-300" : "text-white/70"}`}
                    >
                      {option.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-white/40">
                      {option.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                Minimum rating —{" "}
                <span className="text-amber-300">{minRating.toFixed(1)} ★</span>
              </p>
              <input
                type="range"
                min="3.5"
                max="5"
                step="0.1"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-1 w-full appearance-none rounded-md bg-white/10"
                style={{
                  background: `linear-gradient(to right, #d4af37 ${ratingPercent}%, rgba(255,255,255,0.12) ${ratingPercent}%)`,
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-xl border border-white/15 px-4 py-3 font-mono text-xs text-white/60"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-700 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black"
              >
                Set the Mood →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="animate-[fadeUp_0.45s_ease]">
            <p className="mb-1 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-amber-300/70">
              What&apos;s the vibe?
            </p>
            <p className="mb-7 text-center font-mono text-xs text-white/35">
              Pick all that resonate
            </p>
            <div className="mb-7 flex flex-wrap justify-center gap-2">
              {VIBES.map((vibe) => {
                const active = vibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    className={`rounded-full border px-4 py-2 text-xs transition-all ${
                      active
                        ? "scale-105 border-amber-400/70 bg-amber-400/10 text-amber-300"
                        : "border-white/10 bg-white/[0.03] text-white/60"
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center font-mono text-xs text-red-300">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-white/15 px-4 py-3 font-mono text-xs text-white/60"
              >
                ← Back
              </button>
              <button
                onClick={handleFetchRecommendations}
                disabled={!city || loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-700 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black disabled:opacity-50"
              >
                ✦ Summon My Table ✦
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="py-14 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-2 border-amber-300/70 border-t-transparent" />
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-amber-300/80">
              Curating your perfect table...
            </p>
          </section>
        )}

        {step === 4 && (
          <section className="animate-[fadeUp_0.45s_ease]">
            <div className="mb-8 text-center">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300/60">
                Curated for you · {city}
                {area !== "Any" ? ` · ${area}` : ""}
              </p>
              {summary && (
                <p className="mx-auto max-w-xl text-sm italic leading-7 text-white/60">
                  &quot;{summary}&quot;
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {recommendations.map((rec, idx) => (
                <article
                  key={rec.restaurantId || rec.name}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_25px_rgba(0,0,0,0.35)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl text-amber-50">
                        {rec.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/55">
                        📍 {rec.locality ? `${rec.locality}, ` : ""}
                        {rec.city}
                      </p>
                    </div>
                    <span className="rounded border border-amber-300/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2 text-xs text-white/65">
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      {(rec.cuisine || []).join(", ") || "Cuisine N/A"}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      ★ {rec.rating ?? "N/A"}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      ₹{rec.estimatedCost ?? "N/A"} for two
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      {rec.costBucket || "budget N/A"}
                    </span>
                  </div>
                  <p className="border-l-2 border-amber-400/40 pl-3 text-sm leading-7 text-white/70">
                    {rec.explanation ||
                      "A strong option matching your preferences."}
                  </p>
                </article>
              ))}
            </div>

            <div className="my-7 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/35" />
              <span className="text-[10px] text-amber-300/60">✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/35" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetAll}
                className="rounded-xl border border-white/15 px-4 py-3 font-mono text-xs text-white/60"
              >
                ↺ Start Over
              </button>

              <button
                onClick={() => setStep(2)}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-700 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black"
              >
                Refine →
              </button>
            </div>
          </section>
        )}

        <footer className="mt-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/20">
            Powered by Groq + Node API · Multi-step AI dining concierge
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
