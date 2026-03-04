/**
 * KAI Widget — self-contained chat bubble for external sites.
 * Embed: <script src="/widget.js" data-project="PROJECT_ID" data-api-url="https://api.example.com"></script>
 */

declare const __API_URL__: string

;(function () {
  // ── Config ────────────────────────────────────────────────────────────────

  const script    = document.currentScript as HTMLScriptElement | null
  const projectId = script?.dataset.project
  const apiUrl    = (script?.dataset.apiUrl ?? __API_URL__).replace(/\/$/, '')

  if (!projectId) {
    console.warn('[Bentivi] Missing data-project attribute.')
    return
  }

  // ── State ─────────────────────────────────────────────────────────────────

  let isOpen   = false
  let isTyping = false

  interface Message { role: 'user' | 'assistant'; text: string }
  const messages: Message[] = []

  // Theme defaults (overridden by widget-config response)
  let bubbleBg     = '#6366f1'
  let headerAccent = '#6366f1'
  let userMsgBg    = '#6366f1'
  let aiMsgBg      = '#f3f4f6'
  let projectName  = 'Bentivi'
  let iconUrl: string | null = null
  let customCss    = ''
  let errorMessages: Record<string, string> = {}

  // Extended theme vars
  let fontFamily     = 'system'
  let colorScheme: 'light' | 'dark' | 'auto' = 'auto'
  let bubbleShape: 'circle' | 'pill' = 'circle'
  let bubbleLabel    = 'AI-mode'
  let backgroundType: 'solid' | 'gradient' = 'solid'
  let gradientFrom   = '#6366f1'
  let gradientTo     = '#8b5cf6'
  let headerLogoUrl: string | null = null
  let headerTitle    = ''
  let headerSubtitle = ''
  let darkHeaderColor      = '#6366f1'
  let darkUserMessageColor = '#6366f1'
  let darkAiMessageColor   = '#334155'
  let welcomeText          = ''

  // Chevron toggle — stores bubble innerHTML while panel is open
  let originalBubbleHTML = ''

  // ── DOM refs ──────────────────────────────────────────────────────────────

  let shadowRoot: ShadowRoot
  let panelEl:    HTMLElement
  let messagesEl: HTMLElement
  let inputEl:    HTMLTextAreaElement
  let typingEl:   HTMLElement
  let bubbleEl:   HTMLElement
  let hostEl:     HTMLElement

  // ── CSS helpers ───────────────────────────────────────────────────────────

  const fontDisplayNames: Record<string, string> = {
    'inter':     'Inter',
    'roboto':    'Roboto',
    'open-sans': 'Open Sans',
    'nunito':    'Nunito',
  }

  function getFontCss(): string {
    if (fontFamily === 'system') {
      return "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }
    const name = fontDisplayNames[fontFamily] ?? fontFamily
    return `'${name}', sans-serif`
  }

  function getBubbleBgStyle(): string {
    if (backgroundType === 'gradient') {
      return `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
    }
    return bubbleBg
  }

  // Focus-ring border colour (cannot use gradient for border-color)
  function getFocusColor(): string {
    return backgroundType === 'gradient' ? gradientFrom : bubbleBg
  }

  function getDarkStyles(): string {
    return `
      #kai-panel   { background: #1e293b; }
      #kai-header  { background: #1e293b; border-bottom-color: #334155; }
      #kai-header-icon { background: #273549; }
      #kai-header-title    { color: #f8fafc; }
      #kai-header-subtitle { color: #94a3b8; }
      #kai-accent-dot      { background: ${darkHeaderColor}; }
      .kai-msg.user        { background: ${darkUserMessageColor}; }
      .kai-msg.assistant   { background: ${darkAiMessageColor}; color: #e2e8f0; }
      .kai-attribution     { color: #64748b; }
      #kai-messages        { background: #1e293b; }
      #kai-input-row       { border-color: #334155; }
      #kai-input           { color: #f1f5f9; }
      #kai-input::placeholder { color: #64748b; }
      #kai-footer          { color: #475569; background: #1e293b; border-top-color: #334155; }
      #kai-close           { color: #64748b; }
      #kai-close:hover     { background: #334155; color: #94a3b8; }
      #kai-empty p         { color: #64748b; }
      .kai-dot             { background: #64748b; }
      #kai-typing          { background: ${darkAiMessageColor}; }
    `
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  function getStyles(): string {
    const bubBlBg      = getBubbleBgStyle()
    const focusColor   = getFocusColor()
    const fontCss      = getFontCss()

    // Dark mode block
    let darkBlock = ''
    if (colorScheme === 'dark') {
      darkBlock = getDarkStyles()
    } else if (colorScheme === 'auto') {
      darkBlock = `@media (prefers-color-scheme: dark) { ${getDarkStyles()} }`
    }

    // Pill-shape overrides for bubble
    const pillStyles = bubbleShape === 'pill' ? `
      #kai-bubble {
        width: auto !important;
        border-radius: 28px !important;
        padding: 0 18px !important;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
    ` : ''

    return `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: ${fontCss};
      }

      /* ── Bubble FAB ──────────────────────────────────────────────────────── */
      #kai-bubble {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${bubBlBg};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        color: #fff;
        overflow: hidden;
        white-space: nowrap;
      }
      #kai-bubble:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 20px rgba(0,0,0,0.22);
      }
      #kai-bubble img { width: 24px; height: 24px; object-fit: contain; border-radius: 50%; }
      ${pillStyles}

      /* ── Chat panel ──────────────────────────────────────────────────────── */
      #kai-panel {
        position: absolute;
        bottom: 68px;
        right: 0;
        width: 360px;
        max-height: 540px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.16);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(12px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      #kai-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* ── Mobile full-screen ──────────────────────────────────────────────── */
      @media (max-width: 640px) {
        #kai-panel {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-height: 100%;
          height: 100%;
          border-radius: 0;
          box-shadow: none;
          transform: translateY(100%);
          opacity: 1;
        }
        #kai-panel.open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: all;
        }
      }

      /* ── Fin/Intercom-style header (white) ───────────────────────────────── */
      #kai-header {
        background: #fff;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        border-bottom: 1px solid #f1f5f9;
      }

      #kai-header-avatar {
        position: relative;
        flex-shrink: 0;
      }
      #kai-header-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      #kai-header-icon img { width: 100%; height: 100%; object-fit: cover; }

      #kai-accent-dot {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        border: 2px solid #fff;
        background: ${headerAccent};
      }

      #kai-header-text { flex: 1; min-width: 0; }
      #kai-header-title {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #kai-header-subtitle {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 1px;
      }

      #kai-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;
      }
      #kai-close:hover { background: #f1f5f9; color: #475569; }

      /* ── Messages ────────────────────────────────────────────────────────── */
      #kai-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
      }

      .kai-msg-group {
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 6px;
      }

      .kai-msg {
        max-width: 82%;
        padding: 10px 13px;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
        white-space: pre-wrap;
      }
      .kai-msg.user {
        align-self: flex-end;
        background: ${userMsgBg};
        color: #fff;
        border-radius: 18px;
        border-bottom-right-radius: 4px;
        margin-bottom: 6px;
      }
      .kai-msg.assistant {
        align-self: flex-start;
        background: ${aiMsgBg};
        color: #1e293b;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
      }

      .kai-attribution {
        align-self: flex-start;
        font-size: 11px;
        color: #94a3b8;
        padding-left: 4px;
      }

      /* ── Typing indicator ────────────────────────────────────────────────── */
      #kai-typing {
        align-self: flex-start;
        background: ${aiMsgBg};
        padding: 10px 14px;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
        display: none;
        margin-bottom: 6px;
      }
      #kai-typing.visible { display: flex; gap: 4px; align-items: center; }

      .kai-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #94a3b8;
        animation: kai-bounce 1.2s infinite;
      }
      .kai-dot:nth-child(2) { animation-delay: 0.2s; }
      .kai-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes kai-bounce {
        0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
        40%            { transform: scale(1);   opacity: 1;   }
      }

      /* ── Empty state ─────────────────────────────────────────────────────── */
      #kai-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #94a3b8;
        padding: 24px;
        text-align: center;
      }
      #kai-empty svg { opacity: 0.4; }
      #kai-empty p { font-size: 13px; }

      /* ── Fin-style input row (column layout, pill border) ────────────────── */
      #kai-input-row {
        border: 2px solid #e2e8f0;
        border-radius: 14px;
        margin: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
        transition: border-color 0.15s;
      }
      #kai-input-row:focus-within { border-color: ${focusColor}; }

      #kai-input {
        flex: 1;
        border: none;
        border-radius: 0;
        padding: 0;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        outline: none;
        max-height: 100px;
        overflow-y: auto;
        line-height: 1.5;
        color: #1e293b;
        background: transparent;
      }
      #kai-input::placeholder { color: #94a3b8; }

      #kai-input-actions {
        display: flex;
        justify-content: flex-end;
      }

      #kai-send {
        background: ${bubBlBg};
        border: none;
        color: #fff;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s, opacity 0.15s;
      }
      #kai-send:disabled { opacity: 0.45; cursor: not-allowed; }
      #kai-send:not(:disabled):hover { filter: brightness(1.1); }

      /* ── "Powered by Bentivi" footer strip ──────────────────────────────── */
      #kai-footer {
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
        padding: 6px;
        border-top: 1px solid #f1f5f9;
        flex-shrink: 0;
      }

      ${darkBlock}
    `
  }

  // ── SVG icons ─────────────────────────────────────────────────────────────

  const birdSVG        = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>`
  const closeSVG       = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  const sendSVG        = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`
  const botSVG         = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>`
  const chevronDownSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`

  // ── Build DOM ─────────────────────────────────────────────────────────────

  function buildUI() {
    hostEl    = document.createElement('div')
    hostEl.id = 'kai-widget-host'
    shadowRoot = hostEl.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = getStyles()
    shadowRoot.appendChild(style)

    if (customCss.trim()) {
      const customStyle = document.createElement('style')
      customStyle.textContent = customCss
      shadowRoot.appendChild(customStyle)
    }

    const root = document.createElement('div')

    // Resolve header display values
    const displayTitle    = headerTitle.trim()    || projectName
    const displaySubtitle = headerSubtitle.trim() || 'Bentivi'
    const headerLogo      = headerLogoUrl !== null ? headerLogoUrl : iconUrl

    // ── Bubble FAB ───────────────────────────────────────────────────────────
    bubbleEl = document.createElement('button')
    bubbleEl.id = 'kai-bubble'
    bubbleEl.setAttribute('aria-label', 'Open chat')

    if (bubbleShape === 'pill') {
      // Pill: icon span + label span
      const iconSpan = document.createElement('span')
      iconSpan.style.cssText = 'display:flex;align-items:center;flex-shrink:0'
      if (iconUrl) {
        const img = document.createElement('img')
        img.src = iconUrl
        img.alt = projectName
        iconSpan.appendChild(img)
      } else {
        iconSpan.innerHTML = birdSVG
      }
      const labelSpan = document.createElement('span')
      labelSpan.textContent = bubbleLabel || 'AI-mode'
      bubbleEl.appendChild(iconSpan)
      bubbleEl.appendChild(labelSpan)
    } else {
      // Circle: icon only
      if (iconUrl) {
        const img = document.createElement('img')
        img.src = iconUrl
        img.alt = projectName
        bubbleEl.appendChild(img)
      } else {
        bubbleEl.innerHTML = birdSVG
      }
    }

    originalBubbleHTML = bubbleEl.innerHTML
    bubbleEl.addEventListener('click', togglePanel)

    // ── Panel ────────────────────────────────────────────────────────────────
    panelEl = document.createElement('div')
    panelEl.id = 'kai-panel'

    // ── Header (Fin-style: white, avatar + accent dot) ───────────────────────
    const header = document.createElement('div')
    header.id = 'kai-header'

    const avatarWrap = document.createElement('div')
    avatarWrap.id = 'kai-header-avatar'

    const iconBox = document.createElement('div')
    iconBox.id = 'kai-header-icon'
    if (headerLogo) {
      const img = document.createElement('img')
      img.src = headerLogo
      img.alt = displayTitle
      iconBox.appendChild(img)
    } else {
      iconBox.innerHTML = botSVG
    }
    avatarWrap.appendChild(iconBox)

    const dot = document.createElement('div')
    dot.id = 'kai-accent-dot'
    avatarWrap.appendChild(dot)

    const textWrap = document.createElement('div')
    textWrap.id = 'kai-header-text'

    const titleEl = document.createElement('div')
    titleEl.id          = 'kai-header-title'
    titleEl.textContent = displayTitle

    const subtitleEl = document.createElement('div')
    subtitleEl.id          = 'kai-header-subtitle'
    subtitleEl.textContent = displaySubtitle

    textWrap.appendChild(titleEl)
    textWrap.appendChild(subtitleEl)

    const closeBtn = document.createElement('button')
    closeBtn.id        = 'kai-close'
    closeBtn.innerHTML = closeSVG
    closeBtn.setAttribute('aria-label', 'Close chat')
    closeBtn.addEventListener('click', togglePanel)

    header.appendChild(avatarWrap)
    header.appendChild(textWrap)
    header.appendChild(closeBtn)

    // ── Messages area ────────────────────────────────────────────────────────
    messagesEl = document.createElement('div')
    messagesEl.id = 'kai-messages'

    const empty = document.createElement('div')
    empty.id = 'kai-empty'
    const displayWelcome = welcomeText.trim() || `Ask me anything about ${displayTitle}!`
    empty.innerHTML = `${botSVG}<p>${displayWelcome}</p>`
    messagesEl.appendChild(empty)

    typingEl = document.createElement('div')
    typingEl.id = 'kai-typing'
    typingEl.innerHTML = '<div class="kai-dot"></div><div class="kai-dot"></div><div class="kai-dot"></div>'
    messagesEl.appendChild(typingEl)

    // ── Input row ────────────────────────────────────────────────────────────
    const inputRow = document.createElement('div')
    inputRow.id = 'kai-input-row'

    inputEl = document.createElement('textarea')
    inputEl.id          = 'kai-input'
    inputEl.placeholder = 'Type a message…'
    inputEl.rows        = 1
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    })
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto'
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px'
    })

    const actions = document.createElement('div')
    actions.id = 'kai-input-actions'

    const sendBtn = document.createElement('button')
    sendBtn.id        = 'kai-send'
    sendBtn.innerHTML = sendSVG
    sendBtn.setAttribute('aria-label', 'Send message')
    sendBtn.addEventListener('click', sendMessage)

    actions.appendChild(sendBtn)
    inputRow.appendChild(inputEl)
    inputRow.appendChild(actions)

    // ── Footer branding ──────────────────────────────────────────────────────
    const footer = document.createElement('div')
    footer.id          = 'kai-footer'
    footer.textContent = 'Powered by Bentivi'

    panelEl.appendChild(header)
    panelEl.appendChild(messagesEl)
    panelEl.appendChild(inputRow)
    panelEl.appendChild(footer)

    root.appendChild(bubbleEl)
    root.appendChild(panelEl)
    shadowRoot.appendChild(root)
    document.body.appendChild(hostEl)
  }

  // ── Panel toggle ──────────────────────────────────────────────────────────

  function togglePanel() {
    isOpen = !isOpen
    panelEl.classList.toggle('open', isOpen)

    if (isOpen) {
      // Show chevron-down in bubble while panel is open
      originalBubbleHTML = bubbleEl.innerHTML
      bubbleEl.innerHTML = chevronDownSVG

      // Mobile: expand host to full screen so the panel can cover it
      if (window.innerWidth <= 640) {
        Object.assign(hostEl.style, { top: '0', left: '0', right: '0', bottom: '0' })
      }
      setTimeout(() => inputEl.focus(), 150)
    } else {
      // Restore original bubble icon
      bubbleEl.innerHTML = originalBubbleHTML

      // Mobile: collapse host back to corner
      if (window.innerWidth <= 640) {
        Object.assign(hostEl.style, { top: '', left: '', right: '' })
      }
    }
  }

  // ── Render messages ───────────────────────────────────────────────────────

  function renderMessages() {
    const empty = shadowRoot.getElementById('kai-empty')
    if (messages.length > 0 && empty) empty.remove()

    const existing = messagesEl.querySelectorAll('.kai-msg-group, .kai-msg')
    existing.forEach((el) => el.remove())

    messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        const group = document.createElement('div')
        group.className = 'kai-msg-group'

        const el = document.createElement('div')
        el.className   = 'kai-msg assistant'
        el.textContent = msg.text
        group.appendChild(el)

        const attr = document.createElement('span')
        attr.className   = 'kai-attribution'
        attr.textContent = `${headerTitle.trim() || projectName} · AI · just now`
        group.appendChild(attr)

        messagesEl.insertBefore(group, typingEl)
      } else {
        const el = document.createElement('div')
        el.className   = 'kai-msg user'
        el.textContent = msg.text
        messagesEl.insertBefore(el, typingEl)
      }
    })

    setTyping(isTyping)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  function setTyping(show: boolean) {
    isTyping = show
    typingEl.classList.toggle('visible', show)
    if (show) messagesEl.scrollTop = messagesEl.scrollHeight
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async function sendMessage() {
    const text = inputEl.value.trim()
    if (!text || isTyping) return

    messages.push({ role: 'user', text })
    inputEl.value = ''
    inputEl.style.height = 'auto'
    renderMessages()
    setTyping(true)

    const sendBtn = shadowRoot.getElementById('kai-send') as HTMLButtonElement
    if (sendBtn) sendBtn.disabled = true

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, message: text }),
      })

      const json = await res.json()

      if (!res.ok) {
        const code = json?.code ?? 'error'
        const defaults: Record<string, string> = {
          blocked:      'Sorry, that message contains blocked content.',
          rate_limited: "You're sending messages too fast. Please wait a moment.",
          cap_exceeded: 'Monthly usage limit reached.',
          no_api_key:   'This assistant is not configured yet.',
        }
        const custom: Record<string, string | undefined> = {
          blocked:      errorMessages.blocked,
          rate_limited: errorMessages.rateLimited,
          cap_exceeded: errorMessages.capExceeded,
          error:        errorMessages.apiError,
        }
        const errText =
          custom[code]?.trim()           ||
          defaults[code]                 ||
          errorMessages.default?.trim()  ||
          'Something went wrong. Please try again.'
        messages.push({ role: 'assistant', text: errText })
      } else {
        messages.push({ role: 'assistant', text: json.data?.answer ?? '(no response)' })
      }
    } catch {
      messages.push({ role: 'assistant', text: 'Could not reach the server. Please try again.' })
    } finally {
      setTyping(false)
      if (sendBtn) sendBtn.disabled = false
      renderMessages()
      inputEl.focus()
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  async function init() {
    try {
      const res = await fetch(`${apiUrl}/api/widget-config/${projectId}`)
      if (res.ok) {
        const { data } = await res.json()
        projectName = data.projectName ?? projectName

        const theme  = (data.theme ?? {}) as Record<string, Record<string, unknown>>
        const b      = (theme.bubble      ?? {}) as Record<string, unknown>
        const cw     = (theme.chatWindow  ?? {}) as Record<string, unknown>
        const g      = (theme.global      ?? {}) as Record<string, unknown>
        const adv    = (theme.advanced     ?? {}) as Record<string, unknown>

        // Existing colour vars
        bubbleBg     = (b.backgroundColor     as string) ?? bubbleBg
        headerAccent = (cw.headerColor         as string) ?? headerAccent
        userMsgBg    = (cw.userMessageColor    as string) ?? userMsgBg
        aiMsgBg      = (cw.aiMessageColor      as string) ?? aiMsgBg
        iconUrl      = (b.iconUrl              as string | null) ?? null
        customCss    = (adv.customCss          as string) ?? ''

        // New extended vars
        fontFamily     = (g.fontFamily         as string) ?? 'system'
        colorScheme    = ((cw.colorScheme      as 'light' | 'dark' | 'auto') ?? 'auto')
        bubbleShape    = ((b.shape             as 'circle' | 'pill') ?? 'circle')
        bubbleLabel    = (b.label              as string) ?? 'AI-mode'
        backgroundType = ((b.backgroundType    as 'solid' | 'gradient') ?? 'solid')
        gradientFrom   = (b.gradientFrom       as string) ?? gradientFrom
        gradientTo     = (b.gradientTo         as string) ?? gradientTo
        headerLogoUrl  = (cw.headerLogoUrl     as string | null) ?? null
        headerTitle    = (cw.headerTitle       as string) ?? ''
        headerSubtitle = (cw.headerSubtitle    as string) ?? ''
        darkHeaderColor      = (cw.darkHeaderColor      as string) ?? darkHeaderColor
        darkUserMessageColor = (cw.darkUserMessageColor as string) ?? darkUserMessageColor
        darkAiMessageColor   = (cw.darkAiMessageColor   as string) ?? darkAiMessageColor
        welcomeText          = (cw.welcomeText           as string) ?? ''

        errorMessages  = (data.errorMessages ?? {}) as Record<string, string>

        // Load Google Font if needed
        if (fontFamily !== 'system') {
          const fontParams: Record<string, string> = {
            'inter':     'Inter:wght@400;500;600',
            'roboto':    'Roboto:wght@400;500;700',
            'open-sans': 'Open+Sans:wght@400;500;600',
            'nunito':    'Nunito:wght@400;500;600',
          }
          const param = fontParams[fontFamily]
          if (param) {
            const link = document.createElement('link')
            link.rel  = 'stylesheet'
            link.href = `https://fonts.googleapis.com/css2?family=${param}&display=swap`
            document.head.appendChild(link)
          }
        }
      }
    } catch {
      // Use defaults
    }

    buildUI()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
