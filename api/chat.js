// ─────────────────────────────────────────────
//  GrowAdvisor — API endpoint multi-proveedor
//  Para agregar un nuevo proveedor:
//    1. Agregá una entrada en PROVIDERS
//    2. Agregá la función handler correspondiente
//    3. Configurá la env var en Vercel
// ─────────────────────────────────────────────

const PROVIDERS = {
  claude: {
    label: 'Claude (Anthropic)',
    envKey: 'ANTHROPIC_API_KEY',
    handler: callClaude
  },
  gemini: {
    label: 'Gemini (Google)',
    envKey: 'GEMINI_API_KEY',
    handler: callGemini
  }
  // Para agregar más, seguí el mismo patrón:
  // groq: { label: 'Groq (LLaMA)', envKey: 'GROQ_API_KEY', handler: callGroq }
};

async function callClaude({ messages, system, apiKey }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Error de Anthropic API');
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía de Claude');
  return text;
}

async function callGemini({ messages, system, apiKey }) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 1000 }
      })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Error de Gemini API');
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía de Gemini');
  return text;
}

// Groq — descomentar cuando tengas la key en Vercel
// async function callGroq({ messages, system, apiKey }) {
//   const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
//     body: JSON.stringify({
//       model: 'llama-3.3-70b-versatile',
//       max_tokens: 1000,
//       messages: [{ role: 'system', content: system }, ...messages]
//     })
//   });
//   const data = await res.json();
//   if (!res.ok) throw new Error(data?.error?.message || 'Error de Groq API');
//   const text = data?.choices?.[0]?.message?.content;
//   if (!text) throw new Error('Respuesta vacía de Groq');
//   return text;
// }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, provider = 'claude' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo "messages" requerido.' });
  }

  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) {
    return res.status(400).json({
      error: `Proveedor "${provider}" no válido. Opciones: ${Object.keys(PROVIDERS).join(', ')}`
    });
  }

  const apiKey = process.env[providerConfig.envKey];
  if (!apiKey) {
    return res.status(500).json({
      error: `Variable ${providerConfig.envKey} no configurada en Vercel → Settings → Environment Variables.`
    });
  }

  try {
    const text = await providerConfig.handler({ messages, system, apiKey });
    return res.status(200).json({ content: [{ text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
