import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Colors & fonts ──────────────────────────────────────────────────────────
const C = {
  bg:      "#14161A",
  surface: "#1E2128",
  card:    "#252930",
  border:  "#2E333D",
  gold:    "#E2C41F",
  goldDk:  "#B8A018",
  white:   "#FFFFFF",
  dim:     "#8B8FA8",
  red:     "#E63232",
  green:   "#27AE60",
};
const F = "system-ui,-apple-system,'Helvetica Neue',sans-serif";

// ─── Scoring ─────────────────────────────────────────────────────────────────
function calcPts(pred, hs, as_) {
  if (!pred || hs == null || as_ == null) return null;
  const [ph, pa] = pred.split(":").map(Number);
  if (isNaN(ph) || isNaN(pa)) return null;
  if (ph === hs && pa === as_) return 5;
  const win = (h, a) => h > a ? 1 : h < a ? -1 : 0;
  if (win(ph, pa) !== win(hs, as_)) return 0;
  if ((ph - pa) === (hs - as_)) return 3;
  return 1;
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "gold", full, sm, disabled }) {
  const base = {
    fontFamily: F, fontWeight: 900, fontSize: sm ? 11 : 14,
    textTransform: "uppercase", letterSpacing: 0.5, border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    padding: sm ? "8px 12px" : "13px 18px",
    borderRadius: 6, display: "block",
    width: full ? "100%" : "auto", transition: "opacity .15s",
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    gold:  { ...base, background: C.gold,    color: C.bg },
    dark:  { ...base, background: C.surface, color: C.white, border: `1px solid ${C.border}` },
    red:   { ...base, background: C.red,     color: C.white },
    ghost: { ...base, background: "transparent", color: C.dim, border: `1px solid ${C.border}` },
  };
  return <button onClick={disabled ? undefined : onClick} style={variants[variant]}>{children}</button>;
}

function Scroll({ children }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", background: C.bg }}>
      {children}
    </div>
  );
}

function Hero({ title, sub }) {
  return (
    <div style={{ background: C.surface, padding: "20px 20px 0", borderBottom: `1px solid ${C.border}` }}>
      {sub && <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{sub}</div>}
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 28, color: C.white, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 16 }}>{title}</div>
    </div>
  );
}

function StatCard({ value, label, highlight }) {
  return (
    <div style={{ flex: 1, background: C.surface, padding: "12px 6px", textAlign: "center", borderRadius: 8, border: `1px solid ${C.border}` }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 24, color: highlight ? C.gold : C.white }}>{value}</div>
      <div style={{ fontFamily: F, fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function TopBar({ isAdmin }) {
  return (
    <div style={{ background: C.surface, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 36, height: 36, background: C.gold, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚽</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 14, color: C.white }}>Футболофф · ЧМ 2026</div>
        <div style={{ fontFamily: F, fontSize: 9, color: C.gold, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{isAdmin ? "● ADMIN" : "● ONLINE"}</div>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, isAdmin }) {
  const tabs = isAdmin
    ? [["home", "⚽", "Главная"], ["preds", "✏️", "Прогнозы"], ["matches", "⚙️", "Счета"], ["lb", "🏆", "Рейтинг"], ["users", "👥", "Люди"]]
    : [["home", "⚽", "Главная"], ["preds", "✏️", "Прогнозы"], ["lb", "🏆", "Рейтинг"]];
  return (
    <div style={{ display: "flex", background: C.surface, flexShrink: 0, borderTop: `1px solid ${C.border}` }}>
      {tabs.map(([id, icon, label]) => (
        <button key={id} onClick={() => setTab(id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 3, border: "none", background: tab === id ? C.gold + "22" : "transparent",
          cursor: "pointer", padding: "10px 2px", borderTop: tab === id ? `2px solid ${C.gold}` : "2px solid transparent",
        }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontFamily: F, fontSize: 8, fontWeight: 700, color: tab === id ? C.gold : C.dim, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Not registered screen ───────────────────────────────────────────────────
function NotRegistered() {
  return (
    <Scroll>
      <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 56 }}>⚽</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 22, color: C.white }}>Добро пожаловать!</div>
        <div style={{ fontFamily: F, fontSize: 14, color: C.dim, lineHeight: 1.6 }}>
          Ты ещё не зарегистрирован в игре.<br />
          Напиши боту <span style={{ color: C.gold, fontWeight: 700 }}>@futboloff_bot</span> команду <span style={{ color: C.gold, fontWeight: 700 }}>/start</span> и выбери своё имя.
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: C.dim, marginTop: 8 }}>После регистрации вернись сюда.</div>
      </div>
    </Scroll>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────
function Home({ user, matches, preds, users, setTab }) {
  const played = matches.filter(m => m.home_score != null);
  const total = matches.length;

  const userPts = (uid) => {
    let pts = 0, exact = 0;
    for (const m of played) {
      const p = preds.find(x => x.user_id === uid && x.match_id === m.id);
      const sc = calcPts(p?.prediction ?? null, m.home_score, m.away_score);
      if (sc != null) { pts += sc; if (sc === 5) exact++; }
    }
    return { pts, exact };
  };

  const me = userPts(user.id);
  const ranked = [...users].map(u => ({ ...u, ...userPts(u.id) })).sort((a, b) => b.pts - a.pts || b.exact - a.exact);
  const rank = ranked.findIndex(u => u.id === user.id) + 1;
  const next = matches.find(m => m.home_score == null);
  const myNextPred = next ? preds.find(p => p.user_id === user.id && p.match_id === next.id) : null;

  return (
    <Scroll>
      <div style={{ background: C.surface, padding: "20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: F, fontSize: 11, color: C.dim, marginBottom: 4 }}>Привет,</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 30, color: C.white, marginBottom: 16 }}>{user.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard value={me.pts} label="Очков" highlight />
          <StatCard value={`#${rank}`} label="Место" />
          <StatCard value={`${played.length}/${total}`} label="Матчей" />
        </div>
      </div>

      {next && (
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.dim, marginBottom: 8 }}>Ближайший матч</div>
          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 10 }}>
              Группа {next.group_name} · {fmtDate(next.match_date)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <div style={{ flex: 1, fontFamily: F, fontWeight: 900, fontSize: 15, color: C.white }}>{next.home_team}</div>
              <div style={{ fontFamily: F, fontSize: 11, color: C.dim, padding: "0 8px", fontWeight: 700 }}>VS</div>
              <div style={{ flex: 1, fontFamily: F, fontWeight: 900, fontSize: 15, color: C.white, textAlign: "right" }}>{next.away_team}</div>
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: C.dim, marginBottom: 14 }}>
              Твой прогноз: <span style={{ color: myNextPred ? C.gold : C.red, fontWeight: 700 }}>{myNextPred?.prediction || "не введён"}</span>
            </div>
            <Btn onClick={() => setTab("preds")} full>{myNextPred ? "Изменить прогноз" : "⚡ Ввести прогноз"}</Btn>
          </div>
        </div>
      )}

      <div style={{ padding: "0 16px 24px" }}>
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.dim, marginBottom: 8 }}>Топ участников</div>
        {ranked.slice(0, 5).map((u, i) => {
          const me_ = u.id === user.id;
          return (
            <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "12px 14px", background: me_ ? C.gold + "22" : C.surface, marginBottom: 4, borderRadius: 8, border: `1px solid ${me_ ? C.gold : C.border}` }}>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 14, width: 28, color: i === 0 ? C.gold : C.dim }}>{["🥇","🥈","🥉"][i] || i + 1}</div>
              <div style={{ flex: 1, fontFamily: F, fontWeight: 700, fontSize: 14, color: me_ ? C.gold : C.white }}>{u.name}{me_ ? " ←" : ""}</div>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 18, color: me_ ? C.gold : C.white }}>{u.pts}<span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>pts</span></div>
            </div>
          );
        })}
        <div style={{ marginTop: 8 }}><Btn onClick={() => setTab("lb")} variant="dark" full sm>Полный рейтинг →</Btn></div>
      </div>
    </Scroll>
  );
}

// ─── Predictions ─────────────────────────────────────────────────────────────
function Preds({ user, matches, preds, onPredSaved }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localPred, setLocalPred] = useState("0:0");

  function openEdit(m) {
    const ex = preds.find(p => p.user_id === user.id && p.match_id === m.id);
    setLocalPred(ex?.prediction || "0:0");
    setEditing(m);
  }

  async function savePred() {
    if (!editing || saving) return;
    setSaving(true);
    await sb.from("predictions").upsert(
      { user_id: user.id, match_id: editing.id, prediction: localPred },
      { onConflict: "user_id,match_id" }
    );
    await onPredSaved();
    setSaving(false);
    setEditing(null);
  }

  function chg(side, d) {
    const [h, a] = localPred.split(":").map(Number);
    const arr = [h, a];
    arr[side] = Math.max(0, Math.min(15, arr[side] + d));
    setLocalPred(arr.join(":"));
  }

  if (editing) {
    const [h, a] = localPred.split(":").map(Number);
    const hint = h > a ? `Победа ${editing.home_team}` : a > h ? `Победа ${editing.away_team}` : "Ничья";
    return (
      <Scroll>
        <div style={{ background: C.surface, padding: "20px 16px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 6 }}>
            Группа {editing.group_name} · {fmtDate(editing.match_date)}
          </div>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: C.white, marginBottom: 16 }}>{editing.home_team} — {editing.away_team}</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.dim, textAlign: "center", marginBottom: 20 }}>Твой прогноз</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 24 }}>
            {[0, 1].map(side => (
              <div key={side} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 8 }}>{side === 0 ? editing.home_team : editing.away_team}</div>
                <button onClick={() => chg(side, 1)} style={{ display: "block", width: 64, background: C.surface, border: `1px solid ${C.border}`, padding: "10px 0", color: C.white, fontSize: 16, cursor: "pointer", fontWeight: 900, margin: "0 auto", borderRadius: 6 }}>▲</button>
                <div style={{ width: 64, height: 64, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: C.bg, fontFamily: F, margin: "4px auto", borderRadius: 8 }}>{side === 0 ? h : a}</div>
                <button onClick={() => chg(side, -1)} style={{ display: "block", width: 64, background: C.surface, border: `1px solid ${C.border}`, padding: "10px 0", color: C.white, fontSize: 16, cursor: "pointer", fontWeight: 900, margin: "0 auto", borderRadius: 6 }}>▼</button>
              </div>
            ))}
            <div style={{ fontFamily: F, fontSize: 44, fontWeight: 900, color: C.dim, marginTop: 8 }}>:</div>
          </div>
          <div style={{ background: C.surface, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 20 }}>{h > a ? "🏠" : a > h ? "✈️" : "🤝"}</span>
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.white }}>{hint}</span>
          </div>
          <Btn full onClick={savePred} disabled={saving}>{saving ? "Сохраняем..." : "💾 Сохранить прогноз"}</Btn>
          <div style={{ marginTop: 8 }}><Btn full variant="ghost" onClick={() => setEditing(null)}>Назад</Btn></div>
        </div>
      </Scroll>
    );
  }

  return (
    <Scroll>
      <Hero title="Мои прогнозы" sub="Нажми для изменения" />
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {matches.map(m => {
          const pred = preds.find(p => p.user_id === user.id && p.match_id === m.id);
          const pts = calcPts(pred?.prediction ?? null, m.home_score, m.away_score);
          const canEdit = m.home_score == null;
          return (
            <div key={m.id} onClick={() => canEdit && openEdit(m)} style={{
              display: "flex", alignItems: "center", padding: "13px 14px",
              background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`,
              cursor: canEdit ? "pointer" : "default",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: C.white }}>{m.home_team} — {m.away_team}</div>
                <div style={{ fontFamily: F, fontSize: 10, color: C.dim, marginTop: 2 }}>Гр. {m.group_name} · {fmtDate(m.match_date)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {pts != null && (
                  <span style={{ fontFamily: F, fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 4, background: pts === 5 ? C.gold + "33" : pts >= 1 ? C.green + "22" : C.red + "22", color: pts === 5 ? C.gold : pts >= 1 ? C.green : C.red }}>
                    {pts}pts
                  </span>
                )}
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: 13, padding: "5px 10px", background: pred ? (m.home_score != null ? C.gold + "33" : C.border) : C.red + "22", color: pred ? (m.home_score != null ? C.gold : C.white) : C.red, borderRadius: 6, minWidth: 48, textAlign: "center" }}>
                  {pred?.prediction || (canEdit ? "ввести" : "—")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Scroll>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function LB({ user, users, matches, preds }) {
  const played = matches.filter(m => m.home_score != null);

  const ranked = [...users].map(u => {
    let pts = 0, exact = 0;
    for (const m of played) {
      const p = preds.find(x => x.user_id === u.id && x.match_id === m.id);
      const sc = calcPts(p?.prediction ?? null, m.home_score, m.away_score);
      if (sc != null) { pts += sc; if (sc === 5) exact++; }
    }
    return { ...u, pts, exact };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);

  return (
    <Scroll>
      <Hero title="Рейтинг" sub={`${users.length} участников · ${played.length} матчей сыграно`} />
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {ranked.map((u, i) => {
          const me = u.id === user.id;
          return (
            <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "12px 14px", background: me ? C.gold + "22" : C.surface, borderRadius: 8, border: `1px solid ${me ? C.gold : C.border}` }}>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 15, width: 30, color: i === 0 ? C.gold : i < 3 ? C.dim : C.dim }}>{["🥇","🥈","🥉"][i] || i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: me ? C.gold : C.white }}>{u.name}{me ? " ←" : ""}</div>
                <div style={{ fontFamily: F, fontSize: 10, color: me ? C.goldDk : C.dim }}>⭐ {u.exact} точных</div>
              </div>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: me ? C.gold : C.white }}>{u.pts}<span style={{ fontSize: 10, marginLeft: 2, opacity: 0.5 }}>pts</span></div>
            </div>
          );
        })}
      </div>
    </Scroll>
  );
}

// ─── Admin: Scores ────────────────────────────────────────────────────────────
function AdminMatches({ matches, onUpdate }) {
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(null);

  async function save(m) {
    const vals = inputs[m.id];
    if (!vals || vals[0] === "" || vals[1] === "") return;
    setSaving(m.id);
    await sb.from("matches").update({ home_score: Number(vals[0]), away_score: Number(vals[1]) }).eq("id", m.id);
    await onUpdate();
    setSaving(null);
  }

  return (
    <Scroll>
      <Hero title="Счета матчей" />
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {matches.map(m => {
          const inp = inputs[m.id];
          const h = inp?.[0] ?? (m.home_score != null ? String(m.home_score) : "");
          const a = inp?.[1] ?? (m.away_score != null ? String(m.away_score) : "");
          const done = m.home_score != null;
          return (
            <div key={m.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${done ? C.gold + "44" : C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "6px 14px", background: done ? C.gold + "11" : C.card, display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase" }}>Гр.{m.group_name} · {fmtDate(m.match_date)}</span>
                <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: done ? C.gold : C.dim, textTransform: "uppercase" }}>{done ? "✓ Завершён" : "Ожидается"}</span>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, fontFamily: F, fontWeight: 700, fontSize: 13, color: C.white }}>{m.home_team}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {[0, 1].map(side => (
                    <span key={side} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="number" min="0" max="20" value={side === 0 ? h : a} placeholder="—"
                        style={{ width: 46, height: 40, background: done ? C.gold + "22" : C.bg, border: `1px solid ${done ? C.gold : C.border}`, color: done ? C.gold : C.white, fontSize: 20, fontWeight: 900, textAlign: "center", outline: "none", fontFamily: F, borderRadius: 6 }}
                        onChange={e => {
                          const v = e.target.value;
                          setInputs(s => {
                            const cur = s[m.id] || [String(m.home_score ?? ""), String(m.away_score ?? "")];
                            return { ...s, [m.id]: side === 0 ? [v, cur[1]] : [cur[0], v] };
                          });
                        }}
                      />
                      {side === 0 && <span style={{ fontFamily: F, fontSize: 18, fontWeight: 900, color: C.dim }}>:</span>}
                    </span>
                  ))}
                </div>
                <div style={{ flex: 1, fontFamily: F, fontWeight: 700, fontSize: 13, color: C.white, textAlign: "right" }}>{m.away_team}</div>
              </div>
              <div style={{ padding: "0 14px 12px" }}>
                <Btn full sm onClick={() => save(m)} disabled={saving === m.id || (h === "" || a === "")} variant={done ? "dark" : "gold"}>
                  {saving === m.id ? "Сохраняем..." : done ? "Обновить счёт" : "Сохранить результат"}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
    </Scroll>
  );
}

// ─── Admin: Users ─────────────────────────────────────────────────────────────
function AdminUsers({ users, matches, preds }) {
  const played = matches.filter(m => m.home_score != null);
  const withPts = users.map(u => {
    let pts = 0;
    for (const m of played) {
      const p = preds.find(x => x.user_id === u.id && x.match_id === m.id);
      const sc = calcPts(p?.prediction ?? null, m.home_score, m.away_score);
      if (sc != null) pts += sc;
    }
    return { ...u, pts };
  });
  return (
    <Scroll>
      <Hero title="Участники" sub={`${users.length} человек`} />
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {withPts.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "12px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ width: 38, height: 38, background: u.telegram_id ? C.gold : C.border, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 16, color: u.telegram_id ? C.bg : C.dim, marginRight: 12, flexShrink: 0 }}>
              {u.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.white }}>{u.name}</div>
              <div style={{ fontFamily: F, fontSize: 10, color: u.telegram_id ? C.green : C.red }}>{u.telegram_id ? "✓ В Telegram" : "✗ Не зарегистрирован"}</div>
            </div>
            <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16, color: C.gold }}>{u.pts}pts</div>
          </div>
        ))}
      </div>
    </Scroll>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);        // logged-in user row
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [matches, setMatches] = useState([]);
  const [preds, setPreds] = useState([]);
  const [users, setUsers] = useState([]);

  // Telegram Mini App auth
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.ready();
    const tgUser = tg?.initDataUnsafe?.user;
    const telegramId = tgUser?.id;

    if (!telegramId) {
      // Dev fallback: try URL param ?uid=1
      const uid = new URLSearchParams(location.search).get("uid");
      if (uid) {
        sb.from("users").select("*").eq("id", uid).single().then(({ data }) => {
          if (data) setUser(data);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
      return;
    }

    sb.from("users").select("*").eq("telegram_id", telegramId).single().then(({ data }) => {
      if (data) setUser(data);
      setLoading(false);
    });
  }, []);

  const loadData = useCallback(async () => {
    const [mRes, pRes, uRes] = await Promise.all([
      sb.from("matches").select("*").order("id"),
      sb.from("predictions").select("*"),
      sb.from("users").select("id,name,role,telegram_id").in("role", ["participant","owner","admin"]).neq("id", 98).order("id"),
    ]);
    if (mRes.data) setMatches(mRes.data);
    if (pRes.data) setPreds(pRes.data);
    if (uRes.data) setUsers(uRes.data);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 40 }}>⚽</div>
        <div style={{ fontFamily: F, color: C.dim, fontSize: 14 }}>Загружаем...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <TopBar isAdmin={false} />
        <NotRegistered />
      </div>
    );
  }

  function screen() {
    if (tab === "home")    return isAdmin ? <AdminHome user={user} matches={matches} preds={preds} users={users} setTab={setTab} /> : <Home user={user} matches={matches} preds={preds} users={users} setTab={setTab} />;
    if (tab === "preds")   return <Preds user={user} matches={matches} preds={preds} onPredSaved={loadData} />;
    if (tab === "lb")      return <LB user={user} users={users} matches={matches} preds={preds} />;
    if (tab === "matches") return <AdminMatches matches={matches} onUpdate={loadData} />;
    if (tab === "users")   return <AdminUsers users={users} matches={matches} preds={preds} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <TopBar isAdmin={isAdmin} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {screen()}
      </div>
      <BottomNav tab={tab} setTab={setTab} isAdmin={isAdmin} />
    </div>
  );
}

// ─── Admin Home ───────────────────────────────────────────────────────────────
function AdminHome({ user, matches, preds, users, setTab }) {
  const played = matches.filter(m => m.home_score != null);
  return (
    <Scroll>
      <div style={{ background: C.surface, padding: "20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>Панель администратора</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 28, color: C.white, marginBottom: 16 }}>{user.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard value={played.length} label="Сыграно" highlight />
          <StatCard value={matches.length - played.length} label="Осталось" />
          <StatCard value={users.length} label="Участников" />
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          ["⚙️", "Ввести счета", "Результаты матчей", "matches"],
          ["🏆", "Рейтинг", "Общая таблица", "lb"],
          ["👥", "Участники", "Статус регистрации", "users"],
        ].map(([icon, t, d, id]) => (
          <button key={id} onClick={() => setTab(id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: id === "matches" ? C.gold + "22" : C.surface, border: `1px solid ${id === "matches" ? C.gold : C.border}`, cursor: "pointer", fontFamily: F, textAlign: "left", borderRadius: 10 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: C.white, marginBottom: 2 }}>{t}</div>
              <div style={{ fontSize: 10, color: C.dim }}>{d}</div>
            </div>
            <span style={{ color: C.gold, fontSize: 18, fontWeight: 900 }}>›</span>
          </button>
        ))}
      </div>
    </Scroll>
  );
}
