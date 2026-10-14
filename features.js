// AIndex features: Stack Builder, Alternatives, Similar Tools, Admin. Load after extras.js.
(()=>{
const SB_URL="",SB_KEY="";// Supabase Project URL + anon key (optional; enables admin, reviews, analytics, DB tools/news)
const ok=!!(SB_URL&&SB_KEY),BT=document.title,sl=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),idx=n=>T.findIndex(t=>t[0]==n);
let jwt=sessionStorage.getItem("aj")||"",tab="tools",ROWS=[];
const api=async(p,m="GET",b,pf="return=minimal")=>{const r=await fetch(SB_URL+p,{method:m,headers:{apikey:SB_KEY,Authorization:"Bearer "+(jwt||SB_KEY),"Content-Type":"application/json",Prefer:pf},body:b?JSON.stringify(b):undefined});if(!r.ok)throw new Error((await r.text()).slice(0,200));const x=await r.text();return x?JSON.parse(x):null};
const q=(t,s)=>api("/rest/v1/"+t+s),log=(type,tool)=>ok&&api("/rest/v1/events","POST",{type,tool}).catch(()=>{});
const TS="?select=name,category,description,url,quality,ease,value,features";
const pg=(h,b)=>`<div class="pg"><h2>${h}</h2>${b}</div>`,em=s=>`<em style="font-style:normal;color:var(--acc)">${s}</em>`;

/* ---------- Similar tools (TF-IDF now; pgvector via similar_tools RPC when embeddings exist) ---------- */
const tok=s=>s.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);let VC=null;
function vecs(){if(VC&&VC.n==T.length)return VC;const df={},docs=T.map(t=>{const c={};tok(t[1]+" "+t[1]+" "+t[2]).forEach(x=>c[x]=(c[x]||0)+1);Object.keys(c).forEach(x=>df[x]=(df[x]||0)+1);return c});
VC={n:T.length,d:docs.map(c=>{const v={};let s=0;for(const x in c){v[x]=c[x]*Math.log(T.length/df[x]+1);s+=v[x]**2}s=Math.sqrt(s)||1;for(const x in v)v[x]/=s;return v})};return VC}
const sim=(i,k=4)=>{const V=vecs().d,a=V[i];return V.map((b,j)=>{let s=0;for(const x in a)if(b[x])s+=a[x]*b[x];return[j,s+(T[j][1]==T[i][1]?.15:0)+avg(T[j])/200]}).filter(([j])=>j!=i).sort((u,w)=>w[1]-u[1]).slice(0,k).map(x=>x[0])};
const simDb=n=>api("/rest/v1/rpc/similar_tools","POST",{tool_name:n,k:4},"return=representation").then(r=>r.map(x=>idx(x.name)).filter(j=>j>=0)).catch(()=>[]);
const os=show;show=function(i,keep){os.apply(this,arguments);const t=T[i],mc=$("mc"),b=document.createElement("div");log("view_tool",t[0]);
b.innerHTML=`<h4>Similar tools</h4><div class="alt" id="sm"></div>`+(ok?`<h4>Reviews</h4><div id="rv"></div><div class="f" style="margin-top:10px"><select class="sel" id="rr"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select><input class="sel" id="rb" maxlength="500" placeholder="Your review" style="flex:1"><button class="chip" id="rs">Submit</button></div>`:"");
mc.insertBefore(b,mc.lastElementChild);
const set=l=>b.querySelector("#sm").innerHTML=l.map(j=>`<button class="chip" data-a="${j}">${esc(T[j][0])}</button>`).join("")+`<a class="chip" href="#/alt/${sl(t[0])}" onclick="hide()">All alternatives →</a>`;
set(sim(i));if(!ok)return;simDb(t[0]).then(l=>l.length&&set(l));
const rv=b.querySelector("#rv");q("reviews",`?tool=eq.${encodeURIComponent(t[0])}&status=eq.approved&select=rating,body&order=created_at.desc&limit=3`).then(r=>rv.innerHTML=r.map(x=>`<p>${"★".repeat(x.rating)} ${esc(x.body||"")}</p>`).join("")||"<p>No reviews yet.</p>").catch(()=>{});
b.querySelector("#rs").onclick=async()=>{try{await api("/rest/v1/reviews","POST",{tool:t[0],rating:+b.querySelector("#rr").value,body:b.querySelector("#rb").value.trim()});rv.insertAdjacentHTML("beforeend","<p>Thanks! Your review appears after moderation.</p>");b.querySelector("#rb").value=""}catch(e){rv.insertAdjacentHTML("beforeend","<p>Could not submit.</p>")}}};

/* ---------- Views + routing ---------- */
const VW=["home","rankings","briefing","categories","arena","stack","alt","admin"],mk=id=>{const d=document.createElement("div");d.id="v-"+id;d.hidden=true;$("v-briefing").after(d);return d};
const vS=mk("stack"),vA=mk("alt"),vD=mk("admin");
const nl=document.createElement("a");nl.className="l";nl.dataset.r="stack";nl.href="#/stack";nl.textContent="Stack Builder";document.querySelector('nav a[data-r="briefing"]').before(nl);
function rt(){const h=location.hash;if(h=="#/join")return;const m=h.match(/^#\/(stack|alt|admin)(?:\/(.*))?$/);
if(!m){[vS,vA,vD].forEach(e=>e.hidden=true);document.title=BT;return}
VW.forEach(x=>{const e=$("v-"+x);if(e)e.hidden=x!=m[1]});document.querySelectorAll("nav a[data-r]").forEach(l=>l.classList.toggle("on",l.dataset.r==m[1]));
document.title=BT;log("page",m[1]);({stack:stackV,alt:()=>alt(m[2]),admin})[m[1]]()}
addEventListener("hashchange",rt);

/* ---------- Alternatives to X ---------- */
function alt(s){const i=T.findIndex(t=>sl(t[0])==s);
if(i<0){vA.innerHTML=pg("Tool not found",'<a class="btn" href="#/">Back to tools</a>');return}
const t=T[i],L=T.map((x,j)=>[x,j]).filter(([x,j])=>j!=i&&x[1]==t[1]).sort((a,b)=>avg(b[0])-avg(a[0])).slice(0,8);
document.title=`Best alternatives to ${t[0]} (2026) | AIndex`;
vA.innerHTML=pg(`Alternatives to ${em(esc(t[0]))}`,`<p>${esc(t[0])}: ${esc(t[2])} Top ${esc(t[1]).toLowerCase()} alternatives, ranked by AIndex score.</p>`)+`<div class="rks">${L.map(([x,j],k)=>`<div class="rk${k<3?" t3":""}" data-o="${j}" style="grid-template-columns:40px 44px 1fr 90px"><b class="n">${k+1}</b>${ic(x)}<div><h3>${esc(x[0])}</h3><div class="mini">${esc(x[2])}</div></div><div class="sc"><b>${avg(x).toFixed(1)}</b><div><i style="width:${avg(x)*10}%"></i></div></div></div>`).join("")||"<p>No alternatives listed yet.</p>"}</div>`}
vA.onclick=e=>{const o=e.target.closest("[data-o]");if(o)show(+o.dataset.o)};

/* ---------- AI Stack Builder ---------- */
const R=[
[/youtube|video|reel|short|vlog/,[["Script & ideas","Chatbots","Claude|ChatGPT"],["Voiceover","Audio","ElevenLabs|Murf"],["Visuals & thumbnail","Image","Midjourney|Ideogram|Canva"],["Create / edit video","Video","Runway|CapCut|Kling"],["Captions & shorts","Video","Opus Clip|VEED"]]],
[/teach|lesson|worksheet|classroom|quiz|rubric/,[["Plan the lesson","Teaching","MagicSchool"],["Adapt the text","Teaching","Diffit"],["Interactive slides","Teaching","Curipod|Gamma"],["Quiz the class","Teaching","Kahoot"]]],
[/exam|study|revis|student|learn|notes|cbse|class/,[["Ask & understand","Chatbots","Claude|Gemini"],["Notes into Q&A","Study","NotebookLM"],["Solve problems","Study","Wolfram Alpha|Photomath"],["Practise","Study","Quizlet"]]],
[/website|app|landing|saas|portfolio|site/,[["Plan & write copy","Chatbots","Claude|ChatGPT"],["Design the UI","Design","Figma|Uizard"],["Generate the app","App Builders","Lovable|Bolt|v0"],["Refine the code","Coding","Cursor|GitHub Copilot"]]],
[/blog|essay|article|writ|content|seo/,[["Research","Research","Perplexity"],["Draft","Chatbots","Claude|ChatGPT"],["Polish","Writing","Grammarly|QuillBot"],["Optimise for SEO","Marketing","Surfer SEO"]]],
[/research|paper|thesis|literature/,[["Find papers","Research","Elicit|Semantic Scholar"],["Check claims","Research","Consensus|Scite"],["Summarise sources","Study","NotebookLM"],["Write up","Writing","Grammarly"]]],
[/podcast|music|song|audio|voice/,[["Script","Chatbots","Claude|ChatGPT"],["Voice or music","Audio","ElevenLabs|Suno"],["Edit","Audio","Descript"],["Clean the sound","Audio","Krisp"]]],
[/slide|presentation|deck|pitch/,[["Outline","Chatbots","Claude|ChatGPT"],["Build the deck","Productivity","Gamma|Beautiful.ai"],["Visuals","Image","Canva|Midjourney"]]]];
const pick=(c,n)=>{for(const x of(n||"").split("|")){const i=idx(x);if(i>=0)return i}const l=T.map((t,i)=>i).filter(i=>T[i][1]==c).sort((a,b)=>avg(T[b])-avg(T[a]));return l.length?l[0]:-1};
function fb(g){const L=local(g),cs=[];L.forEach(([i])=>{if(!cs.includes(T[i][1])&&cs.length<4)cs.push(T[i][1])});return cs.map(c=>["Best "+c+" tool",c,T[L.find(([i])=>T[i][1]==c)[0]][0]])}
function build(g){g=g.trim();if(g.length<3)return;const m=R.find(r=>r[0].test(g.toLowerCase())),S=(m?m[1]:fb(g)).map(([l,c,n])=>[l,pick(c,n)]).filter(s=>s[1]>=0);
$("sr").innerHTML=S.length?`<p class="mini mono">${S.length}-step stack for “${esc(g)}”</p>`+S.map(([l,i],k)=>{const t=T[i];return `<div class="rk${k<3?" t3":""}" data-o="${i}" style="grid-template-columns:40px 44px 1fr 90px"><b class="n">${k+1}</b>${ic(t)}<div><h3>${esc(t[0])} <span class="tag mono">${esc(l)}</span></h3><div class="mini">${esc(t[2])}</div></div><a class="v" href="${t[3]}" target="_blank" rel="noopener">Visit →</a></div>`}).join(""):'<div class="empty">Try describing your goal differently.</div>';log("stack")}
function stackV(){if($("sg"))return;vS.innerHTML=pg(`AI ${em("Stack Builder")}`,`<p>Describe a goal and get a step-by-step chain of tools.</p><div class="f"><input class="sel" id="sg" placeholder="e.g. make YouTube videos" style="flex:1;min-width:220px"><button class="btn" id="sgo">Build my stack</button></div><div class="chips" style="margin:14px 0">${["make YouTube videos","build a website","prepare for class 12 exams","write a research paper","create lesson worksheets"].map(x=>`<button class="chip" data-g="${x}">${x}</button>`).join("")}</div><div class="rks" id="sr"></div>`);
$("sg").onkeydown=e=>{if(e.key=="Enter")build($("sg").value)}}
vS.onclick=e=>{const o=e.target.closest("[data-o]"),g=e.target.dataset.g;if(g){$("sg").value=g;build(g)}else if(e.target.id=="sgo")build($("sg").value);else if(o&&!e.target.closest("a"))show(+o.dataset.o)};

/* ---------- Admin dashboard (Supabase Auth + RLS) ---------- */
const F={tools:["name","category","description","url","quality","ease","value","features"],news:["date","title","summary","link","tag"]},TB=["tools","news","reviews","analytics"];
async function admin(){
if(!ok){vD.innerHTML=pg("Admin","<p>Add SB_URL and SB_KEY at the top of features.js and run supabase.sql first.</p>");return}
if(!jwt){vD.innerHTML=pg("Admin login",`<div class="f"><input class="sel" type="email" id="ae" placeholder="admin email"><input class="sel" type="password" id="ap" placeholder="password"><button class="btn" id="al">Log in</button></div>`);return}
let body="";
try{
if(tab=="analytics"){const r=await q("events","?select=type,tool,created_at&order=created_at.desc&limit=5000"),c={},tl={};r.forEach(x=>{c[x.type]=(c[x.type]||0)+1;if(x.tool&&x.type=="view_tool")tl[x.tool]=(tl[x.tool]||0)+1});
const top=Object.entries(tl).sort((a,b)=>b[1]-a[1]).slice(0,10),mx=top.length?top[0][1]:1;
body=`<p class="mono">${r.length} events · ${r.filter(x=>Date.now()-new Date(x.created_at)<6048e5).length} in last 7 days · ${Object.entries(c).map(([k,v])=>k+" "+v).join(" · ")}</p><h4 class="mono" style="color:var(--acc)">TOP VIEWED TOOLS</h4>`+top.map(([n,v])=>`<div class="br" style="grid-template-columns:160px 1fr 40px"><span>${esc(n)}</span><div><i style="width:${v/mx*100}%"></i></div><b>${v}</b></div>`).join("")}
else{ROWS=await q(tab,tab=="tools"?TS+"&order=name&limit=500":tab=="news"?"?select=*&order=date.desc&limit=200":"?select=*&order=created_at.desc&limit=200");
if(tab=="tools")merge(ROWS);
const form=F[tab]?`<div class="ctl">${F[tab].map(k=>`<div><label>${k}</label><input class="sel" style="width:100%" id="f-${k}"${k=="date"?` placeholder="YYYY-MM-DD"`:""}></div>`).join("")}</div><button class="btn" id="sv">Save</button><div style="height:16px"></div>`:"";
body=form+ROWS.map(r=>tab=="tools"?`<div class="row"><span class="mono">${esc(r.category)}</span><div style="flex:1"><b>${esc(r.name)}</b></div><button class="chip" data-ed="${esc(r.name)}">Edit</button><button class="chip" data-del="${esc(r.name)}">Delete</button></div>`
:tab=="news"?`<div class="row"><span class="mono">${esc(r.date)}</span><div style="flex:1"><b>${esc(r.title)}</b></div><button class="chip" data-del="${r.id}">Delete</button></div>`
:`<div class="row"><span class="mono">${esc(r.status)}</span><div style="flex:1"><b>${esc(r.tool)}</b> ${"★".repeat(r.rating||0)}<p>${esc(r.body||"")}</p></div><button class="chip" data-st="approved" data-id="${r.id}">Approve</button><button class="chip" data-st="rejected" data-id="${r.id}">Reject</button><button class="chip" data-del="${r.id}">Delete</button></div>`).join("")}
}catch(e){body=`<p>Error: ${esc(e.message)} (are you listed in the admins table?)</p>`}
vD.innerHTML=pg("Admin dashboard",`<div class="chips" style="margin-bottom:16px">${TB.map(x=>`<button class="chip${x==tab?" on":""}" data-t="${x}">${x}</button>`).join("")}<button class="chip" id="lo">Log out</button></div>`)+`<div class="wrap2" style="padding-bottom:48px">${body}</div>`}
vD.onclick=async e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
try{
if(b.id=="al"){const r=await fetch(SB_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:$("ae").value,password:$("ap").value})}).then(r=>r.json());if(!r.access_token)throw new Error(r.error_description||r.msg||"Login failed");jwt=r.access_token;sessionStorage.setItem("aj",jwt)}
else if(b.id=="lo"){jwt="";sessionStorage.removeItem("aj")}
else if(d.t)tab=d.t;
else if(b.id=="sv"){const o={};F[tab].forEach(k=>{const v=vD.querySelector("#f-"+k).value.trim();if(v!=="")o[k]=/^(quality|ease|value|features)$/.test(k)?+v:v});await api("/rest/v1/"+tab,"POST",o,"resolution=merge-duplicates,return=minimal")}
else if(d.del)await api(`/rest/v1/${tab}?${tab=="tools"?"name":"id"}=eq.${encodeURIComponent(d.del)}`,"DELETE");
else if(d.st)await api(`/rest/v1/reviews?id=eq.${d.id}`,"PATCH",{status:d.st});
else if(d.ed){const r=ROWS.find(x=>x.name==d.ed);F.tools.forEach(k=>vD.querySelector("#f-"+k).value=r[k]??"");return}
}catch(x){alert(x.message);return}
admin()};

/* ---------- Live data from Supabase (overrides/extends built-in tools + news) ---------- */
function merge(r){r.forEach(x=>{const t=[x.name,x.category,x.description||"",x.url,+x.quality,+x.ease,+x.value,+x.features],i=idx(x.name);i<0?T.push(t):T[i]=t});$("n").textContent=T.length;draw();rank()}
if(ok){q("tools",TS+"&limit=500").then(merge).catch(()=>{});
loadBrief().then(()=>q("news","?select=*&order=date.desc&limit=50")).then(d=>{if(d.length)$("bf").innerHTML=d.map(p=>`<div class="row"><span class="mono">${new Date(p.date).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}</span><div><b>${/^https?:\/\//.test(p.link||"")?`<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)}</a>`:esc(p.title)}</b>${p.tag?` <span class="tag mono">${esc(p.tag)}</span>`:""}<p>${esc(p.summary||"")}</p></div></div>`).join("")}).catch(()=>{})}
rt();
})();
