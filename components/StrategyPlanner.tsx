
import React, { useEffect, useState } from 'react';
import { Calendar, FileCheck, DollarSign, ListChecks, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { PlannerTask, User } from '../types';
import { createPlannerTask, deletePlannerTask, loadPlannerTasks, updatePlannerTask } from '../services/cloudData';

interface Props { currentUser?: User | null }

const DEFAULT_TASKS: PlannerTask[] = [
    { id: '1', cat: 'Docs', label: 'Official Transcripts', done: false },
    { id: '2', cat: 'Exam', label: 'IELTS / TOEFL Prep', done: true },
    { id: '3', cat: 'Docs', label: '2 Recommendation Letters', done: false },
    { id: '4', cat: 'Submit', label: 'Motivational Essay Final Draft', done: false },
    { id: '5', cat: 'Finance', label: 'Scholarship Application', done: false }
];

const StrategyPlanner: React.FC<Props> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<PlannerTask[]>(DEFAULT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      const saved = localStorage.getItem('bagdar_planner_tasks');
      if (saved) setTasks(JSON.parse(saved));
      return;
    }
    loadPlannerTasks(currentUser.id).then(async cloudTasks => {
      if (cloudTasks.length) {
        setTasks(cloudTasks);
        return;
      }
      const seeded = await Promise.all(DEFAULT_TASKS.map(({ id: _id, ...task }) => createPlannerTask(currentUser.id, task)));
      setTasks(seeded);
    }).catch(() => setSyncMessage('Cloud sync is temporarily unavailable.'));
  }, [currentUser?.id]);

  const storeGuestTasks = (next: PlannerTask[]) => localStorage.setItem('bagdar_planner_tasks', JSON.stringify(next));

  const toggle = async (id: string) => {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    const next = tasks.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setTasks(next);
    if (currentUser) await updatePlannerTask(currentUser.id, id, !task.done).catch(() => setSyncMessage('Task update did not sync.'));
    else storeGuestTasks(next);
  };

  const remove = async (id: string) => {
    const next = tasks.filter(item => item.id !== id);
    setTasks(next);
    if (currentUser) await deletePlannerTask(currentUser.id, id).catch(() => setSyncMessage('Task deletion did not sync.'));
    else storeGuestTasks(next);
  };
  
  const addTask = async () => {
    if (!newTask) return;
    const draft = { cat: 'Custom', label: newTask.trim(), done: false };
    if (!draft.label) return;
    if (currentUser) {
      try {
        const created = await createPlannerTask(currentUser.id, draft);
        setTasks([...tasks, created]);
      } catch {
        setSyncMessage('Could not add the task to your cloud roadmap.');
        return;
      }
    } else {
      const next = [...tasks, { id: crypto.randomUUID(), ...draft }];
      setTasks(next);
      storeGuestTasks(next);
    }
    setNewTask('');
  };

  const progress = tasks.length ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-12">
        <div className="md:w-1/3">
          <div className="bg-[#1A1F26] rounded-[3rem] p-10 text-white shadow-2xl sticky top-24 border border-gray-800">
            <h2 className="text-3xl font-black mb-6 leading-tight">Master <br/> Timeline</h2>
            <div className="mb-10">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="text-gray-500">Milestones Reached</span>
                <span className="text-emerald-400">{progress}%</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                <div className="bg-emerald-400 h-full transition-all duration-1000 shadow-[0_0_10px_#10B981]" style={{width: `${progress}%`}} />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20"><Calendar size={24}/></div>
                <div><div className="font-bold">Next Deadline</div><div className="text-xs text-emerald-400/70 font-black uppercase tracking-widest mt-1">Nov 30 • Winter Intake</div></div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20"><FileCheck size={24}/></div>
                <div><div className="font-bold">Workspace Status</div><div className="text-xs text-blue-400/70 font-black uppercase tracking-widest mt-1">{currentUser ? 'Cloud Sync Enabled' : 'Local Guest Mode'}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-2/3 space-y-6">
          {syncMessage && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-300">{syncMessage}</div>}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl font-black flex items-center gap-3"><ListChecks className="text-emerald-400"/> My Roadmap</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Add task..."
                className="flex-1 sm:w-64 px-6 py-4 bg-[#1A1F26] border border-gray-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-white placeholder:text-gray-600"
              />
              <button onClick={addTask} className="p-4 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">
                <Plus size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tasks.map(task => (
              <div 
                key={task.id}
                className={`flex items-center gap-4 p-6 rounded-[2rem] border transition-all duration-300 ${
                  task.done ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-[#1A1F26] border-gray-800 hover:border-gray-600 shadow-sm'
                }`}
              >
                <button onClick={() => toggle(task.id)} className="shrink-0">
                  {task.done ? <CheckCircle2 className="text-emerald-400" /> : <Circle className="text-gray-700" />}
                </button>
                <span className={`flex-1 text-left font-bold ${task.done ? 'text-emerald-400/70 line-through' : 'text-gray-200'}`}>{task.label}</span>
                <span className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest border border-white/5 shrink-0">{task.cat}</span>
                <button onClick={() => remove(task.id)} className="text-gray-700 hover:text-red-400 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-10 bg-[#1A1F26] rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <h4 className="font-black text-xl mb-8 flex items-center gap-3 relative z-10"><DollarSign size={24} className="text-emerald-400"/> Budget Estimation</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              {[
                { label: 'Tuition', val: '$15k', color: 'emerald' },
                { label: 'Housing', val: '$600', color: 'blue' },
                { label: 'Living', val: '$300', color: 'amber' },
                { label: 'Transport', val: '$120', color: 'red' }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-black/20 rounded-[1.5rem] text-center border border-white/5">
                  <div className="text-xl font-black text-white mb-1">{item.val}</div>
                  <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPlanner;
