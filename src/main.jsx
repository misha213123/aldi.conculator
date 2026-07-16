import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CalendarDays, ChevronLeft, ChevronRight, History, LayoutDashboard, Minus, Plus, Save, Settings, Trash2, WalletCards} from 'lucide-react';
import './styles.css';

const departments = [
  {id:'dry-alcohol', name:'Сухой — Алкашка', icon:'📦'},
  {id:'dry-cans', name:'Сухой — Банки', icon:'🥫'},
  {id:'dry-chemistry', name:'Сухой — Химия', icon:'🧴'},
  {id:'vegetables', name:'Отдел Важива', icon:'🥬'},
  {id:'meat', name:'Отдел Мясо', icon:'🥩'},
  {id:'frozen', name:'Отдел Морожня', icon:'❄️'},
  {id:'yogurts', name:'Отдел Йогурты', icon:'🥛'},
  {id:'salads', name:'Отдел Салатки', icon:'🥗'},
  {id:'aktuell', name:'Отдел Актуель', icon:'🏷️'}
];
const pad=n=>String(n).padStart(2,'0');
const dateKey=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const monthKey=d=>dateKey(d).slice(0,7);
const money=n=>`${Number(n||0).toFixed(2)} zł`;
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};

function App(){
 const [selectedDate,setSelectedDate]=useState(new Date());
 const [rates,setRates]=useState(()=>read('aldi-rates', Object.fromEntries(departments.map(d=>[d.id,0]))));
 const [entries,setEntries]=useState(()=>read('aldi-entries',{}));
 const [draft,setDraft]=useState(()=>Object.fromEntries(departments.map(d=>[d.id,0])));
 const [view,setView]=useState('today');
 const key=dateKey(selectedDate), month=monthKey(selectedDate);
 const calcDay=(entry={})=>departments.reduce((s,d)=>s+(Number(entry[d.id]||0)*Number(rates[d.id]||0)),0);
 const dayTotal=calcDay(draft);
 const monthEntries=Object.entries(entries).filter(([k])=>k.startsWith(month));
 const monthTotal=monthEntries.reduce((s,[,e])=>s+calcDay(e),0);
 const weekStart=new Date(selectedDate); weekStart.setDate(selectedDate.getDate()-((selectedDate.getDay()+6)%7));
 const weekEnd=new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
 const weekTotal=Object.entries(entries).filter(([k])=>{const d=new Date(k+'T12:00:00');return d>=weekStart&&d<=weekEnd}).reduce((s,[,e])=>s+calcDay(e),0);
 const savedDays=monthEntries.sort((a,b)=>b[0].localeCompare(a[0]));
 const updateDraft=(id,val)=>setDraft(x=>({...x,[id]:Math.max(0,Number(val)||0)}));
 const saveDay=()=>{const next={...entries,[key]:draft}; setEntries(next);localStorage.setItem('aldi-entries',JSON.stringify(next));};
 const changeDate=(n)=>{const d=new Date(selectedDate);d.setDate(d.getDate()+n);setSelectedDate(d);setDraft(entries[dateKey(d)]||Object.fromEntries(departments.map(x=>[x.id,0])))};
 const setRate=(id,v)=>{const next={...rates,[id]:Number(v)||0};setRates(next);localStorage.setItem('aldi-rates',JSON.stringify(next));};
 const clearDay=()=>setDraft(Object.fromEntries(departments.map(d=>[d.id,0])));
 const chart=useMemo(()=>savedDays.slice().reverse().map(([k,e],i)=>({label:k.slice(8),value:calcDay(e),x:i})),[entries,rates,month]);
 const max=Math.max(...chart.map(x=>x.value),1);
 return <div className="app">
  <aside className="sidebar">
   <div className="brand"><span className="mark">///</span><strong>ALDI</strong></div><div className="subtitle">Калькулятор картона</div>
   <nav>{[
    ['today',LayoutDashboard,'Сегодня'],['history',History,'История'],['settings',Settings,'Настройки']
   ].map(([id,Icon,label])=><button className={view===id?'active':''} onClick={()=>setView(id)} key={id}><Icon size={19}/>{label}</button>)}</nav>
   <div className="month-box"><small>Текущий месяц</small><b>{selectedDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</b></div>
  </aside>
  <main>
   <header><div><h1>{view==='today'?'Сегодня':view==='history'?'История':'Настройки ставок'}</h1><p>{view==='today'?'Внеси количество картона по отделам':'Все данные сохраняются на этом устройстве'}</p></div>
   <div className="date-picker"><button onClick={()=>changeDate(-1)}><ChevronLeft/></button><CalendarDays size={18}/><span>{selectedDate.toLocaleDateString('ru-RU')}</span><button onClick={()=>changeDate(1)}><ChevronRight/></button></div></header>
   <section className="stats"><Stat title="Оплата за день" value={money(dayTotal)} cls="yellow"/><Stat title="Оплата за неделю" value={money(weekTotal)} cls="blue"/><Stat title="Оплата за месяц" value={money(monthTotal)} cls="green"/></section>
   {view==='today'&&<>
   <section className="panel"><div className="panel-title"><h2>Добавить картон</h2><div className="columns"><span>Количество</span><span>Ставка</span><span>Сумма</span></div></div>
    <div className="rows">{departments.map(d=>{const qty=draft[d.id]||0, rate=rates[d.id]||0;return <div className="row" key={d.id}><div className="dept"><span>{d.icon}</span><b>{d.name}</b></div><div className="counter"><button onClick={()=>updateDraft(d.id,qty-1)}><Minus size={17}/></button><input type="number" value={qty} onChange={e=>updateDraft(d.id,e.target.value)}/><button onClick={()=>updateDraft(d.id,qty+1)}><Plus size={17}/></button></div><div className="rate">{rate.toFixed(2)} zł</div><div className="sum">{money(qty*rate)}</div></div>})}</div>
    <div className="actions"><button className="ghost" onClick={clearDay}><Trash2 size={18}/>Очистить</button><button className="primary" onClick={saveDay}><Save size={18}/>Сохранить за день</button></div>
   </section>
   <section className="lower"><div className="panel history"><h2>Последние дни</h2>{savedDays.slice(0,5).map(([k,e])=><div className="history-line" key={k}><span>{new Date(k+'T12:00:00').toLocaleDateString('ru-RU')}</span><b>{money(calcDay(e))}</b></div>)}{!savedDays.length&&<p className="empty">Пока нет сохранённых дней</p>}</div><div className="panel chart"><h2>Статистика месяца</h2><div className="bars">{chart.map(p=><div className="bar-wrap" key={p.label}><div className="bar" style={{height:`${Math.max(6,p.value/max*100)}%`}} title={money(p.value)}></div><small>{p.label}</small></div>)}</div></div></section>
   </>}
   {view==='history'&&<section className="panel"><h2>Архив по месяцам</h2><MonthArchive entries={entries} rates={rates}/></section>}
   {view==='settings'&&<section className="panel settings"><h2>Ставка за один картон</h2><p className="hint">Впиши оплату в zł для каждого отдела. Все расчёты обновятся автоматически.</p>{departments.map(d=><label key={d.id}><span>{d.icon} {d.name}</span><div><input type="number" step="0.01" value={rates[d.id]} onChange={e=>setRate(d.id,e.target.value)}/><em>zł</em></div></label>)}</section>}
  </main>
 </div>
}
function Stat({title,value,cls}){return <div className={`stat ${cls}`}><WalletCards/><div><small>{title}</small><strong>{value}</strong></div></div>}
function MonthArchive({entries,rates}){const months={};Object.entries(entries).forEach(([k,e])=>{const m=k.slice(0,7);months[m]??=[];months[m].push(e)});const calc=e=>departments.reduce((s,d)=>s+(e[d.id]||0)*(rates[d.id]||0),0);return <div className="archive">{Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])).map(([m,days])=><div className="archive-card" key={m}><small>{new Date(m+'-01T12:00:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</small><strong>{money(days.reduce((s,e)=>s+calc(e),0))}</strong><span>{days.length} сохранённых дней</span></div>)}{!Object.keys(months).length&&<p className="empty">История появится после первого сохранения</p>}</div>}
createRoot(document.getElementById('root')).render(<App/>);
