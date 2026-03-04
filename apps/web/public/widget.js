(function(){"use strict";(function(){const b=document.currentScript,G=b==null?void 0:b.dataset.project,ie=((b==null?void 0:b.dataset.apiUrl)??"http://localhost:3001").replace(/\/$/,"");if(!G){console.warn("[Bentevi] Missing data-project attribute.");return}let M=!1,I=!1;const k=[];let B="#6366f1",O="#6366f1",z="#6366f1",$="#f3f4f6",x="Bentevi",y=null,F="",v={},w="system",N="auto",V="circle",oe="AI-mode",P="solid",W=!1,j="#6366f1",_="#8b5cf6",D=null,Y="",ne="",R="#6366f1",Z="#6366f1",H="#334155",ae="",q="",C,u,d,a,g,l,p,E;const fe={inter:"Inter",roboto:"Roboto","open-sans":"Open Sans",nunito:"Nunito"};function ge(){return w==="system"?"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif":`'${fe[w]??w}', sans-serif`}function me(){return P==="gradient"?`linear-gradient(135deg, ${j}, ${_})`:B}function be(){return P==="gradient"?j:B}function re(){return`
      #kai-panel   { background: #1e293b; }
      #kai-header  { background: #1e293b; border-bottom-color: #334155; }
      #kai-header-icon { background: #273549; }
      #kai-header-title    { color: #f8fafc; }
      #kai-header-subtitle { color: #94a3b8; }
      #kai-accent-dot      { background: ${R}; }
      .kai-msg.user        { background: ${Z}; }
      .kai-msg.assistant   { background: ${H}; color: #e2e8f0; }
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
      #kai-typing          { background: ${H}; }
    `}function ke(){const i=me(),r=be(),o=ge();let e="";return N==="dark"?e=re():N==="auto"&&(e=`@media (prefers-color-scheme: dark) { ${re()} }`),`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: ${o};
      }

      /* ── Bubble FAB ──────────────────────────────────────────────────────── */
      #kai-bubble {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${i};
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
      ${V==="pill"?`
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
        background: ${O};
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
        background: ${z};
        color: #fff;
        border-radius: 18px;
        border-bottom-right-radius: 4px;
        margin-bottom: 6px;
      }
      .kai-msg.assistant {
        align-self: flex-start;
        background: ${$};
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
        background: ${$};
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
        background: ${i};
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

      /* ── "Powered by Bentevi" footer strip ──────────────────────────────── */
      #kai-footer {
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
        padding: 6px;
        border-top: 1px solid #f1f5f9;
        flex-shrink: 0;
      }
      #kai-footer-link {
        color: inherit;
        text-decoration: underline;
      }
      #kai-footer-link:hover { color: #64748b; }

      /* ── Sparkle animation badge (top-left of bubble when closed) ────────── */
      #kai-bubble-wrap {
        position: relative;
        display: inline-flex;
      }
      #kai-anim-badge {
        position: absolute;
        top: -6px;
        left: -6px;
        width: 18px;
        height: 18px;
        pointer-events: none;
        display: none;
        opacity: 0;
      }
      #kai-anim-badge.visible {
        display: block;
        animation: kai-sparkle-anim 6s ease-in-out 10s both;
      }
      #kai-anim-badge svg {
        width: 18px;
        height: 18px;
        transform-origin: center;
      }
      @keyframes kai-sparkle-anim {
        0%   { opacity: 0; transform: rotate(0deg);    }
        8%   { opacity: 1; transform: rotate(172deg);  }
        84%  { opacity: 1; transform: rotate(1800deg); }
        100% { opacity: 0; transform: rotate(2160deg); }
      }

      ${e}
    `}const se='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>',xe='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',ye='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',le='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>',ve='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',we='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><defs><linearGradient id="kai-sg4-fill" x1="11.249" y1="14.6222" x2="17.9998" y2="14.6222" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0073ec"/><stop offset="100%" stop-color="#a644e5"/></linearGradient><linearGradient id="kai-sg5-fill" x1="11.2494" y1="3.37247" x2="17.9995" y2="3.37247" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0073ec"/><stop offset="100%" stop-color="#a644e5"/></linearGradient><linearGradient id="kai-sg7-fill" x1="-0.002441" y1="8.99706" x2="13.4994" y2="8.99706" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0073ec"/><stop offset="100%" stop-color="#a644e5"/></linearGradient></defs><path d="M17.844,14.3705l-2.0946-.8733-.8733-2.0946c-.0233-.0468-.0592-.0862-.1037-.1137-.0444-.0275-.0957-.0421-.148-.0421s-.1035.0146-.148.0421-.0804.0669-.1037.1137l-.8733,2.0946-2.0946.8733c-.0468.0233-.0862.0592-.1137.1037s-.0421.0957-.0421.148.0146.1036.0421.148.0669.0804.1137.1037l2.0946.8733.8733,2.0946c.0233.0468.0592.0862.1037.1137s.0957.0421.148.0421.1036-.0145.148-.0421c.0445-.0275.0804-.0669.1037-.1137l.8733-2.0946l2.0946-.8733c.0468-.0233.0862-.0592.1137-.1037s.0421-.0957.0421-.148-.0146-.1035-.0421-.148-.0669-.0804-.1137-.1037Z" fill="url(#kai-sg4-fill)"/><path d="M11.4048,3.62384l2.0946.87363.8733,2.09461c.0233.04681.0593.08618.1037.1137s.0957.0421.148.0421.1036-.01458.1481-.0421c.0444-.02752.0803-.06689.1037-.1137l.8732-2.09461l2.0947-.87363c.0467-.02336.0859-.05927.1134-.10369s.042-.09563.042-.14785-.0145-.10342-.042-.14785-.0667-.08033-.1134-.1037l-2.0947-.87328-.8732-2.094606c-.0234-.046802-.0593-.086174-.1037-.113694-.0445-.027521-.0958-.0421-.1481-.0421s-.1035.014579-.148.0421-.0804.066892-.1037.113694L13.4994,2.24747l-2.0946.87328c-.0467.02337-.086.05927-.1134.1037s-.042.09562-.042.14785.0145.10342.042.14785.0667.08033.1134.10369Z" fill="url(#kai-sg5-fill)"/><path d="M13.4994,8.98475c-.0001-.10451-.0292-.20694-.0841-.29589s-.1333-.16092-.2267-.2079L9.23111,6.4985L7.25251,2.53393c-.19125-.38215-.81527-.38215-1.00617,0L4.26775,6.4985L0.310207,8.48096c-.093882.04654-.172897.11838-.228138.20743s-.08451.19174-.08451.29653.02927.20749.08451.29654.134256.16088.228138.20743L4.26775,11.4713l1.97859,3.9646c.04672.0934.11853.172.20739.2269s.19124.084.2957.084.20684-.0291.29569-.084.16067-.1335.20739-.2269l1.9786-3.9646L13.1886,9.48959c.0935-.0471.1721-.11924.227-.20838s.0839-.19178.0838-.29646Z" fill="url(#kai-sg7-fill)"/></svg>';function Ce(){E=document.createElement("div"),E.id="kai-widget-host",C=E.attachShadow({mode:"open"});const i=document.createElement("style");if(i.textContent=ke(),C.appendChild(i),F.trim()){const n=document.createElement("style");n.textContent=F,C.appendChild(n)}const r=document.createElement("div"),o=Y.trim()||x,e=ne.trim()||"Bentevi",t=D!==null?D:y;if(l=document.createElement("button"),l.id="kai-bubble",l.setAttribute("aria-label","Open chat"),V==="pill"){const n=document.createElement("span");if(n.style.cssText="display:flex;align-items:center;flex-shrink:0",y){const te=document.createElement("img");te.src=y,te.alt=x,n.appendChild(te)}else n.innerHTML=se;const ue=document.createElement("span");ue.textContent=oe||"AI-mode",l.appendChild(n),l.appendChild(ue)}else if(y){const n=document.createElement("img");n.src=y,n.alt=x,l.appendChild(n)}else l.innerHTML=se;q=l.innerHTML,l.addEventListener("click",de),u=document.createElement("div"),u.id="kai-panel";const s=document.createElement("div");s.id="kai-header";const c=document.createElement("div");c.id="kai-header-avatar";const f=document.createElement("div");if(f.id="kai-header-icon",t){const n=document.createElement("img");n.src=t,n.alt=o,f.appendChild(n)}else f.innerHTML=le;c.appendChild(f);const m=document.createElement("div");m.id="kai-accent-dot",c.appendChild(m);const h=document.createElement("div");h.id="kai-header-text";const L=document.createElement("div");L.id="kai-header-title",L.textContent=o;const K=document.createElement("div");K.id="kai-header-subtitle",K.textContent=e,h.appendChild(L),h.appendChild(K);const S=document.createElement("button");S.id="kai-close",S.innerHTML=xe,S.setAttribute("aria-label","Close chat"),S.addEventListener("click",de),s.appendChild(c),s.appendChild(h),s.appendChild(S),d=document.createElement("div"),d.id="kai-messages";const Q=document.createElement("div");Q.id="kai-empty";const Ee=ae.trim()||`Ask me anything about ${o}!`;Q.innerHTML=`${le}<p>${Ee}</p>`,d.appendChild(Q),g=document.createElement("div"),g.id="kai-typing",g.innerHTML='<div class="kai-dot"></div><div class="kai-dot"></div><div class="kai-dot"></div>',d.appendChild(g);const A=document.createElement("div");A.id="kai-input-row",a=document.createElement("textarea"),a.id="kai-input",a.placeholder="Type a message…",a.rows=1,a.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),pe())}),a.addEventListener("input",()=>{a.style.height="auto",a.style.height=Math.min(a.scrollHeight,100)+"px"});const X=document.createElement("div");X.id="kai-input-actions";const T=document.createElement("button");T.id="kai-send",T.innerHTML=ye,T.setAttribute("aria-label","Send message"),T.addEventListener("click",pe),X.appendChild(T),A.appendChild(a),A.appendChild(X);const ee=document.createElement("div");ee.id="kai-footer",ee.innerHTML='Powered by <a href="https://bentevi.tech" target="_blank" rel="noopener noreferrer" id="kai-footer-link">Bentevi</a>',u.appendChild(s),u.appendChild(d),u.appendChild(A),u.appendChild(ee);const U=document.createElement("div");U.id="kai-bubble-wrap",U.appendChild(l),p=document.createElement("div"),p.id="kai-anim-badge",p.innerHTML=we,p.classList.toggle("visible",W),U.appendChild(p),r.appendChild(U),r.appendChild(u),C.appendChild(r),document.body.appendChild(E)}function de(){M=!M,u.classList.toggle("open",M),!M&&W?(p.classList.remove("visible"),p.offsetWidth,p.classList.add("visible")):p.classList.remove("visible"),M?(q=l.innerHTML,l.innerHTML=ve,window.innerWidth<=640&&Object.assign(E.style,{top:"0",left:"0",right:"0",bottom:"0"}),setTimeout(()=>a.focus(),150)):(l.innerHTML=q,window.innerWidth<=640&&Object.assign(E.style,{top:"",left:"",right:""}))}function ce(){const i=C.getElementById("kai-empty");k.length>0&&i&&i.remove(),d.querySelectorAll(".kai-msg-group, .kai-msg").forEach(o=>o.remove()),k.forEach(o=>{if(o.role==="assistant"){const e=document.createElement("div");e.className="kai-msg-group";const t=document.createElement("div");t.className="kai-msg assistant",t.textContent=o.text,e.appendChild(t);const s=document.createElement("span");s.className="kai-attribution",s.textContent=`${Y.trim()||x} · AI · just now`,e.appendChild(s),d.insertBefore(e,g)}else{const e=document.createElement("div");e.className="kai-msg user",e.textContent=o.text,d.insertBefore(e,g)}}),J(I),d.scrollTop=d.scrollHeight}function J(i){I=i,g.classList.toggle("visible",i),i&&(d.scrollTop=d.scrollHeight)}async function pe(){var o,e,t;const i=a.value.trim();if(!i||I)return;k.push({role:"user",text:i}),a.value="",a.style.height="auto",ce(),J(!0);const r=C.getElementById("kai-send");r&&(r.disabled=!0);try{const s=await fetch(`${ie}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:G,message:i})}),c=await s.json();if(s.ok)k.push({role:"assistant",text:((t=c.data)==null?void 0:t.answer)??"(no response)"});else{const f=(c==null?void 0:c.code)??"error",m={blocked:"Sorry, that message contains blocked content.",rate_limited:"You're sending messages too fast. Please wait a moment.",cap_exceeded:"Monthly usage limit reached.",no_api_key:"This assistant is not configured yet."},L=((o={blocked:v.blocked,rate_limited:v.rateLimited,cap_exceeded:v.capExceeded,error:v.apiError}[f])==null?void 0:o.trim())||m[f]||((e=v.default)==null?void 0:e.trim())||"Something went wrong. Please try again.";k.push({role:"assistant",text:L})}}catch{k.push({role:"assistant",text:"Could not reach the server. Please try again."})}finally{J(!1),r&&(r.disabled=!1),ce(),a.focus()}}async function he(){try{const i=await fetch(`${ie}/api/widget-config/${G}`);if(i.ok){const{data:r}=await i.json();x=r.projectName??x;const o=r.theme??{},e=o.bubble??{},t=o.chatWindow??{},s=o.global??{},c=o.advanced??{};if(B=e.backgroundColor??B,O=t.headerColor??O,z=t.userMessageColor??z,$=t.aiMessageColor??$,y=e.iconUrl??null,F=c.customCss??"",w=s.fontFamily??"system",N=t.colorScheme??"auto",V=e.shape??"circle",oe=e.label??"AI-mode",P=e.backgroundType??"solid",j=e.gradientFrom??j,_=e.gradientTo??_,D=t.headerLogoUrl??null,Y=t.headerTitle??"",ne=t.headerSubtitle??"",R=t.darkHeaderColor??R,Z=t.darkUserMessageColor??Z,H=t.darkAiMessageColor??H,ae=t.welcomeText??"",W=e.showAnimation===!0,v=r.errorMessages??{},w!=="system"){const m={inter:"Inter:wght@400;500;600",roboto:"Roboto:wght@400;500;700","open-sans":"Open+Sans:wght@400;500;600",nunito:"Nunito:wght@400;500;600"}[w];if(m){const h=document.createElement("link");h.rel="stylesheet",h.href=`https://fonts.googleapis.com/css2?family=${m}&display=swap`,document.head.appendChild(h)}}}}catch{}Ce()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",he):he()})()})();
