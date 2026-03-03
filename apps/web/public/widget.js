(function(){"use strict";(function(){const g=document.currentScript,M=g==null?void 0:g.dataset.project,H=((g==null?void 0:g.dataset.apiUrl)??"http://localhost:3001").replace(/\/$/,"");if(!M){console.warn("[KAI] Missing data-project attribute.");return}let w=!1,j=!1;const m=[];let x="#6366f1",B="#6366f1",S="#6366f1",C="#f3f4f6",p="AI Assistant",b=null,k,c,r,n,h,u;function W(){return`
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
        background: ${x};
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
        background: ${B};
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
        background: ${S};
        color: #fff;
        border-radius: 18px;
        border-bottom-right-radius: 4px;
        margin-bottom: 6px;
      }
      .kai-msg.assistant {
        align-self: flex-start;
        background: ${C};
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
        background: ${C};
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
      #kai-input-row:focus-within { border-color: ${x}; }

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
        background: ${x};
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
    `}const F='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',G='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',K='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',N='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>';function _(){const t=document.createElement("div");t.id="kai-widget-host",k=t.attachShadow({mode:"open"});const s=document.createElement("style");s.textContent=W(),k.appendChild(s);const o=document.createElement("div");if(u=document.createElement("button"),u.id="kai-bubble",u.setAttribute("aria-label","Open chat"),b){const d=document.createElement("img");d.src=b,d.alt=p,u.appendChild(d)}else u.innerHTML=F;u.addEventListener("click",P),c=document.createElement("div"),c.id="kai-panel";const e=document.createElement("div");e.id="kai-header";const i=document.createElement("div");i.id="kai-header-avatar";const a=document.createElement("div");if(a.id="kai-header-icon",b){const d=document.createElement("img");d.src=b,d.alt=p,a.appendChild(d)}else a.innerHTML=N;i.appendChild(a);const f=document.createElement("div");f.id="kai-accent-dot",i.appendChild(f);const l=document.createElement("div");l.id="kai-header-text";const A=document.createElement("div");A.id="kai-header-title",A.textContent=p;const L=document.createElement("div");L.id="kai-header-subtitle",L.textContent="AI Assistant",l.appendChild(A),l.appendChild(L);const y=document.createElement("button");y.id="kai-close",y.innerHTML=G,y.setAttribute("aria-label","Close chat"),y.addEventListener("click",P),e.appendChild(i),e.appendChild(l),e.appendChild(y),r=document.createElement("div"),r.id="kai-messages";const $=document.createElement("div");$.id="kai-empty",$.innerHTML=`${N}<p>Ask me anything about ${p}!</p>`,r.appendChild($),h=document.createElement("div"),h.id="kai-typing",h.innerHTML='<div class="kai-dot"></div><div class="kai-dot"></div><div class="kai-dot"></div>',r.appendChild(h);const E=document.createElement("div");E.id="kai-input-row",n=document.createElement("textarea"),n.id="kai-input",n.placeholder="Type a message…",n.rows=1,n.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey&&(d.preventDefault(),V())}),n.addEventListener("input",()=>{n.style.height="auto",n.style.height=Math.min(n.scrollHeight,100)+"px"});const I=document.createElement("div");I.id="kai-input-actions";const v=document.createElement("button");v.id="kai-send",v.innerHTML=K,v.setAttribute("aria-label","Send message"),v.addEventListener("click",V),I.appendChild(v),E.appendChild(n),E.appendChild(I);const z=document.createElement("div");z.id="kai-footer",z.textContent="Powered by KAI",c.appendChild(e),c.appendChild(r),c.appendChild(E),c.appendChild(z),o.appendChild(u),o.appendChild(c),k.appendChild(o),document.body.appendChild(t)}function P(){w=!w,c.classList.toggle("open",w),w&&setTimeout(()=>n.focus(),150)}function U(){const t=k.getElementById("kai-empty");m.length>0&&t&&t.remove(),r.querySelectorAll(".kai-msg-group, .kai-msg").forEach(o=>o.remove()),m.forEach(o=>{if(o.role==="assistant"){const e=document.createElement("div");e.className="kai-msg-group";const i=document.createElement("div");i.className="kai-msg assistant",i.textContent=o.text,e.appendChild(i);const a=document.createElement("span");a.className="kai-attribution",a.textContent=`${p} · AI · just now`,e.appendChild(a),r.insertBefore(e,h)}else{const e=document.createElement("div");e.className="kai-msg user",e.textContent=o.text,r.insertBefore(e,h)}}),T(j),r.scrollTop=r.scrollHeight}function T(t){j=t,h.classList.toggle("visible",t),t&&(r.scrollTop=r.scrollHeight)}async function V(){var o;const t=n.value.trim();if(!t||j)return;m.push({role:"user",text:t}),n.value="",n.style.height="auto",U(),T(!0);const s=k.getElementById("kai-send");s&&(s.disabled=!0);try{const e=await fetch(`${H}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:M,message:t})}),i=await e.json();if(e.ok)m.push({role:"assistant",text:((o=i.data)==null?void 0:o.answer)??"(no response)"});else{const a=(i==null?void 0:i.code)??"error",f={blocked:"Sorry, that message contains blocked content.",rate_limited:"You're sending messages too fast. Please wait a moment.",cap_exceeded:"Monthly usage limit reached.",no_api_key:"This assistant is not configured yet."};m.push({role:"assistant",text:f[a]??"Something went wrong. Please try again."})}}catch{m.push({role:"assistant",text:"Could not reach the server. Please try again."})}finally{T(!1),s&&(s.disabled=!1),U(),n.focus()}}async function O(){var t,s,o,e,i;try{const a=await fetch(`${H}/api/widget-config/${M}`);if(a.ok){const{data:f}=await a.json();p=f.projectName??p;const l=f.theme??{};x=((t=l.bubble)==null?void 0:t.backgroundColor)??x,B=((s=l.chatWindow)==null?void 0:s.headerColor)??B,S=((o=l.chatWindow)==null?void 0:o.userMessageColor)??S,C=((e=l.chatWindow)==null?void 0:e.aiMessageColor)??C,b=((i=l.bubble)==null?void 0:i.iconUrl)??null}}catch{}_()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",O):O()})()})();
