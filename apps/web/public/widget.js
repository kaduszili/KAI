(function(){"use strict";(function(){const f=document.currentScript,A=f==null?void 0:f.dataset.project,Z=((f==null?void 0:f.dataset.apiUrl)??"http://localhost:3001").replace(/\/$/,"");if(!A){console.warn("[Bentivi] Missing data-project attribute.");return}let S=!1,I=!1;const b=[];let B="#6366f1",z="#6366f1",F="#6366f1",L="#f3f4f6",k="Bentivi",x=null,N="",y={},w="system",U="auto",O="circle",ee="AI-mode",P="solid",$="#6366f1",V="#8b5cf6",W=null,_="",te="",D="#6366f1",G="#6366f1",j="#334155",oe="",Y="",v,u,d,a,m,l,C;const pe={inter:"Inter",roboto:"Roboto","open-sans":"Open Sans",nunito:"Nunito"};function ue(){return w==="system"?"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif":`'${pe[w]??w}', sans-serif`}function he(){return P==="gradient"?`linear-gradient(135deg, ${$}, ${V})`:B}function me(){return P==="gradient"?$:B}function ie(){return`
      #kai-panel   { background: #1e293b; }
      #kai-header  { background: #1e293b; border-bottom-color: #334155; }
      #kai-header-icon { background: #273549; }
      #kai-header-title    { color: #f8fafc; }
      #kai-header-subtitle { color: #94a3b8; }
      #kai-accent-dot      { background: ${D}; }
      .kai-msg.user        { background: ${G}; }
      .kai-msg.assistant   { background: ${j}; color: #e2e8f0; }
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
      #kai-typing          { background: ${j}; }
    `}function ge(){const o=he(),r=me(),i=ue();let e="";return U==="dark"?e=ie():U==="auto"&&(e=`@media (prefers-color-scheme: dark) { ${ie()} }`),`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: ${i};
      }

      /* ── Bubble FAB ──────────────────────────────────────────────────────── */
      #kai-bubble {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${o};
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
      ${O==="pill"?`
      #kai-bubble {
        width: auto !important;
        border-radius: 28px !important;
        padding: 0 18px !important;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
    `:""}

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
        background: ${z};
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
        background: ${F};
        color: #fff;
        border-radius: 18px;
        border-bottom-right-radius: 4px;
        margin-bottom: 6px;
      }
      .kai-msg.assistant {
        align-self: flex-start;
        background: ${L};
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
        background: ${L};
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
      #kai-input-row:focus-within { border-color: ${r}; }

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
        background: ${o};
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

      ${e}
    `}const ne='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>',fe='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',be='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',ae='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>',ke='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';function xe(){C=document.createElement("div"),C.id="kai-widget-host",v=C.attachShadow({mode:"open"});const o=document.createElement("style");if(o.textContent=ge(),v.appendChild(o),N.trim()){const n=document.createElement("style");n.textContent=N,v.appendChild(n)}const r=document.createElement("div"),i=_.trim()||k,e=te.trim()||"Bentivi",t=W!==null?W:x;if(l=document.createElement("button"),l.id="kai-bubble",l.setAttribute("aria-label","Open chat"),O==="pill"){const n=document.createElement("span");if(n.style.cssText="display:flex;align-items:center;flex-shrink:0",x){const X=document.createElement("img");X.src=x,X.alt=k,n.appendChild(X)}else n.innerHTML=ne;const ce=document.createElement("span");ce.textContent=ee||"AI-mode",l.appendChild(n),l.appendChild(ce)}else if(x){const n=document.createElement("img");n.src=x,n.alt=k,l.appendChild(n)}else l.innerHTML=ne;Y=l.innerHTML,l.addEventListener("click",re),u=document.createElement("div"),u.id="kai-panel";const s=document.createElement("div");s.id="kai-header";const c=document.createElement("div");c.id="kai-header-avatar";const h=document.createElement("div");if(h.id="kai-header-icon",t){const n=document.createElement("img");n.src=t,n.alt=i,h.appendChild(n)}else h.innerHTML=ae;c.appendChild(h);const g=document.createElement("div");g.id="kai-accent-dot",c.appendChild(g);const p=document.createElement("div");p.id="kai-header-text";const E=document.createElement("div");E.id="kai-header-title",E.textContent=i;const q=document.createElement("div");q.id="kai-header-subtitle",q.textContent=e,p.appendChild(E),p.appendChild(q);const M=document.createElement("button");M.id="kai-close",M.innerHTML=fe,M.setAttribute("aria-label","Close chat"),M.addEventListener("click",re),s.appendChild(c),s.appendChild(p),s.appendChild(M),d=document.createElement("div"),d.id="kai-messages";const J=document.createElement("div");J.id="kai-empty";const ye=oe.trim()||`Ask me anything about ${i}!`;J.innerHTML=`${ae}<p>${ye}</p>`,d.appendChild(J),m=document.createElement("div"),m.id="kai-typing",m.innerHTML='<div class="kai-dot"></div><div class="kai-dot"></div><div class="kai-dot"></div>',d.appendChild(m);const H=document.createElement("div");H.id="kai-input-row",a=document.createElement("textarea"),a.id="kai-input",a.placeholder="Type a message…",a.rows=1,a.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),le())}),a.addEventListener("input",()=>{a.style.height="auto",a.style.height=Math.min(a.scrollHeight,100)+"px"});const K=document.createElement("div");K.id="kai-input-actions";const T=document.createElement("button");T.id="kai-send",T.innerHTML=be,T.setAttribute("aria-label","Send message"),T.addEventListener("click",le),K.appendChild(T),H.appendChild(a),H.appendChild(K);const Q=document.createElement("div");Q.id="kai-footer",Q.textContent="Powered by Bentivi",u.appendChild(s),u.appendChild(d),u.appendChild(H),u.appendChild(Q),r.appendChild(l),r.appendChild(u),v.appendChild(r),document.body.appendChild(C)}function re(){S=!S,u.classList.toggle("open",S),S?(Y=l.innerHTML,l.innerHTML=ke,window.innerWidth<=640&&Object.assign(C.style,{top:"0",left:"0",right:"0",bottom:"0"}),setTimeout(()=>a.focus(),150)):(l.innerHTML=Y,window.innerWidth<=640&&Object.assign(C.style,{top:"",left:"",right:""}))}function se(){const o=v.getElementById("kai-empty");b.length>0&&o&&o.remove(),d.querySelectorAll(".kai-msg-group, .kai-msg").forEach(i=>i.remove()),b.forEach(i=>{if(i.role==="assistant"){const e=document.createElement("div");e.className="kai-msg-group";const t=document.createElement("div");t.className="kai-msg assistant",t.textContent=i.text,e.appendChild(t);const s=document.createElement("span");s.className="kai-attribution",s.textContent=`${_.trim()||k} · AI · just now`,e.appendChild(s),d.insertBefore(e,m)}else{const e=document.createElement("div");e.className="kai-msg user",e.textContent=i.text,d.insertBefore(e,m)}}),R(I),d.scrollTop=d.scrollHeight}function R(o){I=o,m.classList.toggle("visible",o),o&&(d.scrollTop=d.scrollHeight)}async function le(){var i,e,t;const o=a.value.trim();if(!o||I)return;b.push({role:"user",text:o}),a.value="",a.style.height="auto",se(),R(!0);const r=v.getElementById("kai-send");r&&(r.disabled=!0);try{const s=await fetch(`${Z}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:A,message:o})}),c=await s.json();if(s.ok)b.push({role:"assistant",text:((t=c.data)==null?void 0:t.answer)??"(no response)"});else{const h=(c==null?void 0:c.code)??"error",g={blocked:"Sorry, that message contains blocked content.",rate_limited:"You're sending messages too fast. Please wait a moment.",cap_exceeded:"Monthly usage limit reached.",no_api_key:"This assistant is not configured yet."},E=((i={blocked:y.blocked,rate_limited:y.rateLimited,cap_exceeded:y.capExceeded,error:y.apiError}[h])==null?void 0:i.trim())||g[h]||((e=y.default)==null?void 0:e.trim())||"Something went wrong. Please try again.";b.push({role:"assistant",text:E})}}catch{b.push({role:"assistant",text:"Could not reach the server. Please try again."})}finally{R(!1),r&&(r.disabled=!1),se(),a.focus()}}async function de(){try{const o=await fetch(`${Z}/api/widget-config/${A}`);if(o.ok){const{data:r}=await o.json();k=r.projectName??k;const i=r.theme??{},e=i.bubble??{},t=i.chatWindow??{},s=i.global??{},c=i.advanced??{};if(B=e.backgroundColor??B,z=t.headerColor??z,F=t.userMessageColor??F,L=t.aiMessageColor??L,x=e.iconUrl??null,N=c.customCss??"",w=s.fontFamily??"system",U=t.colorScheme??"auto",O=e.shape??"circle",ee=e.label??"AI-mode",P=e.backgroundType??"solid",$=e.gradientFrom??$,V=e.gradientTo??V,W=t.headerLogoUrl??null,_=t.headerTitle??"",te=t.headerSubtitle??"",D=t.darkHeaderColor??D,G=t.darkUserMessageColor??G,j=t.darkAiMessageColor??j,oe=t.welcomeText??"",y=r.errorMessages??{},w!=="system"){const g={inter:"Inter:wght@400;500;600",roboto:"Roboto:wght@400;500;700","open-sans":"Open+Sans:wght@400;500;600",nunito:"Nunito:wght@400;500;600"}[w];if(g){const p=document.createElement("link");p.rel="stylesheet",p.href=`https://fonts.googleapis.com/css2?family=${g}&display=swap`,document.head.appendChild(p)}}}}catch{}xe()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",de):de()})()})();
