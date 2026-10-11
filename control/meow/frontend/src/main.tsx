import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

type User={email:string;name:string;sub:string};
type Project={id:number;title:string;description:string;status:string;created_at:string};
type Task={id:number;project_id:number;project_title:string;title:string;status:'open'|'done';priority:string;due_at:string|null};
type Session={user:User;csrf:string};
async function request<T>(path:string,csrf?:string,init:RequestInit={}):Promise<T>{
  const response=await fetch('/api'+path,{credentials:'same-origin',...init,headers:{...(init.body?{'Content-Type':'application/json'}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...init.headers}});
  if(!response.ok)throw new Error('Request failed: '+response.status);
  return response.json() as Promise<T>;
}
function App(){
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(true);
  const [projects,setProjects]=useState<Project[]>([]);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [projectTitle,setProjectTitle]=useState('');
  const [taskTitle,setTaskTitle]=useState('');
  const [selectedProject,setSelectedProject]=useState('');
  const [selected,setSelected]=useState<number[]>([]);
  const [error,setError]=useState('');
  const reload=async()=>{
    const [p,t]=await Promise.all([request<{data:Project[]}>('/projects'),request<{data:Task[]}>('/tasks')]);
    setProjects(p.data);setTasks(t.data);
    setSelectedProject(old=>old||String(p.data[0]?.id||''));
  };
  useEffect(()=>{request<Session>('/auth/me').then(s=>{setSession(s);return Promise.all([request<{data:Project[]}>('/projects'),request<{data:Task[]}>('/tasks')])}).then(data=>{setProjects(data[0].data);setTasks(data[1].data);setSelectedProject(String(data[0].data[0]?.id||''))}).catch(()=>{}).finally(()=>setLoading(false));},[]);
  const mutate=async (path:string,options:RequestInit)=>{
    if(!session)return;
    setError('');
    try{await request(path,session.csrf,options);await reload();}
    catch(e){setError(e instanceof Error?e.message:'Something went wrong');}
  };
  const addProject=async(e:React.FormEvent)=>{e.preventDefault();if(!projectTitle.trim())return;await mutate('/projects',{method:'POST',body:JSON.stringify({title:projectTitle})});setProjectTitle('')};
  const addTask=async(e:React.FormEvent)=>{e.preventDefault();if(!taskTitle.trim()||!selectedProject)return;await mutate('/tasks',{method:'POST',body:JSON.stringify({title:taskTitle,project_id:Number(selectedProject)})});setTaskTitle('')};
  const exportBrief=async()=>{
    const response=await fetch('/api/exports/tasks?ids='+selected.join(','),{credentials:'same-origin'});
    if(!response.ok){setError('Export failed');return;}
    const blob=await response.blob();const uri=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=uri;a.download='meow-brief.md';a.click();setTimeout(()=>URL.revokeObjectURL(uri),1000);
  };
  if(loading)return <main className="center">Opening MEOW…</main>;
  if(!session)return <main className="sign-in"><div className="mark">m.</div><p className="eyebrow">CHICHKA / PRIVATE WORKSPACE</p><h1>Behind the scenes.</h1><p>A quiet space for plans, people and work.</p><a className="button" href="/api/auth/login">Continue with Google ↗</a><p className="fine">Access is restricted to two approved Google accounts.</p></main>;
  return <div className="shell">
    <aside className="sidebar"><strong className="wordmark">meow<span>.</span></strong><small>CHICHKA / CONTROL</small><nav><a href="#today">Today</a><a href="#projects">Projects</a><a href="#tasks">Tasks</a><a href="#exports">Exports</a></nav><div className="account"><span>{session.user.email}</span><button onClick={()=>request('/auth/logout',session.csrf,{method:'POST'}).then(()=>location.reload()).catch(()=>setError('Could not sign out'))}>Sign out ↗</button></div></aside>
    <main className="workspace" id="today"><header><span className="eyebrow">PRIVATE / TODAY</span><span className="avatar">MC</span></header>
      <section className="intro"><p className="eyebrow">YOUR OWN WORKSPACE</p><h1>Things in <em>motion.</em></h1><p>Clear decisions. One thing at a time.</p></section>
      <div className="stats"><div><span>PROJECTS</span><strong>{projects.length.toString().padStart(2,'0')}</strong></div><div><span>OPEN TASKS</span><strong>{tasks.filter(t=>t.status==='open').length.toString().padStart(2,'0')}</strong></div><div><span>DONE</span><strong>{tasks.filter(t=>t.status==='done').length.toString().padStart(2,'0')}</strong></div></div>
      {error&&<p className="error" role="alert">{error}</p>}
      <section className="panel" id="tasks"><div className="section-top"><span className="eyebrow">01 / ACTIONS</span><h2>Next up</h2></div><form className="create" onSubmit={addTask}><input aria-label="Task title" placeholder="Add a task…" value={taskTitle} maxLength={180} onChange={e=>setTaskTitle(e.target.value)}/><select aria-label="Project" value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><button disabled={!selectedProject}>Add ↗</button></form>
      <div className="task-list">{tasks.length===0?<p className="empty">No tasks yet. A little room to breathe.</p>:tasks.map(t=><div key={t.id} className={'task '+(t.status==='done'?'done':'')}><input type="checkbox" aria-label={'Complete '+t.title} checked={t.status==='done'} onChange={()=>mutate('/tasks/'+t.id,{method:'PATCH',body:JSON.stringify({status:t.status==='done'?'open':'done'})})}/><div className="task-name"><strong>{t.title}</strong><small>{t.project_title}</small></div><span className="priority">{t.priority}</span><input className="select" aria-label={'Select '+t.title+' for export'} type="checkbox" checked={selected.includes(t.id)} onChange={e=>setSelected(s=>e.target.checked?[...s,t.id]:s.filter(id=>id!==t.id))}/></div>)}</div>
      <div id="exports" className="export"><span>{selected.length} selected for team brief</span><button disabled={!selected.length} onClick={exportBrief}>Export Markdown ↗</button></div></section>
      <section className="panel" id="projects"><div className="section-top"><span className="eyebrow">02 / PROJECTS</span><h2>Ongoing work</h2></div><form className="create" onSubmit={addProject}><input aria-label="New project name" placeholder="New project…" maxLength={180} value={projectTitle} onChange={e=>setProjectTitle(e.target.value)}/><button>Add project ↗</button></form><div className="project-list">{projects.length===0?<p className="empty">Your projects will appear here.</p>:projects.map(p=><article key={p.id}><h3>{p.title}</h3><span>{p.status}</span></article>)}</div></section>
      <footer>MEOW / MARICHKA CHICHKOVA · PRIVATE</footer>
    </main></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
