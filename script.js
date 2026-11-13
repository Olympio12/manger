(() => {
"use strict";
const KEY = "repas_familiaux_v1";
const DEFAULT_DISHES = ["Pâte blanche","Pâte noire","Pâte rouge","Riz blanc","Riz au gras","Riz créole","Spaghettis rouge","Spaghetti blanc","Coquillettes","Salade","Igname pilé","Igname frite","Haricot","Attiéké","Akassa"];
const DEFAULT_SIDES = ["Sauce légumes 1","Sauce légumes 2","Sauce légumes 3","Sauce crincrin","Sauce févi","Sauce tomate","Friture","Sauce assroukin","Jus d'oignon tomate","Jus d'œufs"];
const $ = id => document.getElementById(id);
const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = new Date();
let state = load();
let todayProposals = {lunch:null,dinner:null};
let planDraft = [];
let editTarget = null;

function fresh(){return {dishes:DEFAULT_DISHES.map((name,i)=>({id:"d"+i,name})),sides:DEFAULT_SIDES.map((name,i)=>({id:"s"+i,name})),compat:{},history:{},plans:[]};}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&x.dishes&&x.sides?x:fresh();}catch{return fresh();}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll();}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function comboKey(d,s){return d+"::"+s;}
function labelMeal(m){if(!m)return "Non renseigné";const d=state.dishes.find(x=>x.id===m.dish),s=state.sides.find(x=>x.id===m.side);return d&&s?`${d.name} — ${s.name}`:"Élément du catalogue indisponible";}
function allCombos(){const out=[];state.dishes.forEach(d=>(state.compat[d.id]||[]).forEach(sid=>{if(state.sides.some(s=>s.id===sid))out.push({dish:d.id,side:sid});}));return out;}
function mealSelect(id,selected){return `<select id="${id}"><option value="">— Choisir —</option>${state.dishes.map(d=>`<option value="${d.id}" ${selected===d.id?"selected":""}>${esc(d.name)}</option>`).join("")}</select>`;}
function sideSelect(id,selected){return `<select id="${id}"><option value="">— Choisir —</option>${state.sides.map(s=>`<option value="${s.id}" ${selected===s.id?"selected":""}>${esc(s.name)}</option>`).join("")}</select>`;}
function historyMeal(day,slot){return state.history[day]?.[slot]||null;}
function nav(view){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.go)));

function renderDashboard(){
 $("today-date").textContent=today.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
 $("dish-count").textContent=state.dishes.length;$("side-count").textContent=state.sides.length;$("combo-count").textContent=allCombos().length;
 const meals=state.history[dateKey(today)];
 $("dashboard-meals").innerHTML=meals?`<div class="mini-meal"><b>Déjeuner</b>${esc(labelMeal(meals.lunch))}</div><div class="mini-meal"><b>Dîner</b>${esc(labelMeal(meals.dinner))}</div>`:"";
 $("dashboard-empty").classList.toggle("hidden",!!meals);
}
function renderLists(){
 [["dish","dishes"],["side","sides"]].forEach(([kind,key])=>{
  const list=$(kind+"-list");list.innerHTML="";
  state[key].forEach(item=>{const li=document.createElement("li");li.innerHTML=`<span>${esc(item.name)}</span><span class="list-actions"><button class="secondary small-button" data-edit="${kind}:${item.id}">Renommer</button><button class="danger small-button" data-delete="${kind}:${item.id}">Supprimer</button></span>`;list.append(li);});
 });
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>renameItem(...b.dataset.edit.split(":")));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteItem(...b.dataset.delete.split(":")));
}
function renameItem(kind,id){const arr=kind==="dish"?state.dishes:state.sides,item=arr.find(x=>x.id===id);if(!item)return;const name=prompt("Nouveau nom :",item.name);if(name&&name.trim()){item.name=name.trim();save();}}
function deleteItem(kind,id){
 const arr=kind==="dish"?state.dishes:state.sides,item=arr.find(x=>x.id===id);if(!item||!confirm(`Supprimer « ${item.name} » ?`))return;
 if(kind==="dish"){delete state.compat[id];Object.keys(state.history).forEach(k=>["lunch","dinner"].forEach(slot=>{if(state.history[k][slot]?.dish===id)state.history[k][slot]=null;}));}
 else {Object.keys(state.compat).forEach(k=>state.compat[k]=state.compat[k].filter(x=>x!==id));Object.keys(state.history).forEach(k=>["lunch","dinner"].forEach(slot=>{if(state.history[k][slot]?.side===id)state.history[k][slot]=null;}));}
 save();
}
$("dish-form").onsubmit=e=>{e.preventDefault();const n=$("dish-name").value.trim();if(n&&!state.dishes.some(x=>x.name.toLowerCase()===n.toLowerCase()))state.dishes.push({id:"d"+Date.now(),name:n});$("dish-name").value="";save();};
$("side-form").onsubmit=e=>{e.preventDefault();const n=$("side-name").value.trim();if(n&&!state.sides.some(x=>x.name.toLowerCase()===n.toLowerCase()))state.sides.push({id:"s"+Date.now(),name:n});$("side-name").value="";save();};

function renderCompatibility(){
 const root=$("compatibility-editor");root.innerHTML="";
 if(!state.dishes.length||!state.sides.length){root.textContent="Ajoutez des plats et des accompagnements pour définir les compatibilités.";return;}
 state.dishes.forEach(d=>{const row=document.createElement("div");row.className="compat-row";row.innerHTML=`<h4>${esc(d.name)}</h4><div class="check-grid">${state.sides.map(s=>`<label><input type="checkbox" data-dish="${d.id}" value="${s.id}" ${(state.compat[d.id]||[]).includes(s.id)?"checked":""}>${esc(s.name)}</label>`).join("")}</div>`;root.append(row);});
}
$("save-compat").onclick=()=>{state.compat={};document.querySelectorAll("#compatibility-editor input:checked").forEach(c=>{(state.compat[c.dataset.dish]??=[]).push(c.value);});save();$("planning-message").textContent="Compatibilités enregistrées.";};

function previousDays(count){const out=[];for(let i=1;i<=count;i++){const d=new Date(today);d.setDate(d.getDate()-i);out.push(d);}return out;}
function getRecentEntries(){
 return previousDays(3).map(d=>{const key=dateKey(d),h=state.history[key]||{};return {date:d,key,label:d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}),lunch:h.lunch||null,dinner:h.dinner||null};});
}
function renderRecent(){
 const root=$("recent-meals");root.innerHTML="";
 getRecentEntries().forEach((entry,index)=>{
  const card=document.createElement("div");card.className="recent-day";
  card.innerHTML=`<h4>${esc(entry.label)}</h4>${["lunch","dinner"].map(slot=>`<div class="recent-meal"><label>${slot==="lunch"?"Déjeuner":"Dîner"}</label><select id="recent-${index}-${slot}-dish"><option value="">Plat non renseigné</option>${state.dishes.map(d=>`<option value="${d.id}" ${entry[slot]?.dish===d.id?"selected":""}>${esc(d.name)}</option>`).join("")}</select><select id="recent-${index}-${slot}-side"><option value="">Accompagnement non renseigné</option>${state.sides.map(s=>`<option value="${s.id}" ${entry[slot]?.side===s.id?"selected":""}>${esc(s.name)}</option>`).join("")}</select></div>`).join("")}`;
  root.append(card);
 });
}
function collectRecent(){
 const entries=[];
 getRecentEntries().forEach((e,i)=>["lunch","dinner"].forEach(slot=>{
  const dish=$(`recent-${i}-${slot}-dish`).value,side=$(`recent-${i}-${slot}-side`).value;
  if(dish&&side)entries.push({dish,side});
 }));
 return entries;
}
function pickCombo(excluded,usedDishes,strictDish=true){
 let choices=allCombos().filter(c=>!excluded.has(comboKey(c.dish,c.side))&&(!strictDish||!usedDishes.has(c.dish)));
 if(!choices.length&&strictDish)choices=allCombos().filter(c=>!excluded.has(comboKey(c.dish,c.side)));
 if(!choices.length)return null;
 return choices[Math.floor(Math.random()*choices.length)];
}
function renderProposal(slot){
 const m=todayProposals[slot],root=$(slot+"-proposal");
 root.innerHTML=m?`<p class="proposal-line"><span>Plat principal</span><strong>${esc(state.dishes.find(x=>x.id===m.dish)?.name||"Plat supprimé")}</strong></p><p class="proposal-line"><span>Accompagnement</span><strong>${esc(state.sides.find(x=>x.id===m.side)?.name||"Accompagnement supprimé")}</strong></p>`:"";
}
function generateToday(slotToRenew=null){
 const recent=collectRecent(),excluded=new Set(recent.map(m=>comboKey(m.dish,m.side))),used=new Set(recent.map(m=>m.dish));
 let lunch=slotToRenew==="dinner"?todayProposals.lunch:pickCombo(excluded,used,true);
 let dinner=slotToRenew==="lunch"?todayProposals.dinner:pickCombo(excluded,used,true);
 if(slotToRenew==="lunch")lunch=pickCombo(new Set([...excluded,...(dinner?[comboKey(dinner.dish,dinner.side)]:[])]),new Set([...used,...(dinner?[dinner.dish]:[])]),true);
 if(slotToRenew==="dinner")dinner=pickCombo(new Set([...excluded,...(lunch?[comboKey(lunch.dish,lunch.side)]:[])]),new Set([...used,...(lunch?[lunch.dish]:[])]),true);
 if(!slotToRenew){
  if(lunch&&dinner&&comboKey(lunch.dish,lunch.side)===comboKey(dinner.dish,dinner.side))dinner=pickCombo(new Set([...excluded,comboKey(lunch.dish,lunch.side)]),new Set([...used,lunch.dish]),true);
 }
 todayProposals={lunch,dinner};
 $("today-result").classList.remove("hidden");renderProposal("lunch");renderProposal("dinner");
 const msg=[];
 if(!allCombos().length)msg.push("Aucune combinaison disponible : définissez d’abord les compatibilités.");
 else if(!lunch||!dinner)msg.push("Le catalogue ne contient pas assez de combinaisons distinctes pour proposer les deux repas.");
 else msg.push("Deux propositions ont été générées à partir des six repas précédents.");
 $("today-message").textContent=msg.join(" ");
}
$("generate-today").onclick=()=>generateToday();
$("renew-lunch").onclick=()=>generateToday("lunch");
$("renew-dinner").onclick=()=>generateToday("dinner");
document.querySelectorAll(".edit-meal").forEach(b=>b.onclick=()=>openEdit(b.dataset.meal));
function openEdit(slot){
 if(!todayProposals[slot])return;
 editTarget=slot;$("edit-title").textContent=slot==="lunch"?"Modifier le déjeuner":"Modifier le dîner";
 $("edit-dish").innerHTML=state.dishes.map(d=>`<option value="${d.id}" ${todayProposals[slot].dish===d.id?"selected":""}>${esc(d.name)}</option>`).join("");
 updateEditSides(todayProposals[slot].side);$("edit-dish").onchange=()=>updateEditSides("");$("edit-dialog").showModal();
}
function updateEditSides(selected){const d=$("edit-dish").value,allowed=state.compat[d]||[];$("edit-side").innerHTML=state.sides.filter(s=>allowed.includes(s.id)).map(s=>`<option value="${s.id}" ${selected===s.id?"selected":""}>${esc(s.name)}</option>`).join("");}
$("apply-edit").onclick=e=>{e.preventDefault();const dish=$("edit-dish").value,side=$("edit-side").value;if(!dish||!side){alert("Aucun accompagnement compatible n’est défini pour ce plat.");return;}todayProposals[editTarget]={dish,side};$("edit-dialog").close();renderProposal(editTarget);};
$("validate-today").onclick=()=>{
 if(!todayProposals.lunch||!todayProposals.dinner){alert("Les deux repas doivent être proposés avant validation.");return;}
 if(comboKey(todayProposals.lunch.dish,todayProposals.lunch.side)===comboKey(todayProposals.dinner.dish,todayProposals.dinner.side)){alert("Le déjeuner et le dîner doivent être différents.");return;}
 state.history[dateKey(today)]={lunch:todayProposals.lunch,dinner:todayProposals.dinner};save();alert("Les repas du jour ont été enregistrés dans l’historique.");
};

function generatePlan(){
 const combos=allCombos();if(!combos.length){$("planning-message").textContent="Aucune combinaison possible. Renseignez d’abord les compatibilités.";return;}
 const recent=getRecentEntries().flatMap(e=>[e.lunch,e.dinner].filter(Boolean));
 let usedCombos=new Set(recent.map(m=>comboKey(m.dish,m.side))),usedByWeek=[new Set(recent.map(m=>m.dish)),new Set()];
 planDraft=[];
 for(let day=0;day<14;day++){
  const week=day<7?0:1;
  const picks=[];
  for(let slot=0;slot<2;slot++){
   let pool=combos.filter(c=>!usedCombos.has(comboKey(c.dish,c.side))&&!usedByWeek[week].has(c.dish)&&!picks.some(p=>p.dish===c.dish));
   if(!pool.length)pool=combos.filter(c=>!usedCombos.has(comboKey(c.dish,c.side))&&!picks.some(p=>p.dish===c.dish));
   if(!pool.length)pool=combos.filter(c=>!picks.some(p=>p.dish===c.dish));
   if(!pool.length)pool=combos.filter(c=>!picks.some(p=>comboKey(p.dish,p.side)===comboKey(c.dish,c.side)));
   const pick=pool[Math.floor(Math.random()*pool.length)]||null;
   picks.push(pick);if(pick){usedCombos.add(comboKey(pick.dish,pick.side));usedByWeek[week].add(pick.dish);}
  }
  planDraft.push({date:new Date(today.getFullYear(),today.getMonth(),today.getDate()+day),lunch:picks[0],dinner:picks[1]});
 }
 renderPlan();
}
function renderPlan(){
 const root=$("planning-result");root.innerHTML="";
 planDraft.forEach((day,i)=>{const card=document.createElement("article");card.className="day-card";card.innerHTML=`<h4>${day.date.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</h4><div class="day-meal"><b>Déjeuner</b><br>${esc(labelMeal(day.lunch))}</div><div class="day-meal"><b>Dîner</b><br>${esc(labelMeal(day.dinner))}</div>`;root.append(card);});
 $("planning-actions").classList.toggle("hidden",!planDraft.length);
 const incomplete=planDraft.some(d=>!d.lunch||!d.dinner);$("planning-message").textContent=incomplete?"Attention : le catalogue ne permet pas de remplir tous les repas avec des combinaisons distinctes. Certaines répétitions peuvent être nécessaires.":"Planning généré. Vérifiez les propositions avant de les enregistrer.";
}
$("generate-plan").onclick=generatePlan;
$("save-plan").onclick=()=>{
 if(!planDraft.length)return;
 planDraft.forEach(d=>{const k=dateKey(d.date);state.history[k]={lunch:d.lunch,dinner:d.dinner};});
 state.plans.push({createdAt:new Date().toISOString(),days:planDraft.map(d=>({date:dateKey(d.date),lunch:d.lunch,dinner:d.dinner}))});
 save();alert("Le planning a été enregistré dans l’historique.");
};
$("print-plan").onclick=()=>window.print();

$("export-data").onclick=()=>{
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="sauvegarde-repas.json";a.click();URL.revokeObjectURL(url);
};
$("import-data").onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{const imported=JSON.parse(await file.text());if(!imported.dishes||!imported.sides||!imported.compat||!imported.history)throw new Error();state=imported;save();alert("Sauvegarde importée.");}catch{alert("Fichier de sauvegarde invalide.");}e.target.value="";
};
$("reset-data").onclick=()=>{if(confirm("Cette action supprimera le catalogue, les compatibilités et l’historique sur cet appareil. Continuer ?")){state=fresh();todayProposals={lunch:null,dinner:null};planDraft=[];save();renderRecent();$("today-result").classList.add("hidden");$("planning-result").innerHTML="";$("planning-actions").classList.add("hidden");}};
function renderAll(){renderDashboard();renderLists();renderCompatibility();renderRecent();}
renderAll();
})();