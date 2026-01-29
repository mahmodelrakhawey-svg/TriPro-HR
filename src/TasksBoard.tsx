import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date: string;
  employee_name?: string;
  avatar_url?: string;
}

interface Comment {
  id: string;
  task_id: string;
  employee_id: string;
  content: string;
  created_at: string;
  employee_name?: string;
  avatar_url?: string;
}

const TasksBoard: React.FC = () => {
  const { employees } = useData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'MEDIUM',
    due_date: new Date().toISOString().split('T')[0],
    status: 'PENDING'
  });

  const fetchCurrentEmployee = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Use limit(1).maybeSingle() to avoid errors if no row or multiple rows are found.
      const { data } = await supabase.from('employees').select('id').eq('auth_id', user.id).limit(1).maybeSingle();
      if (data) {
        setCurrentEmployeeId(data.id);
      }
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    // Fetch tasks without the join first to avoid PGRST200
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      const formattedTasks = data.map((task: any) => {
        const assignedEmployee = employees.find(e => e.id === task.assigned_to);
        return {
          ...task,
          employee_name: assignedEmployee ? assignedEmployee.name : 'Unassigned',
          avatar_url: assignedEmployee?.avatarUrl
        };
      });
      setTasks(formattedTasks);
    }
  }, [employees]);

  useEffect(() => {
    fetchTasks();
    fetchCurrentEmployee();
  }, [fetchTasks, fetchCurrentEmployee]);

  const handleAddTask = async () => {
    if (!newTask.title) return;

    const { error } = await supabase.from('tasks').insert({
      title: newTask.title,
      description: newTask.description,
      assigned_to: newTask.assigned_to || null,
      priority: newTask.priority,
      due_date: newTask.due_date,
      status: 'PENDING',
      org_id: '00000000-0000-0000-0000-000000000000' // Default Org
    });

    if (error) {
      alert('Error adding task: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchTasks();
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'MEDIUM',
        due_date: new Date().toISOString().split('T')[0],
        status: 'PENDING'
      });
    }
  };

  const updateTaskStatus = async (id: string, newStatus: Task['status']) => {
    // Optimistic Update: تحديث الواجهة فوراً قبل انتظار السيرفر
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
      fetchTasks(); // التراجع في حالة الخطأ
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'HIGH': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const fetchComments = async (taskId: string) => {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data.map((c: any) => {
        const commentEmployee = employees.find(e => e.id === c.employee_id);
        return {
          ...c,
          employee_name: commentEmployee ? commentEmployee.name : 'Unknown',
          avatar_url: commentEmployee?.avatarUrl
        };
      }));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    // استخدام الموظف الحالي إذا وجد، وإلا استخدام أول موظف كاحتياطي (لأغراض العرض)
    const employeeId = currentEmployeeId || employees[0]?.id; 

    if (!employeeId) return;

    const { error: commentError } = await supabase.from('task_comments').insert({
      task_id: selectedTask.id,
      employee_id: employeeId,
      content: newComment
    });

    if (commentError) {
      alert('Error adding comment: ' + commentError.message);
    } else {
      setNewComment('');
      fetchComments(selectedTask.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        alert('Error deleting task: ' + error.message);
      } else {
        setIsDetailsModalOpen(false);
        setSelectedTask(null);
        fetchTasks();
      }
    }
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
    fetchComments(task.id);
  };

  const columns = [
    { id: 'PENDING', title: 'قيد الانتظار', color: 'bg-slate-50 border-slate-200' },
    { id: 'IN_PROGRESS', title: 'جاري العمل', color: 'bg-blue-50 border-blue-200' },
    { id: 'COMPLETED', title: 'مكتملة', color: 'bg-emerald-50 border-emerald-200' },
  ];

  const filteredTasks = showMyTasks && currentEmployeeId 
    ? tasks.filter(t => t.assigned_to === currentEmployeeId) 
    : tasks;

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800">لوحة المهام (Tasks Board)</h2>
          <p className="text-slate-500 text-sm mt-1">توزيع ومتابعة مهام الفريق.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowMyTasks(!showMyTasks)}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black transition flex items-center gap-2 ${showMyTasks ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <i className={`fas ${showMyTasks ? 'fa-user-check' : 'fa-user'}`}></i> مهامي فقط
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> إضافة مهمة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] overflow-hidden">
        {columns.map(col => (
          <div 
            key={col.id} 
            className={`flex flex-col h-full rounded-[2.5rem] border ${col.color} p-4 transition-colors ${draggedTaskId ? 'hover:bg-slate-50/80' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedTaskId) {
                updateTaskStatus(draggedTaskId, col.id as Task['status']);
                setDraggedTaskId(null);
              }
            }}
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-black text-slate-700">{col.title}</h3>
              <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                {filteredTasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredTasks.filter(t => t.status === col.id).map(task => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => { setDraggedTaskId(task.id); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnd={() => setDraggedTaskId(null)}
                  onClick={() => openTaskDetails(task)} 
                  className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group cursor-pointer ${draggedTaskId === task.id ? 'opacity-50 rotate-2 scale-95' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {col.id !== 'COMPLETED' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, col.id === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED'); }}
                        className="w-6 h-6 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition"
                      >
                        <i className="fas fa-arrow-left text-[10px]"></i>
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                  
                  <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      {task.avatar_url ? (
                        <img src={task.avatar_url} alt={task.employee_name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{task.employee_name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{task.due_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">مهمة جديدة</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">عنوان المهمة</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">التفاصيل</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">تعيين إلى</label>
                  <select 
                    value={newTask.assigned_to}
                    onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">غير معين</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">الأولوية</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="LOW">منخفضة</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="HIGH">عالية</option>
                    <option value="URGENT">عاجلة</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ الاستحقاق</label>
                <input 
                  type="date" 
                  value={newTask.due_date}
                  onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
              <button onClick={handleAddTask} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">حفظ المهمة</button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-fade-in h-[80vh] flex flex-col">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${getPriorityColor(selectedTask.priority)}`}>{selectedTask.priority}</span>
                  <span className="text-[10px] font-mono text-slate-400">{selectedTask.due_date}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800">{selectedTask.title}</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition"
                  title="حذف المهمة"
                >
                  <i className="fas fa-trash-can"></i>
                </button>
                <button onClick={() => setIsDetailsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><i className="fas fa-comments text-indigo-500"></i> التعليقات ({comments.length})</h4>
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <img src={comment.avatar_url || 'https://i.pravatar.cc/150?img=3'} className="w-8 h-8 rounded-full object-cover border border-slate-100" alt="" />
                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tr-none border border-slate-100 flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-700">{comment.employee_name}</span>
                        <span className="text-[9px] text-slate-400">{new Date(comment.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <p className="text-xs text-slate-600">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 shrink-0">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="أضف تعليقاً..." className="flex-grow px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" onKeyPress={e => e.key === 'Enter' && handleAddComment()} />
              <button onClick={handleAddComment} className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition"><i className="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksBoard;
