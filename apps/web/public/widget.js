(function(){"use strict";(function(){const g=document.currentScript,j=g==null?void 0:g.dataset.project,N=((g==null?void 0:g.dataset.apiUrl)??"http://localhost:3001").replace(/\/$/,"");if(!j){console.warn("[KAI] Missing data-project attribute.");return}let C=!1,B=!1;const x=[];let k="#6366f1",S="#6366f1",T="#6366f1",E="#f3f4f6",p="AI Assistant",y=null,A="",b,c,s,n,h,u;function F(){return`
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
        background: ${k};
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
        background: ${S};
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
        background: ${T};
        color: #fff;
        border-radius: 18px;
        border-bottom-right-radius: 4px;
        margin-bottom: 6px;
      }
      .kai-msg.assistant {
        align-self: flex-start;
        background: ${E};
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
        background: ${E};
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
      #kai-input-row:focus-within { border-color: ${k}; }

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
        background: ${k};
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
    `}const G='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',K='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',_='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',P='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>';function Y(){const t=document.createElement("div");t.id="kai-widget-host",b=t.attachShadow({mode:"open"});const d=document.createElement("style");if(d.textContent=F(),b.appendChild(d),A.trim()){const a=document.createElement("style");a.textContent=A,b.appendChild(a)}const o=document.createElement("div");if(u=document.createElement("button"),u.id="kai-bubble",u.setAttribute("aria-label","Open chat"),y){const a=document.createElement("img");a.src=y,a.alt=p,u.appendChild(a)}else u.innerHTML=G;u.addEventListener("click",U),c=document.createElement("div"),c.id="kai-panel";const e=document.createElement("div");e.id="kai-header";const i=document.createElement("div");i.id="kai-header-avatar";const r=document.createElement("div");if(r.id="kai-header-icon",y){const a=document.createElement("img");a.src=y,a.alt=p,r.appendChild(a)}else r.innerHTML=P;i.appendChild(r);const f=document.createElement("div");f.id="kai-accent-dot",i.appendChild(f);const m=document.createElement("div");m.id="kai-header-text";const l=document.createElement("div");l.id="kai-header-title",l.textContent=p;const $=document.createElement("div");$.id="kai-header-subtitle",$.textContent="AI Assistant",m.appendChild(l),m.appendChild($);const v=document.createElement("button");v.id="kai-close",v.innerHTML=K,v.setAttribute("aria-label","Close chat"),v.addEventListener("click",U),e.appendChild(i),e.appendChild(m),e.appendChild(v),s=document.createElement("div"),s.id="kai-messages";const I=document.createElement("div");I.id="kai-empty",I.innerHTML=`${P}<p>Ask me anything about ${p}!</p>`,s.appendChild(I),h=document.createElement("div"),h.id="kai-typing",h.innerHTML='<div class="kai-dot"></div><div class="kai-dot"></div><div class="kai-dot"></div>',s.appendChild(h);const M=document.createElement("div");M.id="kai-input-row",n=document.createElement("textarea"),n.id="kai-input",n.placeholder="Type a message…",n.rows=1,n.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),O())}),n.addEventListener("input",()=>{n.style.height="auto",n.style.height=Math.min(n.scrollHeight,100)+"px"});const z=document.createElement("div");z.id="kai-input-actions";const w=document.createElement("button");w.id="kai-send",w.innerHTML=_,w.setAttribute("aria-label","Send message"),w.addEventListener("click",O),z.appendChild(w),M.appendChild(n),M.appendChild(z);const H=document.createElement("div");H.id="kai-footer",H.textContent="Powered by KAI",c.appendChild(e),c.appendChild(s),c.appendChild(M),c.appendChild(H),o.appendChild(u),o.appendChild(c),b.appendChild(o),document.body.appendChild(t)}function U(){C=!C,c.classList.toggle("open",C),C&&setTimeout(()=>n.focus(),150)}function V(){const t=b.getElementById("kai-empty");x.length>0&&t&&t.remove(),s.querySelectorAll(".kai-msg-group, .kai-msg").forEach(o=>o.remove()),x.forEach(o=>{if(o.role==="assistant"){const e=document.createElement("div");e.className="kai-msg-group";const i=document.createElement("div");i.className="kai-msg assistant",i.textContent=o.text,e.appendChild(i);const r=document.createElement("span");r.className="kai-attribution",r.textContent=`${p} · AI · just now`,e.appendChild(r),s.insertBefore(e,h)}else{const e=document.createElement("div");e.className="kai-msg user",e.textContent=o.text,s.insertBefore(e,h)}}),L(B),s.scrollTop=s.scrollHeight}function L(t){B=t,h.classList.toggle("visible",t),t&&(s.scrollTop=s.scrollHeight)}async function O(){var o;const t=n.value.trim();if(!t||B)return;x.push({role:"user",text:t}),n.value="",n.style.height="auto",V(),L(!0);const d=b.getElementById("kai-send");d&&(d.disabled=!0);try{const e=await fetch(`${N}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:j,message:t})}),i=await e.json();if(e.ok)x.push({role:"assistant",text:((o=i.data)==null?void 0:o.answer)??"(no response)"});else{const r=(i==null?void 0:i.code)??"error",f={blocked:"Sorry, that message contains blocked content.",rate_limited:"You're sending messages too fast. Please wait a moment.",cap_exceeded:"Monthly usage limit reached.",no_api_key:"This assistant is not configured yet."};x.push({role:"assistant",text:f[r]??"Something went wrong. Please try again."})}}catch{x.push({role:"assistant",text:"Could not reach the server. Please try again."})}finally{L(!1),d&&(d.disabled=!1),V(),n.focus()}}async function W(){var t,d,o,e,i,r;try{const f=await fetch(`${N}/api/widget-config/${j}`);if(f.ok){const{data:m}=await f.json();p=m.projectName??p;const l=m.theme??{};k=((t=l.bubble)==null?void 0:t.backgroundColor)??k,S=((d=l.chatWindow)==null?void 0:d.headerColor)??S,T=((o=l.chatWindow)==null?void 0:o.userMessageColor)??T,E=((e=l.chatWindow)==null?void 0:e.aiMessageColor)??E,y=((i=l.bubble)==null?void 0:i.iconUrl)??null,A=((r=l.advanced)==null?void 0:r.customCss)??""}}catch{}Y()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",W):W()})()})();
