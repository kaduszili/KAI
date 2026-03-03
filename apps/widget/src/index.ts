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
    console.warn('[KAI] Missing data-project attribute.')
    return
  }

  // ── State ─────────────────────────────────────────────────────────────────

  let isOpen   = false
  let isTyping = false

  interface Message { role: 'user' | 'assistant'; text: string }
  const messages: Message[] = []

  // Theme defaults (overridden by widget-config response)
  let bubbleBg     = '#6366f1'
  let headerAccent = '#6366f1'   // accent dot colour + send button
  let userMsgBg    = '#6366f1'
  let aiMsgBg      = '#f3f4f6'
  let projectName  = 'AI Assistant'
  let iconUrl: string | null = null
  let customCss    = ''

  // ── DOM refs ──────────────────────────────────────────────────────────────

  let shadowRoot: ShadowRoot
  let panelEl:    HTMLElement
  let messagesEl: HTMLElement
  let inputEl:    HTMLTextAreaElement
  let typingEl:   HTMLElement
  let bubbleEl:   HTMLElement

  // ── CSS ───────────────────────────────────────────────────────────────────

  function getStyles(): string {
    return `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      /* ── Bubble FAB ──────────────────────────────────────────────────────── */
      #kai-bubble {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${bubbleBg};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        color: #fff;
        overflow: hidden;
      }
      #kai-bubble:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 20px rgba(0,0,0,0.22);
      }
      #kai-bubble img { width: 24px; height: 24px; object-fit: contain; border-radius: 50%; }

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
      #kai-input-row:focus-within { border-color: ${bubbleBg}; }

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
        background: ${bubbleBg};
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

      /* ── "Powered by KAI" footer strip ───────────────────────────────────── */
      #kai-footer {
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
        padding: 6px;
        border-top: 1px solid #f1f5f9;
        flex-shrink: 0;
      }
    `
  }

  // ── SVG icons ─────────────────────────────────────────────────────────────

  const chatSVG  = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  const closeSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  const sendSVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`
  const botSVG   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>`

  // ── Build DOM ─────────────────────────────────────────────────────────────

  function buildUI() {
    const host = document.createElement('div')
    host.id    = 'kai-widget-host'
    shadowRoot = host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = getStyles()
    shadowRoot.appendChild(style)

    if (customCss.trim()) {
      const customStyle = document.createElement('style')
      customStyle.textContent = customCss
      shadowRoot.appendChild(customStyle)
    }

    const root = document.createElement('div')

    // ── Bubble FAB ───────────────────────────────────────────────────────────
    bubbleEl = document.createElement('button')
    bubbleEl.id = 'kai-bubble'
    bubbleEl.setAttribute('aria-label', 'Open chat')
    if (iconUrl) {
      const img = document.createElement('img')
      img.src = iconUrl
      img.alt = projectName
      bubbleEl.appendChild(img)
    } else {
      bubbleEl.innerHTML = chatSVG
    }
    bubbleEl.addEventListener('click', togglePanel)

    // ── Panel ────────────────────────────────────────────────────────────────
    panelEl = document.createElement('div')
    panelEl.id = 'kai-panel'

    // ── Header (Fin-style: white, avatar + accent dot) ───────────────────────
    const header = document.createElement('div')
    header.id = 'kai-header'

    // Avatar wrapper (icon + accent dot)
    const avatarWrap = document.createElement('div')
    avatarWrap.id = 'kai-header-avatar'

    const iconBox = document.createElement('div')
    iconBox.id = 'kai-header-icon'
    if (iconUrl) {
      const img = document.createElement('img')
      img.src = iconUrl
      img.alt = projectName
      iconBox.appendChild(img)
    } else {
      iconBox.innerHTML = botSVG
    }
    avatarWrap.appendChild(iconBox)

    const dot = document.createElement('div')
    dot.id = 'kai-accent-dot'
    avatarWrap.appendChild(dot)

    // Text (project name + subtitle)
    const textWrap = document.createElement('div')
    textWrap.id = 'kai-header-text'

    const title = document.createElement('div')
    title.id          = 'kai-header-title'
    title.textContent = projectName

    const subtitle = document.createElement('div')
    subtitle.id          = 'kai-header-subtitle'
    subtitle.textContent = 'AI Assistant'

    textWrap.appendChild(title)
    textWrap.appendChild(subtitle)

    // Close button (minimal, slate/gray)
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

    // Empty state
    const empty = document.createElement('div')
    empty.id = 'kai-empty'
    empty.innerHTML = `${botSVG}<p>Ask me anything about ${projectName}!</p>`
    messagesEl.appendChild(empty)

    // Typing indicator — inside messagesEl so insertBefore(el, typingEl) works
    typingEl = document.createElement('div')
    typingEl.id = 'kai-typing'
    typingEl.innerHTML = '<div class="kai-dot"></div><div class="kai-dot"></div><div class="kai-dot"></div>'
    messagesEl.appendChild(typingEl)

    // ── Input row (Fin-style: column, pill border) ───────────────────────────
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
    footer.textContent = 'Powered by KAI'

    panelEl.appendChild(header)
    panelEl.appendChild(messagesEl)
    panelEl.appendChild(inputRow)
    panelEl.appendChild(footer)

    root.appendChild(bubbleEl)
    root.appendChild(panelEl)
    shadowRoot.appendChild(root)
    document.body.appendChild(host)
  }

  // ── Panel toggle ──────────────────────────────────────────────────────────

  function togglePanel() {
    isOpen = !isOpen
    panelEl.classList.toggle('open', isOpen)
    if (isOpen) {
      setTimeout(() => inputEl.focus(), 150)
    }
  }

  // ── Render messages ───────────────────────────────────────────────────────

  function renderMessages() {
    const empty = shadowRoot.getElementById('kai-empty')
    if (messages.length > 0 && empty) empty.remove()

    // Remove existing rendered messages/groups
    const existing = messagesEl.querySelectorAll('.kai-msg-group, .kai-msg')
    existing.forEach((el) => el.remove())

    messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        // Wrap bubble + attribution in a group div
        const group = document.createElement('div')
        group.className = 'kai-msg-group'

        const el = document.createElement('div')
        el.className  = 'kai-msg assistant'
        el.textContent = msg.text
        group.appendChild(el)

        const attr = document.createElement('span')
        attr.className   = 'kai-attribution'
        attr.textContent = `${projectName} · AI · just now`
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
        const errMap: Record<string, string> = {
          blocked:      'Sorry, that message contains blocked content.',
          rate_limited: "You're sending messages too fast. Please wait a moment.",
          cap_exceeded: 'Monthly usage limit reached.',
          no_api_key:   'This assistant is not configured yet.',
        }
        messages.push({ role: 'assistant', text: errMap[code] ?? 'Something went wrong. Please try again.' })
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

        const theme  = data.theme ?? {}
        bubbleBg     = theme.bubble?.backgroundColor     ?? bubbleBg
        headerAccent = theme.chatWindow?.headerColor      ?? headerAccent
        userMsgBg    = theme.chatWindow?.userMessageColor ?? userMsgBg
        aiMsgBg      = theme.chatWindow?.aiMessageColor   ?? aiMsgBg
        iconUrl      = theme.bubble?.iconUrl              ?? null
        customCss    = theme.advanced?.customCss          ?? ''
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
