import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const useW = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const fn = () => setW(window.innerWidth); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  return w;
};

const TEMAS = {
  dark:   { bg: "#060a10", surface: "#0c1220", border: "#141e2e", text: "#e8edf5", muted: "#4a5872", nome: "🌑 Dark" },
  blue:   { bg: "#050d1a", surface: "#0a1628", border: "#0f2040", text: "#e8edf5", muted: "#4a6080", nome: "🌊 Dark Blue" },
  purple: { bg: "#0a0510", surface: "#130a20", border: "#1e0f35", text: "#e8edf5", muted: "#5a4a70", nome: "🌙 Dark Purple" },
  light:  { bg: "#f0f4f8", surface: "#ffffff", border: "#e2e8f0", text: "#1a202c", muted: "#718096", nome: "☀️ Light" },
};
const G = { bg: "#060a10", surface: "#0c1220", border: "#141e2e", text: "#e8edf5", muted: "#4a5872", accent: "#22d3ee", purple: "#a78bfa", green: "#4ade80", yellow: "#f59e0b" };

// ── ROTEADOR INTELIGENTE GEMINI + CLAUDE ─────────────────────────────────────
const GEMINI_KEY = "COLE_SUA_CHAVE_GEMINI_AQUI";
const CLAUDE_KEY = "COLE_SUA_CHAVE_CLAUDE_AQUI";

const isComplexo = (msg) => {
  const complexo = /repertório|repertorio|como você|como voce|diferencial|ar livre|chuva|backup|equipamento|experiência|experiencia|estilo|músicas|musicas|setlist|cerimônia|cerimonia|proposta|negoci|desconto|contrato|rider|som|iluminação/i;
  if (complexo.test(msg)) return true;
  return msg.length > 100;
};

const chamarGemini = async (messages, system) => {
  const hist = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const body = { system_instruction: { parts: [{ text: system || "" }] }, contents: hist };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const chamarClaude = async (messages, system) => {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (system) body.system = system;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text || "";
};

const chamarIA = async (messages, system, forceClaude = false) => {
  const ultima = messages[messages.length - 1]?.content || "";
  const usarClaude = forceClaude || isComplexo(ultima);
  try {
    if (usarClaude) return { texto: await chamarClaude(messages, system), modelo: "claude" };
    return { texto: await chamarGemini(messages, system), modelo: "gemini" };
  } catch {
    try { return { texto: await chamarClaude(messages, system), modelo: "claude" }; }
    catch { throw new Error("Erro nas IAs"); }
  }
};

// ── DADOS ─────────────────────────────────────────────────────────────────────
const DB = { usuarios: [
  { id: "admin", role: "admin", nome: "Diego", email: "admin@zapmanager.com.br", senha: "admin123" },
  { id: "escola1", role: "cliente", nome: "Bright English", email: "bright@email.com", senha: "bright123", plano: "starter", negocio: "Bright English", pix: "11988887777",
    alunos: [
      { id: 1, nome: "Sofia Barros", responsavel: "Ana Barros", whatsapp: "11999990001", valor: 350, vencimento: 5, status: "pago", aniversario: "06-15" },
      { id: 2, nome: "Lucas Mendes", responsavel: "Carlos Mendes", whatsapp: "11999990002", valor: 350, vencimento: 10, status: "pendente", aniversario: "06-22" },
      { id: 3, nome: "Maria Souza", responsavel: "Paula Souza", whatsapp: "11999990003", valor: 420, vencimento: 15, status: "atrasado", aniversario: "09-03" },
      { id: 4, nome: "Pedro Lima", responsavel: "Roberto Lima", whatsapp: "11999990004", valor: 350, vencimento: 20, status: "pendente", aniversario: "" },
    ],
    orcamentos: [
      { id: 1, cliente: "Família Costa", contato: "11988881001", email: "costa@email.com", tipo: "Matrícula", data: "2025-07-01", valor_pedido: 1200, valor_fechado: null, status: "negociando", local: "Presencial", obs: "Interesse no curso adultos intermediário" },
      { id: 2, cliente: "João Pereira", contato: "11988881002", email: "joao@email.com", tipo: "Rematrícula", data: "2025-08-01", valor_pedido: 350, valor_fechado: 350, status: "fechado", local: "Presencial", obs: "Aluno desde 2023, renovando semestre" },
      { id: 3, cliente: "Empresa ABC", contato: "11988881003", email: "rh@abc.com", tipo: "Corporativo", data: "2025-09-15", valor_pedido: 4800, valor_fechado: null, status: "aberto", local: "In-company", obs: "10 funcionários, inglês básico" },
    ],
    agenda: [
      { id: 1, titulo: "Reunião de pais", tipo: "Reunião", data: "2025-06-10", horario: "19:00", local: "Sala principal", valor: 0, cor: "#22d3ee", obs: "" },
      { id: 2, titulo: "Prova de nivelamento", tipo: "Prova", data: "2025-06-25", horario: "09:00", local: "Sala 2", valor: 0, cor: "#f59e0b", obs: "" },
    ],
    receitas: [
      { id: 1, mes: 0, valor: 4200 }, { id: 2, mes: 1, valor: 4550 }, { id: 3, mes: 2, valor: 4200 },
      { id: 4, mes: 3, valor: 4900 }, { id: 5, mes: 4, valor: 4200 }, { id: 6, mes: 5, valor: 3850 },
    ],
    mensagem: "Olá {responsavel}! 👋\n\nA mensalidade de *{aluno}* ref. *{mes}* no valor de *R$ {valor}* vence dia *{vencimento}*.\n\nPIX: {pix}\n\nQualquer dúvida estamos à disposição! 😊\n— {nome_escola}",
  },
  { id: "musico1", role: "cliente", nome: "Diego Cantor", email: "diego@diegocantor.com", senha: "diego123", plano: "total", negocio: "Diego Cantor", pix: "11977770000",
    alunos: [], mensagem: "",
    orcamentos: [
      { id: 1, cliente: "Família Rodrigues", contato: "11988880001", email: "rodrigues@email.com", tipo: "Casamento", data: "2025-06-14", valor_pedido: 4500, valor_fechado: 4200, status: "fechado", local: "Vila Olímpia SP", obs: "Cerimônia + recepção 4h", aniversario: "06-20" },
      { id: 2, cliente: "TechBrasil", contato: "11988880002", email: "rh@tech.com", tipo: "Corporativo", data: "2025-07-20", valor_pedido: 3800, valor_fechado: null, status: "aberto", local: "Faria Lima SP", obs: "Confraternização", aniversario: "" },
      { id: 3, cliente: "Família Souza", contato: "11988880003", email: "ana@gmail.com", tipo: "Casamento", data: "2025-08-10", valor_pedido: 5000, valor_fechado: 4500, status: "fechado", local: "Morumbi SP", obs: "Cerimônia ao ar livre" },
      { id: 4, cliente: "Ana & Bruno", contato: "11988880005", email: "ana.bruno@gmail.com", tipo: "Casamento", data: "2025-10-18", valor_pedido: 4800, valor_fechado: null, status: "negociando", local: "Higienópolis SP", obs: "Pedido via Instagram" },
      { id: 5, cliente: "Buffet Estrela", contato: "11988880006", email: "eventos@estrela.com", tipo: "Corporativo", data: "2025-09-05", valor_pedido: 2800, valor_fechado: 2800, status: "fechado", local: "Santo André SP", obs: "Jantar executivo" },
    ],
    agenda: [
      { id: 1, titulo: "Casamento Rodrigues", tipo: "Casamento", data: "2025-06-14", horario: "19:00", local: "Vila Olímpia SP", valor: 4200, cor: "#a78bfa", obs: "" },
      { id: 2, titulo: "Show Bar do Zé", tipo: "Show", data: "2025-06-20", horario: "22:00", local: "Pinheiros SP", valor: 800, cor: "#22d3ee", obs: "" },
      { id: 3, titulo: "Corporativo TechBrasil", tipo: "Corporativo", data: "2025-07-20", horario: "20:00", local: "Faria Lima SP", valor: 3800, cor: "#f59e0b", obs: "" },
      { id: 4, titulo: "Casamento Souza", tipo: "Casamento", data: "2025-08-10", horario: "17:00", local: "Morumbi SP", valor: 4500, cor: "#a78bfa", obs: "" },
    ],
    receitas: [
      { id: 1, mes: 0, valor: 8200 }, { id: 2, mes: 1, valor: 6500 }, { id: 3, mes: 2, valor: 9800 },
      { id: 4, mes: 3, valor: 7200 }, { id: 5, mes: 4, valor: 11500 }, { id: 6, mes: 5, valor: 8900 },
    ],
  },
]};

const PLANOS = {
  starter: { nome: "Starter", preco: 59, cor: "#22d3ee", modulos: ["cobranca", "orcamentos"] },
  pro: { nome: "Pro", preco: 99, cor: "#a78bfa", modulos: ["cobranca", "orcamentos"] },
  total: { nome: "Total", preco: 139, cor: "#f59e0b", modulos: ["cobranca", "orcamentos", "meta"] },
};
const sOrc = { aberto: { l: "Em aberto", c: "#22d3ee" }, negociando: { l: "Negociando", c: "#f59e0b" }, fechado: { l: "Fechado ✓", c: "#4ade80" }, perdido: { l: "Perdido", c: "#f87171" } };
const sAlu = { pago: { l: "Pago", c: "#4ade80" }, pendente: { l: "Pendente", c: "#f59e0b" }, atrasado: { l: "Atrasado", c: "#f87171" } };
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_F = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MES = new Date().getMonth();

const Badge = ({ s, cfg }) => <span style={{ background: `${cfg[s].c}18`, color: cfg[s].c, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{cfg[s].l}</span>;
const Toast = ({ t }) => t ? <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: t.t === "e" ? "#ef4444" : "#22c55e", color: "#fff", padding: "11px 20px", borderRadius: 12, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{t.t === "e" ? "⚠️ " : "✓ "}{t.m}</div> : null;

// ── GRÁFICO DE BARRAS ─────────────────────────────────────────────────────────
const GraficoBarras = ({ dados, cor = "#22d3ee", altura = 130 }) => {
  const max = Math.max(...dados.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: altura }}>
      {dados.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ fontSize: 9, color: G.muted, fontWeight: 600 }}>R${d.v > 999 ? (d.v / 1000).toFixed(0) + "k" : d.v}</div>
          <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === dados.length - 1 ? cor : `${cor}50`, height: `${(d.v / max) * (altura - 28)}px`, minHeight: d.v > 0 ? 4 : 0 }} />
          <div style={{ fontSize: 9, color: G.muted }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
};

// ── GRÁFICO DONUT ─────────────────────────────────────────────────────────────
const GraficoDonut = ({ fatias, tamanho = 100 }) => {
  const total = fatias.reduce((s, f) => s + f.v, 0);
  if (total === 0) return <div style={{ width: tamanho, height: tamanho, borderRadius: "50%", background: G.border, margin: "0 auto" }} />;
  let ang = -90;
  const cx = tamanho / 2, cy = tamanho / 2, r = tamanho * 0.38, ri = tamanho * 0.25;
  const paths = fatias.map(f => {
    const pct = f.v / total; const s = ang; ang += pct * 360; const e = ang;
    const pt = (a, rad) => ({ x: cx + rad * Math.cos(a * Math.PI / 180), y: cy + rad * Math.sin(a * Math.PI / 180) });
    const lg = e - s > 180 ? 1 : 0;
    const s1 = pt(s, r), s2 = pt(e, r), i1 = pt(s, ri), i2 = pt(e, ri);
    return { path: `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${lg} 1 ${s2.x} ${s2.y} L ${i2.x} ${i2.y} A ${ri} ${ri} 0 ${lg} 0 ${i1.x} ${i1.y} Z`, cor: f.c, label: f.l, pct: Math.round(pct * 100) };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={tamanho} height={tamanho} style={{ flexShrink: 0 }}>{paths.map((p, i) => <path key={i} d={p.path} fill={p.cor} opacity={0.9} />)}</svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {paths.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.cor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: G.muted }}>{p.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.text, marginLeft: "auto" }}>{p.pct}%</span>
        </div>)}
      </div>
    </div>
  );
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState(""); const [erro, setErro] = useState(""); const [load, setLoad] = useState(false);
  const go = () => { setLoad(true); setTimeout(() => { const u = DB.usuarios.find(u => u.email === email && u.senha === senha); if (u) onLogin(u); else { setErro("E-mail ou senha incorretos"); setLoad(false); setTimeout(() => setErro(""), 3000); } }, 500); };
  return (
    <div style={{ background: G.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}input{outline:none;font-family:inherit}input:focus{border-color:#22d3ee!important}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#22d3ee,#0e7490)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(34,211,238,0.3)" }}>⚡</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 800, color: G.text }}>ZapManager</div>
          <div style={{ fontSize: 14, color: G.muted, marginTop: 4 }}>Gestão inteligente com IA</div>
        </div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 20, padding: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: G.text, marginBottom: 20 }}>Entrar na plataforma</div>
          {[["E-mail", email, setEmail, "text", "seu@email.com"], ["Senha", senha, setSenha, "password", "••••••••"]].map(([l, v, s, t, p]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{l}</div>
              <input type={t} value={v} onChange={e => s(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder={p} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 14px", color: G.text, fontSize: 15 }} />
            </div>
          ))}
          {erro && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 8, marginBottom: 14 }}>{erro}</div>}
          <button onClick={go} disabled={load} style={{ width: "100%", background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
            {load ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "Entrar →"}
          </button>
          <div style={{ marginTop: 20, background: "#060a10", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Contas demo</div>
            {[{ icon: "🏢", cor: "#a78bfa", label: "Admin", email: "admin@zapmanager.com.br", senha: "admin123" }, { icon: "🌟", cor: "#22d3ee", label: "Bright English", email: "bright@email.com", senha: "bright123" }, { icon: "⚡", cor: "#f59e0b", label: "Diego Cantor", email: "diego@diegocantor.com", senha: "diego123" }].map(c => (
              <button key={c.label} onClick={() => { setEmail(c.email); setSenha(c.senha); }} style={{ width: "100%", background: "transparent", border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: c.cor }}>{c.label}</div><div style={{ fontSize: 11, color: G.muted }}>{c.email}</div></div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: G.muted }}>Clique para preencher</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function AppAdmin({ onLogout }) {
  const clientes = DB.usuarios.filter(u => u.role === "cliente");
  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: G.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}`}</style>
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", height: 56, gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
          <span style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800 }}>ZapManager</span>
          <span style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>ADMIN</span>
          <button onClick={onLogout} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Painel Admin</div>
        <div style={{ color: G.muted, fontSize: 13, marginBottom: 24 }}>Visão geral da plataforma</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[{ l: "Clientes", v: clientes.length, i: "🏢", c: "#a78bfa" }, { l: "MRR", v: `R$ ${clientes.reduce((s, c) => s + (PLANOS[c.plano]?.preco || 0), 0)}`, i: "💰", c: "#4ade80" }, { l: "Usuários", v: clientes.reduce((s, c) => s + (c.alunos?.length || 0), 0), i: "👥", c: "#22d3ee" }].map(c => (
            <div key={c.l} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.i}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.c }}>{c.v}</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{c.l}</div>
            </div>
          ))}
        </div>
        {clientes.map(c => { const pl = PLANOS[c.plano]; return (
          <div key={c.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pl?.cor}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.segmento === "musico" ? "🎵" : "🏫"}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{c.nome}</div><div style={{ fontSize: 12, color: G.muted }}>{c.email}</div></div>
            <span style={{ background: `${pl?.cor}20`, color: pl?.cor, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{pl?.nome} · R${pl?.preco}/mês</span>
          </div>
        ); })}
      </div>
    </div>
  );
}

// ── CLIENTE ───────────────────────────────────────────────────────────────────
function AppCliente({ user, onLogout }) {
  const w = useW(); const mob = w < 768;
  const [aba, setAba] = useState("dashboard");
  const [alunos, setAlunos] = useState(user.alunos || []);
  const [orcamentos, setOrcamentos] = useState(user.orcamentos || []);
  const [agenda, setAgenda] = useState(user.agenda || []);
  const [receitas] = useState(user.receitas || []);
  const [mensagem, setMensagem] = useState(user.mensagem || "");
  const [nomeN, setNomeN] = useState(user.nome);
  const [pix, setPix] = useState(user.pix || "");
  const [disparados, setDisparados] = useState([]);
  const [toast, setToast] = useState(null);
  const [showOrcForm, setShowOrcForm] = useState(false);
  const [editOrc, setEditOrc] = useState(null);
  const [retornos, setRetornos] = useState([
    { id: 1, orcId: 4, cliente: "Ana & Bruno", tipo: "Casamento", valor: 4800, data: "2025-06-05", horario: "14:00", nota: "Ana pediu pra retornar segunda", quem: "eu", status: "pendente" },
    { id: 2, orcId: 2, cliente: "TechBrasil", tipo: "Corporativo", valor: 3800, data: "2025-06-08", horario: "10:00", nota: "RH vai confirmar com a diretoria", quem: "ia", status: "pendente" },
  ]);
  const [showRetornoModal, setShowRetornoModal] = useState(null);
  const [novoRetorno, setNovoRetorno] = useState({ data: "", horario: "", nota: "", quem: "eu", recorrente: false, diaRecorrente: "", horarioRecorrente: "" });
  const [abaRetorno, setAbaRetorno] = useState("pendentes");
  const [showAlunoForm, setShowAlunoForm] = useState(false);
  const [showImport, setShowImport] = useState(false); // false | "simples" | "multipla"
  const [multiTexto, setMultiTexto] = useState("");
  const [multiLoad, setMultiLoad] = useState(false);
  const [multiResultados, setMultiResultados] = useState([]);
  const [multiSelecionados, setMultiSelecionados] = useState([]);
  const [showEventoForm, setShowEventoForm] = useState(false);
  const [importTexto, setImportTexto] = useState("");
  const [importLoad, setImportLoad] = useState(false);
  const [importPrev, setImportPrev] = useState(null);
  const [iaModal, setIaModal] = useState(null);
  const [iaTexto, setIaTexto] = useState("");
  const [iaLoad, setIaLoad] = useState(false);
  const [iaModelo, setIaModelo] = useState("");
  const [wppModal, setWppModal] = useState(null);
  const [wppChat, setWppChat] = useState([]);
  const [wppInput, setWppInput] = useState("");
  const [wppLoad, setWppLoad] = useState(false);
  const [eventoSel, setEventoSel] = useState(null);
  const [agMes, setAgMes] = useState(MES);
  const [agAno, setAgAno] = useState(new Date().getFullYear());
  const [novoAluno, setNovoAluno] = useState({ nome: "", responsavel: "", whatsapp: "", valor: "", vencimento: "", aniversario: "" });
  const [novoOrc, setNovoOrc] = useState({ cliente: "", contato: "", email: "", tipo: user.segmento === "musico" ? "Casamento" : "Matrícula", data: "", valor_pedido: "", local: "", obs: "" });
  const [novoEv, setNovoEv] = useState({ titulo: "", tipo: "Show", data: "", horario: "", local: "", valor: "", obs: "", cor: "#22d3ee" });
  const [tema, setTema] = useState("dark");
  const T = { ...TEMAS[tema] };
  const [vitrine, setVitrine] = useState({
    nome: user.nome,
    titulo: "Seu título aqui",
    bio: "",
    cor: "#22d3ee",
    tipoCapa: "foto",
    fotoCapa: "",
    logo: "",
    instagram: "",
    whatsapp: user.pix || "",
    youtube: "",
    tiktok: "",
    spotify: "",
    destaques: ["", "", ""],
  });
  const [vitrinePreview, setVitrinePreview] = useState(false);
  const [pdfLoad, setPdfLoad] = useState(false);
  const [mensagens, setMensagens] = useState([
    { id: 1, contato: "Ana Silva", whatsapp: "11999990001", texto: "Oi tudo bem?", hora: "09:14", status: "respondida", respostaIA: "Oi Ana! Tudo bem sim 😊 Em que posso ajudar?", modelo: "gemini", categoria: "saudacao" },
    { id: 2, contato: "Carlos Buffet", whatsapp: "11999990002", texto: "Quanto você cobra pra tocar numa festa de 200 pessoas?", hora: "10:32", status: "aguardando", respostaIA: null, modelo: null, categoria: "valor", motivo: "Pergunta sobre valor — requer sua atenção" },
    { id: 3, contato: "Família Rodrigues", whatsapp: "11999990003", texto: "Queria saber se você toca sertanejo e qual o repertório", hora: "11:05", status: "respondida", respostaIA: "Oi! Sim, trabalho com sertanejo, pagode, forró e pop rock 🎵 Tenho um repertório bem variado com os principais hits. Posso montar algo personalizado pro seu evento. Qual a data?", modelo: "claude", categoria: "negocio" },
    { id: 4, contato: "Desconhecido", whatsapp: "11999990004", texto: "Olá, queria marcar uma consulta com o Dr. Paulo", hora: "11:47", status: "silencio", respostaIA: null, modelo: null, categoria: "fora_escopo", motivo: "Fora do escopo — consulta médica" },
    { id: 5, contato: "Buffet Estrela", whatsapp: "11999990005", texto: "Bom dia! Temos interesse em contratar pra nosso evento corporativo em agosto. Tem disponibilidade?", hora: "12:20", status: "aguardando", respostaIA: null, modelo: null, categoria: "valor", motivo: "Pergunta sobre disponibilidade/valor — requer sua atenção" },
    { id: 6, contato: "Joana Lima", whatsapp: "11999990006", texto: "Boa tarde! Vi seu trabalho no Instagram, ficou lindo o casamento da semana passada!", hora: "14:10", status: "respondida", respostaIA: "Boa tarde Joana! Muito obrigado 😊 Fico feliz que tenha gostado! Foi um evento incrível. Se precisar de algo é só falar!", modelo: "gemini", categoria: "saudacao" },
  ]);
  const [filtroMsg, setFiltroMsg] = useState("todos");
  const [simMsg, setSimMsg] = useState("");
  const [simLoad, setSimLoad] = useState(false);
  const [simResposta, setSimResposta] = useState(null);

  const plano = PLANOS[user.plano] || {};
  const mods = plano.modulos || [];
  const isMus = false; // Conta universal — sem diferença por segmento
  const showT = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 3000); };
  const inp = { width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" };

  const gerarMsg = (a) => mensagem.replace(/\{responsavel\}/g, a.responsavel).replace(/\{aluno\}/g, a.nome).replace(/\{mes\}/g, MESES_F[MES]).replace(/\{valor\}/g, a.valor?.toFixed(2).replace(".", ",")).replace(/\{vencimento\}/g, a.vencimento).replace(/\{pix\}/g, pix).replace(/\{nome_escola\}/g, nomeN);
  const abrirWpp = (a) => { window.open(`https://wa.me/55${a.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(gerarMsg(a))}`, "_blank"); setDisparados(p => [...p, a.id]); showT(`WhatsApp aberto para ${a.responsavel}!`); };
  const dispTodos = () => { const p = alunos.filter(a => a.status !== "pago"); if (!p.length) { showT("Nenhum pendente!", "e"); return; } p.forEach((a, i) => setTimeout(() => { window.open(`https://wa.me/55${a.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(gerarMsg(a))}`, "_blank"); setDisparados(x => [...x, a.id]); }, i * 1200)); showT(`${p.length} conversas abertas!`); };

  const pedirIA = async (orc) => {
    setIaModal(orc); setIaTexto(""); setIaLoad(true); setIaModelo("");
    const fechados = orcamentos.filter(o => o.status === "fechado");
    const media = fechados.length ? Math.round(fechados.reduce((s, o) => s + o.valor_fechado, 0) / fechados.length) : 0;
    const prompt = `Especialista em vendas para músicos. Histórico: ${orcamentos.length} orçamentos, ${fechados.length} fechados, ticket médio R$${media}. Orçamento: ${orc.cliente}, ${orc.tipo}, R$${orc.valor_pedido}, ${orc.local}. Obs: ${orc.obs}. Sugira 2 estratégias numeradas para fechar. Máximo 120 palavras.`;
    try {
      const { texto, modelo } = await chamarIA([{ role: "user", content: prompt }], null, true);
      setIaTexto(texto); setIaModelo(modelo);
    } catch { setIaTexto("Configure as chaves de API em ⚙️ Config para usar a IA."); }
    setIaLoad(false);
  };

  const enviarWppIA = async () => {
    if (!wppInput.trim()) return;
    const msg = wppInput.trim(); setWppInput("");
    setWppChat(p => [...p, { r: "user", c: msg }]); setWppLoad(true);
    const sys = isMus ? `Você é assistente do artista ${nomeN}. Responda sobre eventos de forma natural. PIX: ${pix}. Nunca invente valores.` : `Você é assistente da escola ${nomeN}. Responda sobre mensalidades de forma amigável. PIX: ${pix}.`;
    try {
      const hist = [...wppChat, { r: "user", c: msg }].map(m => ({ role: m.r === "user" ? "user" : "assistant", content: m.c }));
      const { texto, modelo } = await chamarIA(hist, sys);
      setWppChat(p => [...p, { r: "ai", c: texto, modelo }]);
    } catch {
      setWppChat(p => [...p, { r: "ai", c: "Configure as chaves de API em ⚙️ Config.", modelo: "" }]);
    }
    setWppLoad(false);
  };

  const importarConversa = () => {
    if (!importTexto.trim()) { showT("Cole a conversa primeiro!", "e"); return; }
    setImportLoad(true); setImportPrev(null);
    setTimeout(() => {
      const txt = importTexto.toLowerCase(); const orig = importTexto;
      let tipo = "Outro";
      if (/casamento|noiva|noivo/.test(txt)) tipo = "Casamento";
      else if (/corporativo|empresa|confraterniza/.test(txt)) tipo = "Corporativo";
      else if (/aniversário|aniversario|festa/.test(txt)) tipo = "Aniversário";
      else if (/formatura/.test(txt)) tipo = "Formatura";
      else if (/show|apresenta/.test(txt)) tipo = "Show";
      let valor_pedido = 0;
      const vm = orig.match(/R\$\s*([\d.,]+)|([\d.,]+)\s*reais|([\d.,]+)\s*mil/i);
      if (vm) { const v = vm[1] || vm[2] || vm[3]; const n = parseFloat(v.replace(/\./g, "").replace(",", ".")); valor_pedido = vm[3] ? n * 1000 : n; }
      let data = "";
      const dm = orig.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
      if (dm) { data = `${dm[3] ? (dm[3].length === 2 ? "20" + dm[3] : dm[3]) : "2025"}-${dm[2].padStart(2,"0")}-${dm[1].padStart(2,"0")}`; }
      else { MESES_F.forEach((mes, idx) => { if (txt.includes(mes.toLowerCase())) { const mr = new RegExp("(\\d{1,2})\\s*(de\\s*)?" + mes.toLowerCase(), "i"); const mm = orig.match(mr); data = `2025-${String(idx + 1).padStart(2, "0")}-${mm ? mm[1].padStart(2, "0") : "01"}`; } }); }
      let contato = ""; const tm = orig.match(/\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/); if (tm) contato = tm[0].replace(/\D/g, "");
      let email = ""; const em = orig.match(/[\w.-]+@[\w.-]+\.\w+/); if (em) email = em[0];
      let local = ""; const locs = ["vila olimpia","moema","higienopolis","morumbi","pinheiros","itaim","faria lima","brooklin","santo andre","guarulhos","campinas","osasco"]; const lf = locs.find(l => txt.includes(l)); if (lf) local = lf.replace(/\b\w/g, x => x.toUpperCase()) + " SP";
      let cliente = "Cliente via WhatsApp";
      const fam = orig.match(/famil[ií]a\s+([A-ZÁÀÂÃÉÈÊÍÓÔÕÚ][a-záàâãéèêíóôõú]+)/i); if (fam) cliente = "Família " + fam[1];
      else { const nc = orig.match(/(?:sou|me chamo|meu nome é|aqui é)\s+([A-ZÁÀÂÃÉÈÊÍÓÔÕÚ][a-záàâãéèêíóôõú]+(?:\s[A-ZÁÀÂÃÉÈÊÍÓÔÕÚ][a-záàâãéèêíóôõú]+)?)/i); if (nc) cliente = nc[1]; }
      setImportPrev({ cliente, contato, email, tipo, data, valor_pedido, local, obs: `Importado. ${tipo}${local ? " em " + local : ""}${valor_pedido ? " · R$" + valor_pedido.toLocaleString("pt-BR") : ""}` });
      showT("Conversa analisada! Confirme os dados 🎯");
      setImportLoad(false);
    }, 700);
  };

  const simularTriagem = async () => {
    if (!simMsg.trim()) { showT("Digite uma mensagem para simular!", "e"); return; }
    setSimLoad(true); setSimResposta(null);

    const msg = simMsg.trim();
    const msgLower = msg.toLowerCase();

    // Detectar categoria localmente primeiro
    const eSaudacao = /^(oi|olá|ola|bom dia|boa tarde|boa noite|tudo bem|tudo bom|hey|hello|hi)[\s!?.,]*$/i.test(msg.trim());
    const eValor = /valor|preço|preco|quanto|cachê|cache|cobr|orçamento|orcamento|custo/i.test(msgLower);
    const eForaEscopo = /consulta|médico|medico|doctor|dentist|pizza|delivery|farmácia|farmacia|ingresso|passagem|emprego|vaga/i.test(msgLower);

    let categoria, status, resposta = null, modelo = null;

    if (eForaEscopo) {
      categoria = "fora_escopo";
      status = "silencio";
    } else if (eValor) {
      categoria = "valor";
      status = "aguardando";
    } else if (eSaudacao) {
      categoria = "saudacao";
      status = "respondida";
      // Usar IA para saudação
      const saudacoes = ["Oi! Tudo bem 😊", "Oi! Tudo ótimo, e você?", "Olá! Tudo bem sim 😄", "Oi! Tudo certo por aqui 👋"];
      resposta = saudacoes[Math.floor(Math.random() * saudacoes.length)];
      modelo = "gemini";
    } else {
      categoria = "negocio";
      status = "respondida";
      // Chamar IA real para perguntas de negócio
      const sys = `Você é assistente do artista ${nomeN}. Responda de forma natural e humanizada, como o próprio artista responderia no WhatsApp. REGRAS IMPORTANTES: 1) NUNCA mencione valores, preços ou cachê — diga que vai verificar e retornar. 2) Para saudações simples responda curto. 3) Para perguntas sobre o trabalho, responda com entusiasmo e peça mais detalhes (data, tipo de evento, local). 4) Seja natural, use emojis com moderação. PIX: ${pix}.`;
      try {
        const { texto, modelo: mod } = await chamarIA([{ role: "user", content: msg }], sys);
        resposta = texto;
        modelo = mod;
      } catch {
        resposta = "Oi! Obrigado pelo contato 😊 Pode me contar mais sobre o evento?";
        modelo = "gemini";
      }
    }

    const nova = {
      id: Date.now(),
      contato: "Simulação",
      whatsapp: "",
      texto: msg,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status,
      respostaIA: resposta,
      modelo,
      categoria,
      motivo: categoria === "fora_escopo" ? "Fora do escopo — IA não respondeu"
             : categoria === "valor" ? "Pergunta sobre valor — requer sua atenção"
             : null,
    };

    setSimResposta(nova);
    setMensagens(p => [nova, ...p]);
    setSimLoad(false);
    showT(status === "respondida" ? "IA respondeu! ✅" : status === "silencio" ? "IA ficou em silêncio 🔇" : "Aguardando sua atenção ⚠️");
  };

  const confirmarImport = () => {
    if (!importPrev) return;
    setOrcamentos([...orcamentos, { ...importPrev, id: Date.now(), status: "aberto", valor_pedido: Number(importPrev.valor_pedido) || 0, valor_fechado: null }]);
    setImportPrev(null); setImportTexto(""); setShowImport(false); showT("Orçamento criado! 🚀");
  };

  const exportCSV = () => {
    const rows = isMus ? orcamentos.map(o => `"${o.cliente}","${o.contato}","${o.email}","${o.tipo}"`) : alunos.map(a => `"${a.nome}","${a.responsavel}","${a.whatsapp}","Aluno"`);
    const csv = ["Nome,Telefone,Email,Tipo", ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "leads_meta.csv"; a.click();
    showT("CSV exportado! 🚀");
  };

  const stats = {
    total: alunos.length, pagos: alunos.filter(a => a.status === "pago").length,
    pendentes: alunos.filter(a => a.status === "pendente").length, atrasados: alunos.filter(a => a.status === "atrasado").length,
    receita: alunos.filter(a => a.status === "pago").reduce((s, a) => s + a.valor, 0),
    previsto: alunos.reduce((s, a) => s + a.valor, 0),
    orcA: orcamentos.filter(o => o.status !== "fechado" && o.status !== "perdido").length,
    orcF: orcamentos.filter(o => o.status === "fechado").length,
    ticket: orcamentos.filter(o => o.status === "fechado").length ? Math.round(orcamentos.filter(o => o.status === "fechado").reduce((s, o) => s + o.valor_fechado, 0) / orcamentos.filter(o => o.status === "fechado").length) : 0,
    taxaConv: orcamentos.length ? Math.round((orcamentos.filter(o => o.status === "fechado").length / orcamentos.length) * 100) : 0,
  };

  const diasMes = (m, a) => new Date(a, m + 1, 0).getDate();
  const primDia = (m, a) => new Date(a, m, 1).getDay();
  const evsMes = agenda.filter(e => { const d = new Date(e.data); return d.getMonth() === agMes && d.getFullYear() === agAno; });
  const evsDia = (d) => evsMes.filter(e => new Date(e.data).getDate() === d);
  const tiposEv = isMus ? ["Show","Casamento","Corporativo","Aniversário","Formatura","Ensaio","Outro"] : ["Aula","Reunião","Prova","Evento","Feriado","Outro"];
  const coresEv = ["#22d3ee","#a78bfa","#f59e0b","#4ade80","#f87171","#fb923c"];

  const dadosGrafico = receitas.slice(-6).map(r => ({ l: MESES[r.mes], v: r.valor }));
  const tiposOrc = ["Casamento","Corporativo","Aniversário","Show","Outro"];
  const coresTipos = ["#a78bfa","#22d3ee","#f59e0b","#4ade80","#4a5872"];
  const donutOrc = tiposOrc.map((t, i) => ({ l: t, v: orcamentos.filter(o => o.tipo === t).length, c: coresTipos[i] })).filter(d => d.v > 0);
  const proximosEvs = agenda.filter(e => new Date(e.data) >= new Date()).sort((a, b) => new Date(a.data) - new Date(b.data)).slice(0, 3);
  const alertas = orcamentos.filter(o => o.status !== "fechado" && o.status !== "perdido");

  const abas = [
    { id: "dashboard", icon: "▣", label: "Início" },
    ...(mods.includes("cobranca") ? [{ id: "cobranca", icon: "💬", label: "Cobranças" }] : []),
    { id: "contatos", icon: "👥", label: isMus ? "Contatos" : "Alunos" },
    { id: "orcamentos", icon: "🎯", label: isMus ? "Orçamentos" : "Propostas" },
    { id: "agenda", icon: "📅", label: "Agenda" },
    { id: "retornos", icon: "📌", label: "Retornos" },
    { id: "mensagens", icon: "🗨️", label: "Mensagens" },
    { id: "vitrine", icon: "🌟", label: "Vitrine" },
    { id: "config", icon: "⚙️", label: "Config" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: T.text, transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}input,textarea,select{outline:none;font-family:inherit}input:focus,textarea:focus,select:focus{border-color:#22d3ee!important}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Toast t={toast} />

      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 50, transition: "background 0.3s" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#22d3ee,#0e7490)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
            <span style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800, color: T.text }}>ZapManager</span>
            {!mob && <span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>• {nomeN}</span>}
          </div>
          {!mob && <div style={{ display: "flex", gap: 2 }}>{abas.map(a => <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: aba === a.id ? 600 : 400, background: aba === a.id ? "rgba(34,211,238,0.12)" : "transparent", color: aba === a.id ? "#22d3ee" : T.muted, fontFamily: "inherit", transition: "all 0.15s" }}>{a.icon} {a.label}</button>)}</div>}
          <button onClick={onLogout} style={{ marginLeft: 12, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: mob ? "6px 10px" : "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "16px 12px 80px" : "24px 20px 40px" }}>

        {aba === "dashboard" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div><div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 22 : 28, fontWeight: 800 }}>Olá, {user.nome.split(" ")[0]} 👋</div><div style={{ color: G.muted, fontSize: 13, marginTop: 3 }}>{MESES_F[MES]} · Plano {plano.nome}</div></div>
            {mods.includes("meta") && <button onClick={exportCSV} style={{ background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>📊 Exportar Meta Ads</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              ...(mods.includes("cobranca") ? [{ l: "Total", v: stats.total, i: "👥", c: "#22d3ee" }, { l: "Pagos", v: stats.pagos, i: "✅", c: "#4ade80" }, { l: "Pendentes", v: stats.pendentes, i: "⏳", c: "#f59e0b" }, { l: "Atrasados", v: stats.atrasados, i: "🔴", c: "#f87171" }] : []),
              { l: isMus ? "Orç. abertos" : "Propostas", v: stats.orcA, i: "🎯", c: "#f59e0b" }, { l: "Fechados", v: stats.orcF, i: "✅", c: "#4ade80" }, { l: "Ticket médio", v: `R$${stats.ticket.toLocaleString("pt-BR")}`, i: "💰", c: "#a78bfa" }, { l: "Conversão", v: `${stats.taxaConv}%`, i: "📈", c: "#22d3ee" },
            ].map(c => (
              <div key={c.l} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{c.i}</div>
                <div style={{ fontSize: mob ? 20 : 24, fontWeight: 700, color: c.c }}>{c.v}</div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{c.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📈 Receita últimos 6 meses</div>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 12 }}>R$ {receitas.slice(-6).reduce((s, r) => s + r.valor, 0).toLocaleString("pt-BR")} no período</div>
              <GraficoBarras dados={dadosGrafico} cor="#22d3ee" altura={130} />
            </div>
            {donutOrc.length > 0 ? (
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🎯 Tipos de orçamento</div>
                <div style={{ fontSize: 11, color: G.muted, marginBottom: 16 }}>{orcamentos.length} orçamentos no total</div>
                <GraficoDonut fatias={donutOrc} tamanho={110} />
              </div>
            ) : mods.includes("cobranca") && stats.total > 0 ? (
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>Receita confirmada esse mês</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#4ade80" }}>R$ {stats.receita.toLocaleString("pt-BR")}</div>
                <div style={{ marginTop: 10, height: 4, background: "#1a2235", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${stats.previsto ? (stats.receita / stats.previsto) * 100 : 0}%`, background: "linear-gradient(90deg,#4ade80,#22d3ee)", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 5 }}>de R$ {stats.previsto.toLocaleString("pt-BR")} previstos</div>
              </div>
            ) : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
            {proximosEvs.length > 0 && <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📅 Próximos eventos</div>
              {proximosEvs.map(ev => <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 36, borderRadius: 4, background: ev.cor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{ev.titulo}</div><div style={{ fontSize: 11, color: G.muted }}>{ev.data}{ev.horario ? ` · ${ev.horario}` : ""}</div></div>
                {ev.valor > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>R${ev.valor.toLocaleString("pt-BR")}</span>}
              </div>)}
            </div>}
            {alertas.length > 0 && <div style={{ background: G.surface, border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>🔔 Orçamentos em aberto</div>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 14 }}>Precisam de atenção</div>
              {alertas.slice(0, 3).map(o => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{o.cliente}</div><div style={{ fontSize: 11, color: G.muted }}>{o.tipo}</div></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>R${o.valor_pedido.toLocaleString("pt-BR")}</span>
              </div>)}
            </div>}
          </div>
        </div>}

        {aba === "cobranca" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>Cobranças</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Dispare via WhatsApp</div></div>
            <button onClick={dispTodos} style={{ background: "linear-gradient(135deg,#22c55e,#15803d)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>🚀 {mob ? "Todos" : "Todos pendentes"}</button>
          </div>
          {alunos.map(a => { const done = disparados.includes(a.id); return (
            <div key={a.id} style={{ background: G.surface, border: `1px solid ${done ? "#22c55e30" : G.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{a.nome}</div><div style={{ fontSize: 12, color: G.muted }}>{a.responsavel} · Dia {a.vencimento} · R$ {a.valor}</div></div>
                <Badge s={a.status} cfg={sAlu} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setWppModal(a); setWppChat([]); }} style={{ flex: 1, background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "8px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🤖 Simular IA</button>
                {a.status === "pago" ? <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600, padding: "8px" }}>✅ Pago</span> : done ? <span style={{ color: "#22d3ee", fontSize: 13, fontWeight: 600, padding: "8px" }}>✓ Enviado</span> : <button onClick={() => abrirWpp(a)} style={{ flex: 1, background: "linear-gradient(135deg,#22c55e,#15803d)", color: "#fff", border: "none", borderRadius: 9, padding: "8px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>📲 WhatsApp</button>}
              </div>
            </div>
          ); })}
        </div>}

        {aba === "contatos" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>{isMus ? "Contatos" : "Alunos"}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{alunos.length} cadastrados</div></div>
            <button onClick={() => setShowAlunoForm(!showAlunoForm)} style={{ background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>+ Novo</button>
          </div>
          {showAlunoForm && <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["nome","Nome"],["responsavel","Responsável"],["whatsapp","WhatsApp"],["valor","Valor R$"],["vencimento","Dia vencto."]].map(([f,p]) => <input key={f} placeholder={p} value={novoAluno[f]} onChange={e => setNovoAluno({ ...novoAluno, [f]: e.target.value })} style={inp} />)}
              <div>
                <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Aniversário (opcional)</div>
                <input type="date" value={novoAluno.aniversario} onChange={e => setNovoAluno({ ...novoAluno, aniversario: e.target.value })} style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (!novoAluno.nome || !novoAluno.whatsapp || !novoAluno.valor) { showT("Preencha os campos!", "e"); return; } setAlunos([...alunos, { ...novoAluno, id: Date.now(), status: "pendente", valor: Number(novoAluno.valor), vencimento: Number(novoAluno.vencimento) }]); setNovoAluno({ nome: "", responsavel: "", whatsapp: "", valor: "", vencimento: "", aniversario: "" }); setShowAlunoForm(false); showT("Cadastrado!"); }} style={{ flex: 1, background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Salvar</button>
              <button onClick={() => setShowAlunoForm(false)} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "12px 16px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
            </div>
          </div>}
          {alunos.map(a => <div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.nome}</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{a.whatsapp} · Dia {a.vencimento} · <span style={{ color: "#4ade80", fontWeight: 600 }}>R$ {a.valor}</span>{a.aniversario ? ` · 🎂 ${a.aniversario}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <Badge s={a.status} cfg={sAlu} />
              <button onClick={() => {
                const msg = `🎂 Feliz aniversário, ${a.responsavel}! 🎉

Desejamos um dia incrível cheio de alegrias!

Como presente especial para você, preparamos *10% de desconto* na próxima mensalidade. 🎁

Use esse mês — você merece!
— ${nomeN}`;
                window.open("https://wa.me/55" + a.whatsapp.replace(/\D/g,"") + "?text=" + encodeURIComponent(msg), "_blank");
              }} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: 11, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>🎂</button>
              {a.status !== "pago" && <button onClick={() => setAlunos(alunos.map(x => x.id === a.id ? { ...x, status: "pago" } : x))} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, fontSize: 11, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" }}>✓</button>}
            </div>
          </div>)}
        </div>}

        {aba === "orcamentos" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>{isMus ? "Orçamentos" : "Matrículas & Propostas"}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>CRM com Gemini + Claude</div></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowImport(showImport === "simples" ? false : "simples"); setShowOrcForm(false); }} style={{ background: showImport==="simples"?"rgba(34,211,238,0.1)":"transparent", border: "1px solid #22d3ee", color: "#22d3ee", borderRadius: 10, padding: "9px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>💬 1 conversa</button>
              <button onClick={() => { setShowImport(showImport === "multipla" ? false : "multipla"); setShowOrcForm(false); }} style={{ background: showImport==="multipla"?"rgba(167,139,250,0.1)":"transparent", border: "1px solid #a78bfa", color: "#a78bfa", borderRadius: 10, padding: "9px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>📦 Várias</button>
              <button onClick={() => { setShowOrcForm(!showOrcForm); setShowImport(false); }} style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>+ Novo</button>
            </div>
          </div>

          {showImport === "simples" && <div style={{ background: G.surface, border: "1px solid rgba(34,211,238,0.3)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,211,238,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>Importar conversa do WhatsApp</div><div style={{ fontSize: 12, color: G.muted }}>Cole o texto — o sistema extrai os dados automaticamente</div></div>
            </div>
            <div style={{ background: "#060a10", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 12, color: G.muted, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700, color: "#22d3ee", marginBottom: 6 }}>Como exportar do WhatsApp:</div>
              <div>1. Abra a conversa → toque nos 3 pontos → "Mais" → "Exportar conversa"</div>
              <div>2. Escolha "Sem mídia" → copie e cole abaixo</div>
            </div>
            {!importPrev ? <>
              <textarea value={importTexto} onChange={e => setImportTexto(e.target.value)} placeholder={"Cole a conversa aqui...\n\nEx: 'Oi Diego! Queria orçamento pra casamento em novembro em Moema SP, R$ 4.500'"} rows={5} style={{ ...inp, lineHeight: 1.6, resize: "vertical", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={importarConversa} disabled={importLoad} style={{ flex: 1, background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {importLoad ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Analisando...</> : "✨ Analisar conversa"}
                </button>
                <button onClick={() => { setShowImport(false); setImportTexto(""); }} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "12px 16px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
              </div>
            </> : <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22d3ee", marginBottom: 12 }}>✅ Dados extraídos — edite se precisar:</div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["cliente","Cliente"],["contato","WhatsApp"],["email","E-mail"],["tipo","Tipo"],["data","Data (AAAA-MM-DD)"],["valor_pedido","Valor R$"],["local","Local"],["obs","Observações"]].map(([f, l]) => (
                  <div key={f}><div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{l}</div><input value={importPrev[f] || ""} onChange={e => setImportPrev({ ...importPrev, [f]: e.target.value })} style={inp} /></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={confirmarImport} style={{ flex: 1, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🚀 Salvar orçamento</button>
                <button onClick={() => setImportPrev(null)} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "12px 16px", cursor: "pointer", fontFamily: "inherit" }}>← Voltar</button>
              </div>
            </>}
          </div>}

          {showImport === "multipla" && <div style={{ background: G.surface, border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Importar várias conversas de uma vez</div>
                <div style={{ fontSize: 12, color: G.muted }}>Cole múltiplas conversas separadas — a IA classifica e cria todos os leads</div>
              </div>
            </div>

            <div style={{ background: "#060a10", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 12, color: G.muted, lineHeight: 1.9 }}>
              <div style={{ fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>Como usar:</div>
              <div>1. Exporte cada conversa no WhatsApp (uma por uma)</div>
              <div>2. Cole todas aqui embaixo, uma após a outra</div>
              <div>3. Separe cada conversa com uma linha: <span style={{ color:"#a78bfa",fontWeight:700 }}>---</span></div>
              <div>4. A IA lê tudo e cria os leads automaticamente</div>
            </div>

            {multiResultados.length === 0 ? <>
              <textarea
                value={multiTexto}
                onChange={e => setMultiTexto(e.target.value)}
                placeholder="Cole as conversas aqui separadas por --- entre cada uma

---

Cole a segunda conversa aqui...

---

Cole a terceira conversa aqui..."}
                rows={8}
                style={{ ...{ width:"100%", background:"#060a10", border:`1px solid ${G.border}`, borderRadius:10, padding:"11px 13px", color:G.text, fontSize:13, fontFamily:"inherit", outline:"none" }, lineHeight:1.6, resize:"vertical", marginBottom:12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => {
                  if (!multiTexto.trim()) { showT("Cole pelo menos uma conversa!", "e"); return; }
                  setMultiLoad(true);
                  const conversas = multiTexto.split("\n---\n").map(s => s.trim()).filter(s => s.length > 20);
                  if (conversas.length === 0) { showT("Nenhuma conversa encontrada!", "e"); setMultiLoad(false); return; }
                  const resultados = [];
                  for (const conv of conversas) {
                    await new Promise(r => setTimeout(r, 100));
                    const txt = conv.toLowerCase(); const orig = conv;
                    let tipo = "Outro";
                    if (/casamento|noiva|noivo|cerim/.test(txt)) tipo = "Casamento";
                    else if (/corporativo|empresa|confraterniza/.test(txt)) tipo = "Corporativo";
                    else if (/aniversário|aniversario|festa/.test(txt)) tipo = "Aniversário";
                    else if (/formatura/.test(txt)) tipo = "Formatura";
                    else if (/show|apresenta|balada|bar |boate/.test(txt)) tipo = "Show/Bar";
                    let valor_pedido = 0;
                    const vm = orig.match(/R\$\s*([\d.,]+)|([\d.,]+)\s*reais|([\d.,]+)\s*mil/i);
                    if (vm) { const v=vm[1]||vm[2]||vm[3]; const n=parseFloat(v.replace(/\./g,"").replace(",",".")); valor_pedido=vm[3]?n*1000:n; }
                    let data = "";
                    const dm = orig.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
                    if (dm) { data=`${dm[3]?(dm[3].length===2?"20"+dm[3]:dm[3]):"2025"}-${dm[2].padStart(2,"0")}-${dm[1].padStart(2,"0")}`; }
                    else { ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"].forEach((mes,idx)=>{ if(txt.includes(mes)){const mr=new RegExp("(\d{1,2})\s*(de\s*)?"+mes,"i");const mm=orig.match(mr);data=`2025-${String(idx+1).padStart(2,"0")}-${mm?mm[1].padStart(2,"0"):"01"}`; } }); }
                    let contato = ""; const tm=orig.match(/\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/); if(tm) contato=tm[0].replace(/\D/g,"");
                    let email = ""; const em=orig.match(/[\w.-]+@[\w.-]+\.\w+/); if(em) email=em[0];
                    let local = ""; const locs=["vila olimpia","moema","higienopolis","morumbi","pinheiros","itaim","faria lima","brooklin","santo andre","guarulhos","campinas","osasco","jundiai","alphaville"]; const lf=locs.find(l=>txt.includes(l)); if(lf) local=lf.replace(/\w/g,x=>x.toUpperCase())+" SP";
                    let cliente = "Cliente via WhatsApp";
                    const fam=orig.match(/famil[ií]a\s+([A-ZÁÀÂÃÉÈÊÍÓÔÕÚ][a-záàâãéèêíóôõú]+)/i); if(fam) cliente="Família "+fam[1];
                    else { const nc=orig.match(/(?:sou|me chamo|meu nome é|aqui é)\s+([A-ZÁÀÂÃÉÈÊÍÓÔÕÚ][a-záàâãéèêíóôõú]+(?:\s[A-ZÁÀÂÃÉÈÊÍÓÔÕÚ][a-záàâãéèêíóôõú]+)?)/i); if(nc) cliente=nc[1]; }
                    resultados.push({ cliente, contato, email, tipo, data, valor_pedido, local, obs:`Importado. ${tipo}${local?" em "+local:""}${valor_pedido?" · R$"+valor_pedido.toLocaleString("pt-BR"):""}`, selecionado: true });
                  }
                  setMultiResultados(resultados);
                  setMultiSelecionados(resultados.map((_, i) => i));
                  showT(`${resultados.length} conversa(s) analisada(s)! ✅`);
                  setMultiLoad(false);
                }} disabled={multiLoad} style={{ flex:1, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", color:"#fff", border:"none", borderRadius:9, padding:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {multiLoad ? <><span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>Analisando...</> : "✨ Analisar tudo"}
                </button>
                <button onClick={()=>{setShowImport(false);setMultiTexto("");}} style={{ background:"transparent",border:`1px solid ${G.border}`,color:G.muted,borderRadius:9,padding:"12px 16px",cursor:"pointer",fontFamily:"inherit" }}>✕</button>
              </div>
            </> : <>
              <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa", marginBottom:12 }}>✅ {multiResultados.length} conversa(s) analisada(s) — selecione quais importar:</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {multiResultados.map((r, i) => (
                  <div key={i} onClick={() => setMultiSelecionados(s => s.includes(i)?s.filter(x=>x!==i):[...s,i])} style={{ background: multiSelecionados.includes(i)?"rgba(167,139,250,0.08)":"#060a10", border:`1px solid ${multiSelecionados.includes(i)?"#a78bfa":G.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}>
                    <div style={{ width:20,height:20,borderRadius:6,border:`2px solid ${multiSelecionados.includes(i)?"#a78bfa":G.border}`,background:multiSelecionados.includes(i)?"#a78bfa":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12 }}>{multiSelecionados.includes(i)?"✓":""}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{r.cliente}</div>
                      <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>
                        <span style={{ background:`${r.tipo==="Casamento"?"#a78bfa":r.tipo==="Show/Bar"?"#22d3ee":r.tipo==="Corporativo"?"#f59e0b":"#4ade80"}18`, color:r.tipo==="Casamento"?"#a78bfa":r.tipo==="Show/Bar"?"#22d3ee":r.tipo==="Corporativo"?"#f59e0b":"#4ade80", padding:"1px 7px", borderRadius:4, fontWeight:700, marginRight:6 }}>{r.tipo}</span>
                        {r.local && `📍 ${r.local}`} {r.data && `· 📅 ${r.data}`} {r.valor_pedido > 0 && `· R$${r.valor_pedido.toLocaleString("pt-BR")}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>{
                  const novos = multiResultados.filter((_,i)=>multiSelecionados.includes(i)).map(r=>({...r,id:Date.now()+Math.random(),status:"aberto",valor_pedido:Number(r.valor_pedido)||0,valor_fechado:null}));
                  setOrcamentos([...orcamentos,...novos]);
                  setMultiResultados([]);setMultiTexto("");setMultiSelecionados([]);setShowImport(false);
                  showT(`${novos.length} lead(s) importado(s)! 🚀`);
                }} style={{ flex:1, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", color:"#fff", border:"none", borderRadius:9, padding:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  🚀 Importar {multiSelecionados.length} selecionado(s)
                </button>
                <button onClick={()=>{setMultiResultados([]);setMultiSelecionados([]);}} style={{ background:"transparent",border:`1px solid ${G.border}`,color:G.muted,borderRadius:9,padding:"12px 16px",cursor:"pointer",fontFamily:"inherit" }}>← Voltar</button>
              </div>
            </>}
          </div>}

          {showOrcForm && <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["cliente","Nome do cliente"],["contato","WhatsApp"],["email","E-mail"],["local","Local do evento"]].map(([f,p]) => <input key={f} placeholder={p} value={novoOrc[f]} onChange={e => setNovoOrc({ ...novoOrc, [f]: e.target.value })} style={inp} />)}
              <select value={novoOrc.tipo} onChange={e => setNovoOrc({ ...novoOrc, tipo: e.target.value })} style={{ ...inp }}>
                {(isMus ? ["Casamento","Corporativo","Aniversário","Formatura","Show","Outro"] : ["Matrícula","Rematrícula","Corporativo","Plano especial","Outro"]).map(t => <option key={t}>{t}</option>)}
              </select>
              <input type="date" value={novoOrc.data} onChange={e => setNovoOrc({ ...novoOrc, data: e.target.value })} style={inp} />
              <input placeholder="Valor pedido R$" type="number" value={novoOrc.valor_pedido} onChange={e => setNovoOrc({ ...novoOrc, valor_pedido: e.target.value })} style={inp} />
              <input placeholder="Observações" value={novoOrc.obs} onChange={e => setNovoOrc({ ...novoOrc, obs: e.target.value })} style={inp} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (!novoOrc.cliente || !novoOrc.contato) { showT("Preencha cliente e contato!", "e"); return; } setOrcamentos([...orcamentos, { ...novoOrc, id: Date.now(), status: "aberto", valor_pedido: Number(novoOrc.valor_pedido), valor_fechado: null }]); setNovoOrc({ cliente: "", contato: "", email: "", tipo: isMus ? "Casamento" : "Matrícula", data: "", valor_pedido: "", local: "", obs: "" }); setShowOrcForm(false); showT(isMus ? "Orçamento cadastrado!" : "Proposta cadastrada!"); }} style={{ flex: 1, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Salvar</button>
              <button onClick={() => setShowOrcForm(false)} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "12px 16px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
            </div>
          </div>}

          {orcamentos.map(orc => <div key={orc.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{orc.cliente}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{orc.tipo}{orc.local ? ` · ${orc.local}` : ""}{orc.data ? ` · ${orc.data}` : ""}</div><div style={{ fontSize: 12, color: G.muted }}>📞 {orc.contato}</div>{orc.obs && <div style={{ fontSize: 12, color: "#5a6a7e", marginTop: 4, fontStyle: "italic" }}>"{orc.obs}"</div>}</div>
              <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 18, fontWeight: 700 }}>R$ {Number(orc.valor_pedido).toLocaleString("pt-BR")}</div>{orc.valor_fechado && <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>✓ R$ {orc.valor_fechado.toLocaleString("pt-BR")}</div>}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {["aberto","negociando","fechado","perdido"].map(s => <button key={s} onClick={() => setOrcamentos(orcamentos.map(o => o.id === orc.id ? { ...o, status: s } : o))} style={{ background: orc.status === s ? `${sOrc[s].c}18` : "transparent", color: orc.status === s ? sOrc[s].c : G.muted, border: `1px solid ${orc.status === s ? sOrc[s].c + "40" : G.border}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>{sOrc[s].l}</button>)}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setWppModal(orc); setWppChat([]); }} style={{ flex: 1, background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "8px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🤖 Simular</button>
              <button onClick={() => setEditOrc({...orc})} style={{ flex: 1, background: "transparent", border: `1px solid ${G.border}`, color: "#22d3ee", borderRadius: 9, padding: "8px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✏️ Editar</button>
              <button onClick={() => { setShowRetornoModal(orc); setNovoRetorno({ data: "", horario: "", nota: "", quem: "eu", recorrente: false, diaRecorrente: "", horarioRecorrente: "" }); }} style={{ flex: 1, background: "transparent", border: "1px solid #f59e0b", color: "#f59e0b", borderRadius: 9, padding: "8px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>📌 Retorno</button>
              {orc.aniversario && <button onClick={() => { const msg = `🎂 Olá ${orc.cliente}! Feliz aniversário! 🎉

Desejamos um dia especial!

Como nosso cliente especial, você tem uma proposta exclusiva esperando por você. Entre em contato e aproveite! 🎁
— ${nomeN}`; window.open("https://wa.me/55" + orc.contato.replace(/\D/g,"") + "?text=" + encodeURIComponent(msg), "_blank"); }} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 9, padding: "8px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🎂</button>}
              {orc.status !== "fechado" && orc.status !== "perdido" && <button onClick={() => pedirIA(orc)} style={{ flex: 1, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", border: "none", borderRadius: 9, padding: "8px", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✨ IA</button>}
            </div>
          </div>)}
        </div>}

        {aba === "agenda" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>Agenda</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{evsMes.length} eventos esse mês</div></div>
            <button onClick={() => setShowEventoForm(!showEventoForm)} style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>+ Evento</button>
          </div>
          {showEventoForm && <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input placeholder="Título" value={novoEv.titulo} onChange={e => setNovoEv({ ...novoEv, titulo: e.target.value })} style={inp} />
              <select value={novoEv.tipo} onChange={e => setNovoEv({ ...novoEv, tipo: e.target.value })} style={{ ...inp }}>{tiposEv.map(t => <option key={t}>{t}</option>)}</select>
              <input type="date" value={novoEv.data} onChange={e => setNovoEv({ ...novoEv, data: e.target.value })} style={inp} />
              <input type="time" value={novoEv.horario} onChange={e => setNovoEv({ ...novoEv, horario: e.target.value })} style={inp} />
              <input placeholder="Local" value={novoEv.local} onChange={e => setNovoEv({ ...novoEv, local: e.target.value })} style={inp} />
              <input placeholder="Valor R$ (opcional)" type="number" value={novoEv.valor} onChange={e => setNovoEv({ ...novoEv, valor: e.target.value })} style={inp} />
              <div><div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Cor</div><div style={{ display: "flex", gap: 8 }}>{coresEv.map(cor => <div key={cor} onClick={() => setNovoEv({ ...novoEv, cor })} style={{ width: 28, height: 28, borderRadius: "50%", background: cor, cursor: "pointer", border: novoEv.cor === cor ? "3px solid #fff" : "3px solid transparent" }} />)}</div></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (!novoEv.titulo || !novoEv.data) { showT("Título e data obrigatórios!", "e"); return; } const conf = agenda.find(e => e.data === novoEv.data); if (conf) { showT(`⚠️ Já tem "${conf.titulo}" nessa data!`, "e"); return; } setAgenda([...agenda, { ...novoEv, id: Date.now(), valor: Number(novoEv.valor) || 0 }]); setNovoEv({ titulo: "", tipo: tiposEv[0], data: "", horario: "", local: "", valor: "", obs: "", cor: "#22d3ee" }); setShowEventoForm(false); showT("Evento adicionado! 📅"); }} style={{ flex: 1, background: "linear-gradient(135deg,#4ade80,#16a34a)", color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Salvar</button>
              <button onClick={() => setShowEventoForm(false)} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 9, padding: "12px 16px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
            </div>
          </div>}
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: mob ? 14 : 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={() => { if (agMes === 0) { setAgMes(11); setAgAno(agAno - 1); } else setAgMes(agMes - 1); }} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.text, borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 16 }}>‹</button>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 700 }}>{MESES_F[agMes]} {agAno}</div>
              <button onClick={() => { if (agMes === 11) { setAgMes(0); setAgAno(agAno + 1); } else setAgMes(agMes + 1); }} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.text, borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
              {["D","S","T","Q","Q","S","S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: G.muted, padding: "4px 0" }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {Array(primDia(agMes, agAno)).fill(null).map((_, i) => <div key={"e" + i} />)}
              {Array(diasMes(agMes, agAno)).fill(null).map((_, i) => {
                const dia = i + 1; const evs = evsDia(dia);
                const hoje = new Date(); const isHoje = dia === hoje.getDate() && agMes === hoje.getMonth() && agAno === hoje.getFullYear();
                return <div key={dia} onClick={() => evs.length && setEventoSel(evs[0])} style={{ minHeight: mob ? 38 : 48, borderRadius: 10, background: isHoje ? "rgba(34,211,238,0.12)" : evs.length ? "rgba(255,255,255,0.03)" : "transparent", border: `1px solid ${isHoje ? "rgba(34,211,238,0.3)" : evs.length ? G.border : "transparent"}`, padding: "4px 6px", cursor: evs.length ? "pointer" : "default" }}>
                  <div style={{ fontSize: 12, fontWeight: isHoje ? 700 : 400, color: isHoje ? "#22d3ee" : G.text }}>{dia}</div>
                  {evs.slice(0, 2).map(ev => <div key={ev.id} style={{ background: ev.cor, borderRadius: 3, height: 4, marginTop: 2, opacity: 0.85 }} />)}
                  {evs.length > 2 && <div style={{ fontSize: 9, color: G.muted }}>+{evs.length - 2}</div>}
                </div>;
              })}
            </div>
          </div>
          {evsMes.length > 0 && <><div style={{ fontSize: 13, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Eventos de {MESES_F[agMes]}</div>
            {evsMes.sort((a, b) => new Date(a.data) - new Date(b.data)).map(ev => <div key={ev.id} onClick={() => setEventoSel(ev)} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", marginBottom: 8 }}>
              <div style={{ width: 4, height: 44, borderRadius: 4, background: ev.cor, flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{ev.titulo}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{ev.data}{ev.horario ? ` · ${ev.horario}` : ""}{ev.local ? ` · ${ev.local}` : ""}</div></div>
              {ev.valor > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}>R$ {ev.valor.toLocaleString("pt-BR")}</div>}
            </div>)}</>}
          {evsMes.length === 0 && !showEventoForm && <div style={{ textAlign: "center", padding: "40px 20px", color: G.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>📅</div><div style={{ fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 6 }}>Nenhum evento esse mês</div><div style={{ fontSize: 13 }}>Clique em "+ Evento" para adicionar</div></div>}
        </div>}

        {aba === "retornos" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>Retornos</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Follow-ups agendados</div>
            </div>
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
              {retornos.filter(r => r.status === "pendente").length} pendentes
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["pendentes","concluidos"].map(t => <button key={t} onClick={() => setAbaRetorno(t)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: abaRetorno === t ? 700 : 400, background: abaRetorno === t ? "rgba(245,158,11,0.12)" : "transparent", color: abaRetorno === t ? "#f59e0b" : G.muted, fontFamily: "inherit" }}>
              {t === "pendentes" ? "⏳ Pendentes" : "✅ Concluídos"}
            </button>)}
          </div>

          {retornos.filter(r => abaRetorno === "pendentes" ? r.status === "pendente" : r.status === "concluido").length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: G.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📌</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 6 }}>Nenhum retorno {abaRetorno === "pendentes" ? "pendente" : "concluído"}</div>
              <div style={{ fontSize: 13 }}>Adicione retornos direto nos orçamentos</div>
            </div>
          )}

          {retornos.filter(r => abaRetorno === "pendentes" ? r.status === "pendente" : r.status === "concluido")
            .sort((a, b) => new Date(a.data + "T" + (a.horario || "00:00")) - new Date(b.data + "T" + (b.horario || "00:00")))
            .map(ret => {
              const agora = new Date();
              const dataRet = new Date(ret.data + "T" + (ret.horario || "00:00"));
              const diff = dataRet - agora;
              const urgente = diff > 0 && diff < 86400000 * 2;
              const atrasado = diff < 0 && ret.status === "pendente";
              return (
                <div key={ret.id} style={{ background: G.surface, border: `1px solid ${atrasado ? "rgba(248,113,113,0.4)" : urgente ? "rgba(245,158,11,0.4)" : G.border}`, borderRadius: 14, padding: "16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{ret.cliente}</span>
                        <span style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{ret.tipo}</span>
                        {atrasado && <span style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>⚠️ Atrasado</span>}
                        {urgente && <span style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>🔥 Hoje/Amanhã</span>}
                      </div>
                      {ret.nota && <div style={{ fontSize: 13, color: G.muted, fontStyle: "italic", marginBottom: 6 }}>"{ret.nota}"</div>}
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: G.muted, flexWrap: "wrap" }}>
                        <span>📅 {ret.data}{ret.horario ? ` às ${ret.horario}` : ""}</span>
                        <span style={{ color: ret.quem === "ia" ? "#a78bfa" : "#22d3ee" }}>{ret.quem === "ia" ? "🤖 IA dispara" : "👤 Você contata"}</span>
                        {ret.recorrente && <span style={{ color: "#22d3ee", background: "rgba(34,211,238,0.1)", padding: "1px 8px", borderRadius: 6, fontWeight: 700 }}>🔄 Todo mês dia {ret.diaRecorrente}{ret.horarioRecorrente ? ` às ${ret.horarioRecorrente}` : ""}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>R$ {ret.valor.toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                  {ret.status === "pendente" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => {
                        const orc = orcamentos.find(o => o.id === ret.orcId);
                        if (orc) { setWppModal(orc); setWppChat([]); }
                      }} style={{ flex: 1, background: "linear-gradient(135deg,#22c55e,#15803d)", color: "#fff", border: "none", borderRadius: 9, padding: "9px", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>📲 Abrir WhatsApp</button>
                      <button onClick={() => setRetornos(retornos.map(r => r.id === ret.id ? {...r, status: "concluido"} : r))}
                        style={{ flex: 1, background: "transparent", border: `1px solid ${G.border}`, color: "#4ade80", borderRadius: 9, padding: "9px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✓ Concluído</button>
                      <button onClick={() => setRetornos(retornos.filter(r => r.id !== ret.id))}
                        style={{ background: "transparent", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>}

        {aba === "mensagens" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>Central de Mensagens</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Triagem inteligente — IA responde, filtra e avisa você</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8 }}>
                {mensagens.filter(m => m.status === "aguardando").length} aguardando
              </span>
            </div>
          </div>

          {/* Simulador */}
          <div style={{ background: G.surface, border: "1px solid rgba(34,211,238,0.2)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🧪 Simulador de triagem</div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 14 }}>Digite qualquer mensagem e veja como a IA classificaria e responderia</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={simMsg} onChange={e => setSimMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && simularTriagem()} placeholder='Ex: "quanto você cobra?" ou "oi tudo bem?" ou "quero marcar consulta"' style={{ flex: 1, background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <button onClick={simularTriagem} disabled={simLoad} style={{ background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                {simLoad ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : "Testar →"}
              </button>
            </div>
            {simResposta && (
              <div style={{ marginTop: 14, background: "#060a10", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                    background: simResposta.status === "respondida" ? "rgba(74,222,128,0.1)" : simResposta.status === "silencio" ? "rgba(248,113,113,0.1)" : "rgba(245,158,11,0.1)",
                    color: simResposta.status === "respondida" ? "#4ade80" : simResposta.status === "silencio" ? "#f87171" : "#f59e0b"
                  }}>
                    {simResposta.status === "respondida" ? "✅ IA respondeu" : simResposta.status === "silencio" ? "🔇 IA ficou em silêncio" : "⚠️ Aguarda você"}
                  </span>
                  {simResposta.modelo && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: simResposta.modelo === "claude" ? "rgba(167,139,250,0.1)" : "rgba(74,222,128,0.1)", color: simResposta.modelo === "claude" ? "#a78bfa" : "#4ade80" }}>via {simResposta.modelo === "claude" ? "Claude" : "Gemini"}</span>}
                </div>
                {simResposta.respostaIA && (
                  <div style={{ background: "#22c55e", borderRadius: "12px 12px 12px 3px", padding: "10px 13px", maxWidth: "85%", fontSize: 13, color: "#fff", lineHeight: 1.6 }}>{simResposta.respostaIA}</div>
                )}
                {simResposta.motivo && <div style={{ fontSize: 12, color: G.muted, marginTop: 8, fontStyle: "italic" }}>💡 {simResposta.motivo}</div>}
              </div>
            )}
          </div>

          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[["todos","Todas",mensagens.length],["aguardando","⚠️ Aguardando",mensagens.filter(m=>m.status==="aguardando").length],["respondida","✅ Respondidas",mensagens.filter(m=>m.status==="respondida").length],["silencio","🔇 Silêncio",mensagens.filter(m=>m.status==="silencio").length]].map(([v,l,n]) => (
              <button key={v} onClick={() => setFiltroMsg(v)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: filtroMsg===v?700:400, background: filtroMsg===v?"rgba(34,211,238,0.12)":"transparent", color: filtroMsg===v?"#22d3ee":G.muted, fontFamily: "inherit" }}>
                {l} <span style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 6px", marginLeft: 4 }}>{n}</span>
              </button>
            ))}
          </div>

          {/* Lista de mensagens */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mensagens.filter(m => filtroMsg === "todos" || m.status === filtroMsg).map(msg => (
              <div key={msg.id} style={{ background: G.surface, border: `1px solid ${msg.status==="aguardando"?"rgba(245,158,11,0.3)":msg.status==="silencio"?"rgba(248,113,113,0.2)":G.border}`, borderRadius: 14, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{msg.contato}</span>
                      <span style={{ fontSize: 11, color: G.muted }}>{msg.hora}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                        background: msg.status==="respondida"?"rgba(74,222,128,0.1)":msg.status==="silencio"?"rgba(248,113,113,0.1)":"rgba(245,158,11,0.1)",
                        color: msg.status==="respondida"?"#4ade80":msg.status==="silencio"?"#f87171":"#f59e0b"
                      }}>
                        {msg.status==="respondida"?"✅ Respondida":msg.status==="silencio"?"🔇 Silêncio":"⚠️ Aguardando você"}
                      </span>
                      {msg.modelo && <span style={{ fontSize: 10, color: msg.modelo==="claude"?"#a78bfa":"#4ade80", fontWeight: 700 }}>via {msg.modelo==="claude"?"Claude":"Gemini"}</span>}
                    </div>
                    {/* Mensagem do cliente */}
                    <div style={{ background: "#060a10", borderRadius: "10px 10px 10px 3px", padding: "9px 12px", fontSize: 13, color: "#c8d6e5", lineHeight: 1.5, maxWidth: "85%", marginBottom: msg.respostaIA ? 8 : 0 }}>
                      {msg.texto}
                    </div>
                    {/* Resposta da IA */}
                    {msg.respostaIA && (
                      <div style={{ background: "#22c55e", borderRadius: "10px 10px 3px 10px", padding: "9px 12px", fontSize: 13, color: "#fff", lineHeight: 1.5, maxWidth: "85%", marginLeft: "auto" }}>
                        {msg.respostaIA}
                      </div>
                    )}
                    {/* Motivo silêncio/aguardando */}
                    {msg.motivo && <div style={{ fontSize: 11, color: G.muted, marginTop: 6, fontStyle: "italic" }}>💡 {msg.motivo}</div>}
                  </div>
                </div>
                {/* Ações */}
                {(msg.status === "aguardando" || msg.status === "silencio") && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {msg.whatsapp && <button onClick={() => window.open("https://wa.me/55"+msg.whatsapp.replace(/\D/g,""), "_blank")} style={{ flex: 1, background: "linear-gradient(135deg,#22c55e,#15803d)", color: "#fff", border: "none", borderRadius: 9, padding: "9px", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>📲 Responder no WhatsApp</button>}
                    <button onClick={() => setMensagens(mensagens.map(m => m.id===msg.id ? {...m, status:"respondida", respostaIA:"✓ Resolvido por você"} : m))} style={{ flex: 1, background: "transparent", border: `1px solid ${G.border}`, color: "#4ade80", borderRadius: 9, padding: "9px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✓ Marcar resolvido</button>
                    <button onClick={() => setMensagens(mensagens.filter(m => m.id !== msg.id))} style={{ background: "transparent", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>}

        {aba === "vitrine" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800 }}>Minha Vitrine</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Seu press kit digital + PDF profissional</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setVitrinePreview(true)} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, padding: "9px 14px", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>👁️ Preview</button>
              <button onClick={async () => {
                setPdfLoad(true);
                await new Promise(r => setTimeout(r, 100));
                try {
                  const script = document.createElement("script");
                  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                  document.head.appendChild(script);
                  await new Promise(r => script.onload = r);
                  const { jsPDF } = window.jspdf;
                  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                  const cor = vitrine.cor;
                  const hexToRgb = h => { const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16); return [r,g,b]; };
                  const [cr,cg,cb] = hexToRgb(cor);
                  // Header
                  doc.setFillColor(6,10,16);
                  doc.rect(0,0,210,297,"F");
                  doc.setFillColor(cr,cg,cb);
                  doc.rect(0,0,210,8,"F");
                  // Nome
                  doc.setTextColor(cr,cg,cb);
                  doc.setFontSize(28);
                  doc.setFont("helvetica","bold");
                  doc.text(vitrine.nome || nomeN, 20, 35);
                  // Título
                  doc.setTextColor(200,210,220);
                  doc.setFontSize(14);
                  doc.setFont("helvetica","normal");
                  doc.text(vitrine.titulo, 20, 45);
                  // Linha divisória
                  doc.setDrawColor(cr,cg,cb);
                  doc.setLineWidth(0.5);
                  doc.line(20,52,190,52);
                  // Bio
                  if (vitrine.bio) {
                    doc.setTextColor(180,190,200);
                    doc.setFontSize(11);
                    const bioLines = doc.splitTextToSize(vitrine.bio, 170);
                    doc.text(bioLines, 20, 62);
                  }
                  // Destaques
                  const dests = vitrine.destaques.filter(d => d.trim());
                  if (dests.length > 0) {
                    doc.setTextColor(cr,cg,cb);
                    doc.setFontSize(13);
                    doc.setFont("helvetica","bold");
                    doc.text("DESTAQUES", 20, 95);
                    doc.setFont("helvetica","normal");
                    doc.setFontSize(11);
                    doc.setTextColor(200,210,220);
                    dests.forEach((d, i) => { doc.text("• " + d, 20, 105 + i*10); });
                  }
                  // Contatos
                  doc.setTextColor(cr,cg,cb);
                  doc.setFontSize(13);
                  doc.setFont("helvetica","bold");
                  doc.text("CONTATOS & REDES", 20, 150);
                  doc.setFont("helvetica","normal");
                  doc.setFontSize(11);
                  doc.setTextColor(200,210,220);
                  let cy = 160;
                  if (vitrine.whatsapp) { doc.text("WhatsApp: " + vitrine.whatsapp, 20, cy); cy += 9; }
                  if (vitrine.instagram) { doc.text("Instagram: @" + vitrine.instagram, 20, cy); cy += 9; }
                  if (vitrine.youtube) { doc.text("YouTube: " + vitrine.youtube, 20, cy); cy += 9; }
                  if (vitrine.tiktok) { doc.text("TikTok: @" + vitrine.tiktok, 20, cy); cy += 9; }
                  if (vitrine.spotify) { doc.text("Spotify: " + vitrine.spotify, 20, cy); cy += 9; }
                  // Footer
                  doc.setFillColor(cr,cg,cb);
                  doc.rect(0,289,210,8,"F");
                  doc.setTextColor(6,10,16);
                  doc.setFontSize(9);
                  doc.setFont("helvetica","bold");
                  doc.text("Gerado por ZapManager • zapmanager.app", 105, 294, { align: "center" });
                  doc.save((vitrine.nome || nomeN).replace(/ /g,"_") + "_presskit.pdf");
                  showT("PDF gerado com sucesso! 🎉");
                } catch(e) { showT("Erro ao gerar PDF. Tente novamente.", "e"); }
                setPdfLoad(false);
              }} style={{ background: `linear-gradient(135deg,#f87171,#dc2626)`, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                {pdfLoad ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : "📄"} Press Kit PDF
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Coluna esquerda */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>👤 Informações principais</div>
                {/* TIPO DE CAPA */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Tipo de capa</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["foto","📸 Foto de capa"],["logo","🏢 Logo da empresa"],["texto","✍️ Só texto"]].map(([v,l]) => (
                      <button key={v} onClick={() => setVitrine({...vitrine, tipoCapa: v})} style={{ flex:1, padding:"10px 8px", borderRadius:10, border:`2px solid ${vitrine.tipoCapa===v?"#22d3ee":G.border}`, background:vitrine.tipoCapa===v?"rgba(34,211,238,0.08)":"transparent", color:vitrine.tipoCapa===v?"#22d3ee":G.muted, cursor:"pointer", fontFamily:"inherit", fontWeight:vitrine.tipoCapa===v?700:400, fontSize:12, transition:"all 0.2s" }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Upload foto de capa */}
                {vitrine.tipoCapa === "foto" && <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Foto de capa</div>
                  <label style={{ display:"block", background:"#060a10", border:`2px dashed ${vitrine.fotoCapa?"#22d3ee":G.border}`, borderRadius:12, padding:vitrine.fotoCapa?0:"20px", cursor:"pointer", overflow:"hidden", textAlign:"center" }}>
                    {vitrine.fotoCapa
                      ? <img src={vitrine.fotoCapa} alt="capa" style={{ width:"100%", height:160, objectFit:"cover", display:"block" }} />
                      : <div style={{ color:G.muted, fontSize:13 }}>📸 Clique para fazer upload da foto<br/><span style={{ fontSize:11 }}>JPG ou PNG • Recomendado: vertical</span></div>
                    }
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                      const file = e.target.files[0];
                      if (file) { const reader = new FileReader(); reader.onload = ev => setVitrine({...vitrine, fotoCapa: ev.target.result}); reader.readAsDataURL(file); }
                    }} />
                  </label>
                  {vitrine.fotoCapa && <button onClick={() => setVitrine({...vitrine, fotoCapa:""})} style={{ marginTop:6, background:"transparent", border:"none", color:"#f87171", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕ Remover foto</button>}
                </div>}

                {/* Upload logo */}
                {vitrine.tipoCapa === "logo" && <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Logo da empresa</div>
                  <label style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"#060a10", border:`2px dashed ${vitrine.logo?"#22d3ee":G.border}`, borderRadius:12, padding:16, cursor:"pointer", overflow:"hidden", minHeight:80 }}>
                    {vitrine.logo
                      ? <img src={vitrine.logo} alt="logo" style={{ maxHeight:80, maxWidth:"100%", objectFit:"contain" }} />
                      : <div style={{ color:G.muted, fontSize:13, textAlign:"center" }}>🏢 Clique para fazer upload do logo<br/><span style={{ fontSize:11 }}>PNG com fundo transparente é ideal</span></div>
                    }
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                      const file = e.target.files[0];
                      if (file) { const reader = new FileReader(); reader.onload = ev => setVitrine({...vitrine, logo: ev.target.result}); reader.readAsDataURL(file); }
                    }} />
                  </label>
                  {vitrine.logo && <button onClick={() => setVitrine({...vitrine, logo:""})} style={{ marginTop:6, background:"transparent", border:"none", color:"#f87171", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕ Remover logo</button>}
                </div>}
                {[["nome","Nome / Marca","text"],["titulo","Título (ex: Cantor Sertanejo)","text"],["bio","Bio / Descrição","textarea"]].map(([f,p,t]) => (
                  <div key={f} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{p}</div>
                    {t === "textarea"
                      ? <textarea value={vitrine[f]} onChange={e => setVitrine({...vitrine,[f]:e.target.value})} rows={3} placeholder="Fale um pouco sobre você ou seu negócio..." style={{ width:"100%", background:"#060a10", border:`1px solid ${G.border}`, borderRadius:10, padding:"11px 13px", color:G.text, fontSize:14, fontFamily:"inherit", outline:"none", resize:"vertical", lineHeight:1.6 }} />
                      : <input value={vitrine[f]} onChange={e => setVitrine({...vitrine,[f]:e.target.value})} placeholder={p} style={{ width:"100%", background:"#060a10", border:`1px solid ${G.border}`, borderRadius:10, padding:"11px 13px", color:G.text, fontSize:14, fontFamily:"inherit", outline:"none" }} />
                    }
                  </div>
                ))}
              </div>

              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>🎨 Cor do tema</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["#22d3ee","#a78bfa","#f59e0b","#4ade80","#f87171","#fb923c","#e879f9","#ffffff"].map(cor => (
                    <div key={cor} onClick={() => setVitrine({...vitrine, cor})} style={{ width: 36, height: 36, borderRadius: "50%", background: cor, cursor: "pointer", border: vitrine.cor === cor ? "3px solid #fff" : "3px solid transparent", boxShadow: vitrine.cor === cor ? `0 0 12px ${cor}` : "none", transition: "all 0.2s" }} />
                  ))}
                </div>
                <input type="color" value={vitrine.cor} onChange={e => setVitrine({...vitrine, cor: e.target.value})} style={{ marginTop: 12, width: "100%", height: 36, border: `1px solid ${G.border}`, borderRadius: 8, background: "#060a10", cursor: "pointer", padding: 2 }} />
                <div style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>Ou escolha qualquer cor personalizada</div>
              </div>

              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>⭐ Destaques</div>
                <div style={{ fontSize: 12, color: G.muted, marginBottom: 12 }}>Ex: "200+ eventos realizados", "10 anos de experiência"</div>
                {vitrine.destaques.map((d, i) => (
                  <input key={i} value={d} onChange={e => { const nd = [...vitrine.destaques]; nd[i] = e.target.value; setVitrine({...vitrine, destaques: nd}); }} placeholder={`Destaque ${i+1}`} style={{ width:"100%", background:"#060a10", border:`1px solid ${G.border}`, borderRadius:10, padding:"11px 13px", color:G.text, fontSize:14, fontFamily:"inherit", outline:"none", marginBottom:8 }} />
                ))}
              </div>
            </div>

            {/* Coluna direita */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>🔗 Redes sociais</div>
                {[["instagram","Instagram","@usuario"],["whatsapp","WhatsApp","5511999990000"],["youtube","YouTube","canal"],["tiktok","TikTok","@usuario"],["spotify","Spotify","link do perfil"]].map(([f,l,p]) => (
                  <div key={f} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{l}</div>
                    <input value={vitrine[f]} onChange={e => setVitrine({...vitrine,[f]:e.target.value})} placeholder={p} style={{ width:"100%", background:"#060a10", border:`1px solid ${G.border}`, borderRadius:10, padding:"11px 13px", color:G.text, fontSize:14, fontFamily:"inherit", outline:"none" }} />
                  </div>
                ))}
              </div>

              {/* Preview da cor */}
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>👁️ Prévia do card</div>
                <div style={{ background: "#060a10", borderRadius: 12, overflow: "hidden", border: `1px solid ${vitrine.cor}30` }}>
                  <div style={{ height: 6, background: vitrine.cor }} />
                  <div style={{ padding: "20px 18px" }}>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, color: vitrine.cor, marginBottom: 4 }}>{vitrine.nome || nomeN}</div>
                    <div style={{ fontSize: 13, color: "#8899b0", marginBottom: 12 }}>{vitrine.titulo || "Seu título aqui"}</div>
                    {vitrine.bio && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>{vitrine.bio.substring(0, 100)}{vitrine.bio.length > 100 ? "..." : ""}</div>}
                    {vitrine.destaques.filter(d => d).length > 0 && <div style={{ marginBottom: 14 }}>
                      {vitrine.destaques.filter(d => d).map((d, i) => <div key={i} style={{ fontSize: 11, color: vitrine.cor, marginBottom: 4 }}>⭐ {d}</div>)}
                    </div>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {vitrine.instagram && <span style={{ background: `${vitrine.cor}15`, color: vitrine.cor, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>📸 Instagram</span>}
                      {vitrine.whatsapp && <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>💬 WhatsApp</span>}
                      {vitrine.youtube && <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>▶️ YouTube</span>}
                      {vitrine.tiktok && <span style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>🎵 TikTok</span>}
                      {vitrine.spotify && <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>🎧 Spotify</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => showT("Vitrine salva! ✅")} style={{ width: "100%", background: `linear-gradient(135deg,${vitrine.cor},${vitrine.cor}cc)`, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", marginTop: 16 }}>
            💾 Salvar vitrine
          </button>
        </div>}

        {/* MODAL PREVIEW VITRINE */}
        {vitrinePreview && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 200, overflow: "auto", padding: 20 }} onClick={() => setVitrinePreview(false)}>
          <div style={{ maxWidth: 420, margin: "0 auto", marginTop: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: G.muted }}>Preview da vitrine pública</div>
              <button onClick={() => setVitrinePreview(false)} style={{ background: "transparent", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ background: "#060a10", borderRadius: 20, overflow: "hidden", border: `1px solid ${vitrine.cor}40`, boxShadow: `0 0 40px ${vitrine.cor}20` }}>
              {/* Header com tipo de capa */}
              {vitrine.tipoCapa === "foto" && vitrine.fotoCapa
                ? <div style={{ position:"relative", height:300, overflow:"hidden" }}>
                    <img src={vitrine.fotoCapa} alt="capa" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, rgba(6,10,16,0.95) 100%)" }} />
                    <div style={{ position:"absolute", bottom:20, left:20, right:20 }}>
                      <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, color:vitrine.cor, textShadow:"0 2px 8px rgba(0,0,0,0.8)" }}>{vitrine.nome||nomeN}</div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{vitrine.titulo}</div>
                    </div>
                  </div>
                : vitrine.tipoCapa === "logo" && vitrine.logo
                  ? <div style={{ background:`linear-gradient(135deg,#060a10,#0c1220)`, padding:"32px 24px", textAlign:"center", borderBottom:`1px solid ${vitrine.cor}30` }}>
                      <img src={vitrine.logo} alt="logo" style={{ maxHeight:80, maxWidth:"70%", objectFit:"contain", marginBottom:16 }} />
                      <div style={{ fontFamily:"Syne,sans-serif", fontSize:20, fontWeight:800, color:vitrine.cor }}>{vitrine.nome||nomeN}</div>
                      <div style={{ fontSize:13, color:"#8899b0", marginTop:4 }}>{vitrine.titulo}</div>
                    </div>
                  : <div style={{ background:`linear-gradient(135deg,${vitrine.cor}15,${vitrine.cor}05)`, padding:"32px 24px", borderBottom:`1px solid ${vitrine.cor}30` }}>
                      <div style={{ height:8, background:vitrine.cor, borderRadius:4, marginBottom:20, width:40 }} />
                      <div style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:800, color:vitrine.cor, marginBottom:6 }}>{vitrine.nome||nomeN}</div>
                      <div style={{ fontSize:14, color:"#8899b0" }}>{vitrine.titulo||"Seu título"}</div>
                    </div>
              }
              <div style={{ padding: "20px 24px 20px" }}>
                {vitrine.bio && <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>{vitrine.bio}</div>}

                {/* Destaques */}
                {vitrine.destaques.filter(d => d).length > 0 && <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Destaques</div>
                  {vitrine.destaques.filter(d => d).map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: vitrine.cor, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#c8d6e5" }}>{d}</span>
                    </div>
                  ))}
                </div>}

                {/* Redes */}
                <div style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Contatos</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {vitrine.whatsapp && <a href={"https://wa.me/55" + vitrine.whatsapp.replace(/\D/g,"")} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"10px 14px", textDecoration:"none" }}>
                    <span style={{ fontSize:18 }}>💬</span><span style={{ fontSize:14, fontWeight:600, color:"#22c55e" }}>WhatsApp</span>
                  </a>}
                  {vitrine.instagram && <a href={"https://instagram.com/" + vitrine.instagram.replace("@","")} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:10, background:`${vitrine.cor}10`, border:`1px solid ${vitrine.cor}20`, borderRadius:10, padding:"10px 14px", textDecoration:"none" }}>
                    <span style={{ fontSize:18 }}>📸</span><span style={{ fontSize:14, fontWeight:600, color:vitrine.cor }}>@{vitrine.instagram.replace("@","")}</span>
                  </a>}
                  {vitrine.youtube && <a href={"https://youtube.com/@" + vitrine.youtube} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", textDecoration:"none" }}>
                    <span style={{ fontSize:18 }}>▶️</span><span style={{ fontSize:14, fontWeight:600, color:"#ef4444" }}>{vitrine.youtube}</span>
                  </a>}
                  {vitrine.tiktok && <a href={"https://tiktok.com/@" + vitrine.tiktok.replace("@","")} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", textDecoration:"none" }}>
                    <span style={{ fontSize:18 }}>🎵</span><span style={{ fontSize:14, fontWeight:600, color:"#f87171" }}>@{vitrine.tiktok.replace("@","")}</span>
                  </a>}
                  {vitrine.spotify && <a href={vitrine.spotify} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:10, padding:"10px 14px", textDecoration:"none" }}>
                    <span style={{ fontSize:18 }}>🎧</span><span style={{ fontSize:14, fontWeight:600, color:"#4ade80" }}>Spotify</span>
                  </a>}
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${G.border}`, textAlign: "center", fontSize: 11, color: G.muted }}>
                  Gerado por <span style={{ color: vitrine.cor, fontWeight: 700 }}>ZapManager</span>
                </div>
              </div>
            </div>
          </div>
        </div>}

        {aba === "config" && <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: mob ? 20 : 26, fontWeight: 800, marginBottom: 20 }}>Configurações</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* SELETOR DE TEMA */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: T.text }}>🎨 Tema do app</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Escolha a aparência do seu ZapManager</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {Object.entries(TEMAS).map(([key, t]) => (
                  <button key={key} onClick={() => setTema(key)} style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${tema === key ? "#22d3ee" : T.border}`, background: t.bg, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: t.surface, border: `2px solid ${t.border}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: tema === key ? 700 : 400, color: t.text }}>{t.nome}</span>
                    {tema === key && <span style={{ marginLeft: "auto", color: "#22d3ee", fontSize: 16 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.text }}>🏢 Dados do negócio</div>
              <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Nome</div><input value={nomeN} onChange={e => setNomeN(e.target.value)} style={{ ...inp }} /></div>
              <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Chave PIX</div><input value={pix} onChange={e => setPix(e.target.value)} placeholder="CPF, CNPJ, telefone ou e-mail" style={{ ...inp }} /></div>
              <button onClick={() => showT("Dados salvos! ✅")} style={{ width: "100%", background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>💾 Salvar</button>
            </div>
            <div style={{ background: G.surface, border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🤖 Chaves de IA — Gemini + Claude</div>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 16, lineHeight: 1.7 }}>Mensagens simples vão para o Gemini (barato/gratuito). Perguntas complexas vão para o Claude (máxima qualidade).</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", padding: "1px 6px", borderRadius: 4 }}>Gemini Flash</span>
                </div>
                <input placeholder="AIza... (aistudio.google.com/app/apikey)" defaultValue="" style={{ ...inp }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "1px 6px", borderRadius: 4 }}>Claude Sonnet</span>
                </div>
                <input placeholder="sk-ant-... (console.anthropic.com)" defaultValue="" style={{ ...inp }} />
              </div>
              <div style={{ background: "#060a10", borderRadius: 10, padding: 14, fontSize: 12, color: G.muted, lineHeight: 1.9 }}>
                <div style={{ fontWeight: 700, color: G.text, marginBottom: 6 }}>🔀 Roteamento automático:</div>
                <div>"Qual o PIX?" → <span style={{ color: "#4ade80" }}>Gemini</span> (simples)</div>
                <div>"Qual o repertório?" → <span style={{ color: "#a78bfa" }}>Claude</span> (complexo)</div>
                <div>"Como funciona ao ar livre?" → <span style={{ color: "#a78bfa" }}>Claude</span> (complexo)</div>
              </div>
            </div>
            {mods.includes("cobranca") && <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>✏️ Mensagem padrão</div>
              <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={6} style={{ ...inp, lineHeight: 1.7, resize: "vertical" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {["{responsavel}","{aluno}","{mes}","{valor}","{vencimento}","{pix}","{nome_escola}"].map(tag => <span key={tag} onClick={() => setMensagem(mensagem + tag)} style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, cursor: "pointer" }}>{tag}</span>)}
              </div>
            </div>}
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, color: G.muted }}>Plano: <span style={{ color: plano.cor, fontWeight: 700 }}>{plano.nome} · R${plano.preco}/mês</span></div>
              <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>E-mail: <span style={{ color: G.text }}>{user.email}</span></div>
            </div>
          </div>
        </div>}
      </div>

      {mob && <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", padding: "8px 4px", zIndex: 50 }}>
        {abas.map(a => <button key={a.id} onClick={() => setAba(a.id)} style={{ flex: 1, background: "transparent", border: "none", cursor: "pointer", padding: "6px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
          <span style={{ fontSize: 18 }}>{a.icon}</span>
          <span style={{ fontSize: 10, color: aba === a.id ? "#22d3ee" : T.muted, fontWeight: aba === a.id ? 700 : 400 }}>{a.label}</span>
        </button>)}
      </div>}

      {showRetornoModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", padding: mob ? 0 : 24 }} onClick={() => setShowRetornoModal(null)}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: mob ? "20px 20px 0 0" : 20, padding: 24, width: "100%", maxWidth: mob ? "100%" : 460, margin: mob ? 0 : "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>📌</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Agendar retorno</div>
              <div style={{ fontSize: 12, color: G.muted }}>{showRetornoModal.cliente} · R$ {showRetornoModal.valor_pedido?.toLocaleString("pt-BR")}</div>
            </div>
            <button onClick={() => setShowRetornoModal(null)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Data</div>
              <input type="date" value={novoRetorno.data} onChange={e => setNovoRetorno({...novoRetorno, data: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Horário</div>
              <input type="time" value={novoRetorno.horario} onChange={e => setNovoRetorno({...novoRetorno, horario: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Anotação (opcional)</div>
            <input placeholder="Ex: Ana pediu pra ligar depois das 14h" value={novoRetorno.nota} onChange={e => setNovoRetorno({...novoRetorno, nota: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Quem entra em contato?</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["eu","👤 Eu mesmo","#22d3ee"],["ia","🤖 IA dispara sozinha","#a78bfa"]].map(([v,l,cor]) => (
                <button key={v} onClick={() => setNovoRetorno({...novoRetorno, quem: v})} style={{ flex: 1, padding: "12px 10px", borderRadius: 12, border: `2px solid ${novoRetorno.quem === v ? cor : G.border}`, background: novoRetorno.quem === v ? `${cor}15` : "transparent", color: novoRetorno.quem === v ? cor : G.muted, cursor: "pointer", fontFamily: "inherit", fontWeight: novoRetorno.quem === v ? 700 : 400, fontSize: 13, transition: "all 0.2s" }}>
                  {l}
                </button>
              ))}
            </div>
            {novoRetorno.quem === "ia" && <div style={{ marginTop: 8, fontSize: 12, color: "#a78bfa", background: "rgba(167,139,250,0.08)", borderRadius: 8, padding: "8px 12px" }}>
              🤖 No horário programado a IA enviará uma mensagem humanizada automaticamente.
            </div>}
            {novoRetorno.quem === "eu" && <div style={{ marginTop: 8, fontSize: 12, color: "#22d3ee", background: "rgba(34,211,238,0.08)", borderRadius: 8, padding: "8px 12px" }}>
              📱 Você receberá uma notificação no horário para entrar em contato.
            </div>}
          </div>

          {/* RECORRÊNCIA */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Repetir todo mês?</div>
              <button onClick={() => setNovoRetorno({...novoRetorno, recorrente: !novoRetorno.recorrente})} style={{ width: 44, height: 24, borderRadius: 12, background: novoRetorno.recorrente ? "#22d3ee" : G.border, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: novoRetorno.recorrente ? 23 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
            {novoRetorno.recorrente && (
              <div style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, color: "#22d3ee", marginBottom: 12 }}>🔄 Será repetido todo mês nessa data e horário</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Dia do mês</div>
                    <input type="number" min="1" max="31" placeholder="Ex: 15" value={novoRetorno.diaRecorrente} onChange={e => setNovoRetorno({...novoRetorno, diaRecorrente: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Horário</div>
                    <input type="time" value={novoRetorno.horarioRecorrente} onChange={e => setNovoRetorno({...novoRetorno, horarioRecorrente: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => {
            if (!novoRetorno.data) { showT("Escolha uma data!", "e"); return; }
            setRetornos([...retornos, {
              id: Date.now(),
              orcId: showRetornoModal.id,
              cliente: showRetornoModal.cliente,
              tipo: showRetornoModal.tipo,
              valor: showRetornoModal.valor_pedido,
              data: novoRetorno.data,
              horario: novoRetorno.horario,
              nota: novoRetorno.nota,
              quem: novoRetorno.quem,
              recorrente: novoRetorno.recorrente,
              diaRecorrente: novoRetorno.diaRecorrente,
              horarioRecorrente: novoRetorno.horarioRecorrente,
              status: "pendente"
            }]);
            setShowRetornoModal(null);
            showT("Retorno agendado! 📌");
            setAba("retornos");
          }} style={{ width: "100%", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
            📌 Agendar retorno
          </button>
        </div>
      </div>}

      {editOrc && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", padding: mob ? 0 : 24 }} onClick={() => setEditOrc(null)}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: mob ? "20px 20px 0 0" : 20, padding: 24, width: "100%", maxWidth: mob ? "100%" : 520, margin: mob ? 0 : "auto", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>✏️</span>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Editar orçamento</div>
            <button onClick={() => setEditOrc(null)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              ["cliente","Cliente"],["contato","WhatsApp"],["email","E-mail"],["local","Local do evento"]
            ].map(([f,l]) => (
              <div key={f}>
                <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{l}</div>
                <input value={editOrc[f] || ""} onChange={e => setEditOrc({...editOrc, [f]: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Tipo</div>
              <select value={editOrc.tipo || "Casamento"} onChange={e => setEditOrc({...editOrc, tipo: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
                {["Casamento","Corporativo","Aniversário","Formatura","Show","Outro"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Data do evento</div>
              <input type="date" value={editOrc.data || ""} onChange={e => setEditOrc({...editOrc, data: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Valor pedido R$</div>
              <input type="number" value={editOrc.valor_pedido || ""} onChange={e => setEditOrc({...editOrc, valor_pedido: e.target.value})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Valor fechado R$ (se fechou)</div>
              <input type="number" value={editOrc.valor_fechado || ""} onChange={e => setEditOrc({...editOrc, valor_fechado: e.target.value || null})} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Observações</div>
            <textarea value={editOrc.obs || ""} onChange={e => setEditOrc({...editOrc, obs: e.target.value})} rows={3} style={{ width: "100%", background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => {
              setOrcamentos(orcamentos.map(o => o.id === editOrc.id ? {...editOrc, valor_pedido: Number(editOrc.valor_pedido), valor_fechado: editOrc.valor_fechado ? Number(editOrc.valor_fechado) : null} : o));
              setEditOrc(null);
              showT("Orçamento atualizado! ✅");
            }} style={{ flex: 1, background: "linear-gradient(135deg,#22d3ee,#0e7490)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>💾 Salvar alterações</button>
            <button onClick={() => {
              if (window.confirm && window.confirm("Remover este orçamento?")) { setOrcamentos(orcamentos.filter(o => o.id !== editOrc.id)); setEditOrc(null); showT("Orçamento removido!"); }
              else { setOrcamentos(orcamentos.filter(o => o.id !== editOrc.id)); setEditOrc(null); showT("Orçamento removido!"); }
            }} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 10, padding: "13px 16px", cursor: "pointer", fontFamily: "inherit" }}>🗑️</button>
          </div>
        </div>
      </div>}

      {iaModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", padding: mob ? 0 : 24 }} onClick={() => setIaModal(null)}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: mob ? "20px 20px 0 0" : 20, padding: 24, width: "100%", maxWidth: mob ? "100%" : 500, margin: mob ? 0 : "auto", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <div><div style={{ fontWeight: 700 }}>Estratégia IA — {iaModal.cliente}</div><div style={{ fontSize: 12, color: G.muted }}>R$ {iaModal.valor_pedido} · {iaModal.tipo}</div></div>
            <button onClick={() => setIaModal(null)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          {iaLoad ? <div style={{ textAlign: "center", padding: 32, color: G.muted }}><div style={{ width: 28, height: 28, border: "2px solid #1a2235", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />Analisando com IA...</div>
            : <><div style={{ background: "#060a10", borderRadius: 12, padding: 18, fontSize: 14, color: "#c8d6e5", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{iaTexto}</div>
              {iaModelo && <div style={{ marginTop: 8, fontSize: 11, color: G.muted, textAlign: "right" }}>via <span style={{ color: iaModelo === "claude" ? "#a78bfa" : "#4ade80", fontWeight: 700 }}>{iaModelo === "claude" ? "Claude Sonnet" : "Gemini Flash"}</span></div>}</>}
          <button onClick={() => setIaModal(null)} style={{ width: "100%", background: "transparent", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 10, padding: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 14 }}>Fechar</button>
        </div>
      </div>}

      {wppModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", padding: mob ? 0 : 24 }} onClick={() => { setWppModal(null); setWppChat([]); }}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: mob ? "20px 20px 0 0" : 20, width: "100%", maxWidth: mob ? "100%" : 480, margin: mob ? 0 : "auto", height: mob ? "75vh" : "520px", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>💬</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{wppModal.responsavel || wppModal.cliente}</div>
              <div style={{ fontSize: 11, color: "#22c55e" }}>Roteamento Gemini + Claude ativo</div>
            </div>
            <button onClick={() => { setWppModal(null); setWppChat([]); }} style={{ marginLeft: "auto", background: "transparent", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {wppChat.length === 0 && <div style={{ textAlign: "center", color: G.muted, fontSize: 13, margin: "auto", padding: 20, lineHeight: 1.8 }}>
              Digite o que o cliente respondeu.<br />
              <span style={{ fontSize: 11 }}>Simples → <span style={{ color: "#4ade80" }}>Gemini</span> · Complexo → <span style={{ color: "#a78bfa" }}>Claude</span></span>
            </div>}
            {wppChat.map((m, i) => <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.r === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ background: m.r === "user" ? "#22c55e" : G.surface, border: m.r === "ai" ? `1px solid ${G.border}` : "none", color: "#fff", borderRadius: m.r === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 13px", maxWidth: "80%", fontSize: 13, lineHeight: 1.6 }}>{m.c}</div>
              {m.r === "ai" && m.modelo && <div style={{ fontSize: 10, color: G.muted, marginTop: 3, paddingLeft: 4 }}>via <span style={{ color: m.modelo === "claude" ? "#a78bfa" : "#4ade80", fontWeight: 700 }}>{m.modelo === "claude" ? "Claude" : "Gemini"}</span></div>}
            </div>)}
            {wppLoad && <div style={{ display: "flex", gap: 5, padding: "10px 13px", background: G.surface, borderRadius: 14, width: "fit-content" }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: G.muted, animation: "pulse 1s infinite", animationDelay: `${i * 0.2}s` }} />)}</div>}
          </div>
          <div style={{ padding: 14, borderTop: `1px solid ${G.border}`, display: "flex", gap: 8 }}>
            <input value={wppInput} onChange={e => setWppInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarWppIA()} placeholder="Resposta do cliente..." style={{ flex: 1, background: "#060a10", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            <button onClick={enviarWppIA} style={{ background: "linear-gradient(135deg,#22c55e,#15803d)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 16 }}>→</button>
          </div>
        </div>
      </div>}

      {eventoSel && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={() => setEventoSel(null)}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 500, margin: "0 auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 12, height: 44, borderRadius: 6, background: eventoSel.cor, flexShrink: 0 }} />
            <div><div style={{ fontWeight: 700, fontSize: 17 }}>{eventoSel.titulo}</div><div style={{ fontSize: 13, color: eventoSel.cor, fontWeight: 600 }}>{eventoSel.tipo}</div></div>
            <button onClick={() => setEventoSel(null)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eventoSel.data && <div style={{ fontSize: 14 }}>📅 {eventoSel.data}{eventoSel.horario ? ` às ${eventoSel.horario}` : ""}</div>}
            {eventoSel.local && <div style={{ fontSize: 14 }}>📍 {eventoSel.local}</div>}
            {eventoSel.valor > 0 && <div style={{ fontSize: 14, color: "#4ade80", fontWeight: 600 }}>💰 R$ {eventoSel.valor.toLocaleString("pt-BR")}</div>}
          </div>
          <button onClick={() => { setAgenda(agenda.filter(e => e.id !== eventoSel.id)); setEventoSel(null); showT("Evento removido!"); }} style={{ width: "100%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 10, padding: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, marginTop: 16 }}>🗑️ Remover evento</button>
        </div>
      </div>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <Login onLogin={setUser} />;
  if (user.role === "admin") return <AppAdmin onLogout={() => setUser(null)} />;
  return <AppCliente user={user} onLogout={() => setUser(null)} />;
}

const _root = document.getElementById("root");
if (_root && !_root._mounted) { _root._mounted = true; createRoot(_root).render(<App />); }
