import {useMemo,useState} from "react";

type Task={id:number,title:string,project:string,priority:"High"|"Normal",due:"Today"|"Overdue"|"Upcoming",done:boolean};
const exampleTasks:Task[]=[
{id:1,title:"Confirm rehearsal dates",project:"Spivmaisternia",priority:"High",due:"Today",done:false},
{id:2,title:"Prepare a partner brief",project:"Make Music Day Lviv",priority:"High",due:"Overdue",done:false},
{id:3,title:"Review performance notes",project:"Slavalachia",priority:"Normal",due:"Today",done:false},
{id:4,title:"Outline autumn programme",project:"Nyzhnyj Zal",priority:"Normal",due:"Upcoming",done:false},
];
const demoProjects=[{name:"Spivmaisternia",status:"Ongoing",note:"Workshops & rehearsals"},{name:"Make Music Day Lviv",status:"Planning",note:"Partners & programme"},{name:"Nyzhnyj Zal",status:"Ongoing",note:"Space & events"}];

function download(text:string){
 const blob=new Blob([text],{type:"text/markdown;charset=utf-8"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=url;a.download="chichka-assignment.md";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function Today(){
 const [tasks,setTasks]=useState(exampleTasks);
 const [selected,setSelected]=useState<number[]>([]);
 const open=useMemo(()=>tasks.filter(t=>!t.done),[tasks]);
 const urgent=open.filter(t=>t.due==="Today"||t.due==="Overdue");
 const toggle=(id:number)=>setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
 const exportSelected=()=>{
  const chosen=tasks.filter(t=>selected.includes(t.id));
  download(["# Assignment brief","","> Prototype export — review before sending.","",...chosen.flatMap(t=>[`## ${t.title}`,`Project: ${t.project}`,`Priority: ${t.priority}`,`Timing: ${t.due}`,"","Details / materials: ____________________",""])].join("\n"));
 };
 return <div className="app-shell">
  <aside className="sidebar"><a className="brand" href="/">CHICHKA<span> / CONTROL</span></a><p className="side-label">PERSONAL WORKSPACE</p><nav aria-label="Workspace"><a className="active" href="#today">Today <span>↗</span></a><a href="#projects">Projects</a><a href="#tasks">Tasks</a><a href="#exports">Exports</a></nav><p className="side-bottom">Private prototype · demo records</p></aside>
  <main id="today" className="main"><header className="top"><span>WORKSPACE / TODAY</span><span className="avatar">MC</span></header>
  <div className="intro"><p className="eyebrow">A LITTLE MORE CLARITY, EVERY DAY</p><h1>Good afternoon,<br/><i>Marichka.</i></h1><p>The next steps, without the noise.</p></div>
  <section className="summary" aria-label="Today overview"><div><span>OPEN TASKS</span><strong>{open.length.toString().padStart(2,"0")}</strong></div><div><span>NEEDS ATTENTION</span><strong>{urgent.length.toString().padStart(2,"0")}</strong></div><div><span>ACTIVE PROJECTS</span><strong>03</strong></div></section>
  <section id="tasks" className="panel"><div className="section-head"><div><p className="eyebrow">01 / NEXT ACTIONS</p><h2>What matters now</h2></div><small>{urgent.length} time-sensitive tasks</small></div>
  <ul className="tasks">{tasks.map(t=><li key={t.id} className={t.done?"completed":""}><input type="checkbox" checked={t.done} aria-label={`Mark ${t.title} completed`} onChange={()=>toggle(t.id)}/><div className="task-content"><b>{t.title}</b><p>{t.project}</p></div><span className={t.due==="Overdue"?"urgent":"chip"}>{t.due}</span><input className="select-export" type="checkbox" aria-label={`Select ${t.title} for export`} checked={selected.includes(t.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,t.id]:old.filter(v=>v!==t.id))}/></li>)}</ul>
  <div className="export-bar" id="exports"><span>Choose tasks using the right-hand checkbox</span><button type="button" disabled={!selected.length} onClick={exportSelected}>Export brief ({selected.length}) ↗</button></div></section>
  <section id="projects" className="panel"><div className="section-head"><div><p className="eyebrow">02 / AT A GLANCE</p><h2>Projects in motion</h2></div></div><div className="projects">{demoProjects.map(p=><article key={p.name}><div><h3>{p.name}</h3><p>{p.note}</p></div><span>{p.status}</span></article>)}</div></section>
  <footer>This is a UI technology spike, not the production admin. All records are illustrative.</footer>
  </main></div>;
}
