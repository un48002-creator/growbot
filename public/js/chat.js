const SYSTEM_PROMPT = `Sos un experto cultivador de cannabis con más de 15 años de experiencia en cultivos indoor, outdoor y greenhouse. Tu nombre es GrowAdvisor.

ESTILO Y PERSONALIDAD:
- Respondés directo y práctico, como un grower con experiencia real en el terreno
- Español rioplatense (Argentina/Uruguay): "vos", "tenés", "podés", etc.
- Si falta información importante para diagnosticar un problema (pH, temperatura, humedad, medio de cultivo, semana de crecimiento), la pedís de forma concisa — máximo 2 preguntas a la vez
- Sos empático pero eficiente: entendés que el cultivador quiere soluciones concretas

FORMATO DE RESPUESTAS:
- Máximo 200 palabras salvo que la pregunta requiera más detalle
- Usá listas con guiones cuando tengas 3 o más puntos clave
- Marcá con **negrita** los términos técnicos más importantes
- Si el problema puede ser grave o urgente, indicalo claramente al inicio

ÁREAS DE EXPERTISE:
- Nutrición y fertilización: macronutrientes (N, P, K), micronutrientes, deficiencias y toxicidades
- pH y EC: rangos óptimos según medio (tierra, coco, hidro) y etapa
- Control de plagas: ácaros, trips, mosca blanca, fungus gnats, pulgones
- Enfermedades: hongos (oídio, botrytis, fusarium), virosis
- Manejo del ambiente: temperatura, humedad relativa, VPD, CO2
- Técnicas de cultivo: LST, SCROG, SOG, topping, FIM, supercropping, lollipopping
- Fotoperiodo y luz: espectro, PPFD, DLI, distancia, horas de luz por etapa
- Sustratos: tierra, coco, perlita, lana de roca, sistemas hidropónicos
- Cosecha y post-cosecha: lectura de tricomas, flush, secado, curado`;

// ── Configuración de providers ──────────────
// Para agregar un nuevo provider:
//   1. Agregá una entrada acá
//   2. Agregá el botón correspondiente en index.html
//   3. Configurá la env var en Vercel
const PROVIDERS = {
  claude: { label: 'Claude',  badgeClass: 'badge-claude' },
  gemini: { label: 'Gemini',  badgeClass: 'badge-gemini' },
  // groq: { label: 'Groq', badgeClass: 'badge-groq' },
};

let currentProvider = 'claude';
const history = [];
let loading = false;

const messagesEl    = document.getElementById('messages');
const inputEl       = document.getElementById('user-input');
const sendBtn       = document.getElementById('send-btn');
const suggestionsEl = document.getElementById('suggestions');
const statusLabel   = document.getElementById('status-label');
const pillsEl       = document.getElementById('provider-pills');

// ── Provider switching ───────────────────────
pillsEl.querySelectorAll('.provider-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    if (loading) return;
    currentProvider = btn.dataset.provider;
    pillsEl.querySelectorAll('.provider-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const label = PROVIDERS[currentProvider]?.label || currentProvider;
    statusLabel.textContent = label + ' activo';
  });
});

// ── Helpers ──────────────────────────────────
function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatText(raw) {
  const esc = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>\n?)+/gs, m => '<ul>' + m + '</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function createBubble(role, content, provider, isError) {
  const row = document.createElement('div');
  row.className = 'msg-row ' + role;

  const av = document.createElement('div');
  av.className = 'avatar ' + (role === 'user' ? 'av-user' : 'av-bot');
  av.textContent = role === 'user' ? 'VOS' : 'IA';

  const bub = document.createElement('div');
  bub.className = 'bubble ' + role + (isError ? ' error' : '');

  if (role === 'user') {
    bub.textContent = content;
  } else {
    const cfg = provider && PROVIDERS[provider];
    const badge = cfg
      ? `<span class="provider-badge ${cfg.badgeClass}">${cfg.label}</span>`
      : '';
    bub.innerHTML = '<p>' + formatText(content) + '</p>' + badge;
  }

  row.appendChild(av);
  row.appendChild(bub);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.id = 'typing-row';
  const av = document.createElement('div');
  av.className = 'avatar av-bot';
  av.textContent = 'IA';
  const bub = document.createElement('div');
  bub.className = 'bubble bot';
  bub.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  row.appendChild(av);
  row.appendChild(bub);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function hideTyping() {
  document.getElementById('typing-row')?.remove();
}

function setLoading(val) {
  loading = val;
  sendBtn.disabled = val;
  inputEl.disabled = val;
  pillsEl.querySelectorAll('.provider-pill').forEach(p => {
    p.style.pointerEvents = val ? 'none' : '';
    p.style.opacity = val ? '0.5' : '';
  });
}

// ── Send message ─────────────────────────────
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || loading) return;

  inputEl.value = '';
  inputEl.style.height = 'auto';
  suggestionsEl.style.display = 'none';

  createBubble('user', text);
  history.push({ role: 'user', content: text });

  const usedProvider = currentProvider;
  setLoading(true);
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        system: SYSTEM_PROMPT,
        provider: usedProvider
      })
    });

    const data = await res.json();
    hideTyping();

    if (!res.ok) {
      createBubble('bot', 'Error: ' + (data?.error || 'Error desconocido.'), null, true);
      history.pop();
      setLoading(false);
      return;
    }

    const reply = data?.content?.[0]?.text;
    if (!reply) {
      createBubble('bot', 'No se recibió respuesta. Intentá de nuevo.', null, true);
      history.pop();
      setLoading(false);
      return;
    }

    history.push({ role: 'assistant', content: reply });
    createBubble('bot', reply, usedProvider);

  } catch (err) {
    hideTyping();
    createBubble('bot', 'Error de conexión. Verificá que el servidor esté corriendo.', null, true);
    history.pop();
  }

  setLoading(false);
}

// ── Event listeners ──────────────────────────
sendBtn.addEventListener('click', sendMessage);

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

inputEl.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

suggestionsEl.querySelectorAll('.sug-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    inputEl.value = btn.dataset.msg;
    sendMessage();
  });
});
