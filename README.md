# GrowAdvisor 🌱

Asesor de cultivo de cannabis con IA, construido sobre Claude (Anthropic).

## Stack

- **Frontend**: HTML + CSS + JS vanilla (sin dependencias)
- **Backend**: Vercel Serverless Functions (Node.js)
- **IA**: Claude claude-sonnet-4-20250514 vía API de Anthropic

## Estructura del proyecto

```
growadvisor/
├── api/
│   └── chat.js          # Endpoint serverless — proxy a Anthropic API
├── public/
│   ├── index.html       # UI del chatbot
│   ├── css/
│   │   └── style.css    # Estilos (light + dark mode)
│   └── js/
│       └── chat.js      # Lógica del chat (historial, fetch, render)
├── vercel.json          # Configuración de rutas Vercel
├── package.json
└── README.md
```

---

## Deploy en Vercel (recomendado)

### 1. Instalá Vercel CLI

```bash
npm install -g vercel
```

### 2. Obtené tu API Key de Anthropic

Entrá a [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.

### 3. Deploy

Desde la carpeta del proyecto:

```bash
vercel
```

Seguí los pasos del wizard. Cuando te pregunte si querés configurar el proyecto, decí que sí.

### 4. Configurá la variable de entorno

En el dashboard de Vercel (vercel.com → tu proyecto → Settings → Environment Variables):

```
ANTHROPIC_API_KEY = sk-ant-...tu-key...
```

O por CLI:

```bash
vercel env add ANTHROPIC_API_KEY
```

### 5. Re-deploy para aplicar la variable

```bash
vercel --prod
```

---

## Desarrollo local

```bash
npm install
vercel dev
```

Esto levanta el servidor en `http://localhost:3000` con hot reload.  
Para desarrollo local, creá un archivo `.env` en la raíz:

```
ANTHROPIC_API_KEY=sk-ant-...tu-key...
```

> ⚠️ Nunca commiteés el archivo `.env`. Está ignorado por defecto si usás el `.gitignore` estándar de Node.

---

## Personalización

### Cambiar el modelo

En `api/chat.js`, línea donde dice `model`:

```js
model: 'claude-haiku-4-5-20251001'  // más rápido y económico
model: 'claude-opus-4-6'              // más potente
```

### Cambiar el system prompt

En `public/js/chat.js`, editá la constante `SYSTEM_PROMPT` al inicio del archivo.

### Agregar sugerencias rápidas

En `public/index.html`, agregá botones dentro del `<div class="suggestions">`:

```html
<button class="sug-btn" data-msg="Tu pregunta aquí">Etiqueta</button>
```

---

## Próximos pasos sugeridos

- [ ] Agregar perfil de cultivo persistente (localStorage)
- [ ] Soporte para subir fotos de plantas (análisis visual con Claude)
- [ ] Diario de cultivo con historial por planta
- [ ] RAG con base de conocimiento especializada (grow guides, tablas de nutrientes)
- [ ] Calculadora de pH/EC integrada
