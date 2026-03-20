/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileJson, CheckCircle2, AlertCircle, Loader2, X, 
  LayoutGrid, FileUp, Plus, Trash2, RefreshCcw, Info
} from 'lucide-react';

// --- Types ---
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type TaskStatus = 'pending' | 'success' | 'warning';

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
}

type Tab = 'uploader' | 'monitor';

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('uploader');

  // --- Uploader State ---
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Task Grid State ---
  const [tasks, setTasks] = useState<Task[]>(Array.from({ length: 24 }, (_, i) => ({
    id: `task-${i}`,
    name: `Task ${i + 1}`,
    status: i % 5 === 0 ? 'success' : i % 7 === 0 ? 'warning' : 'pending'
  })));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // --- Uploader Logic ---
  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
      setFile(selectedFile);
      setUploadError(null);
      setUploadStatus('idle');
    } else {
      setUploadError('Only .json files are supported');
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const simulateUpload = async () => {
    if (!file) return;
    setUploadStatus('uploading');
    setUploadError(null);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUploadStatus('success');
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus('idle');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Task Grid Logic ---
  const stats = useMemo(() => ({
    total: tasks.length,
    success: tasks.filter(t => t.status === 'success').length,
    warning: tasks.filter(t => t.status === 'warning').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  }), [tasks]);

  const addTask = () => {
    const newId = `task-${Date.now()}`;
    setTasks(prev => [...prev, { id: newId, name: `Task ${prev.length + 1}`, status: 'pending' }]);
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <RefreshCcw size={18} />
            </div>
            <span className="font-bold tracking-tight text-lg">Unified Workspace</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('uploader')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'uploader' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileUp size={16} />
              File Upload
            </button>
            <button 
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'monitor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={16} />
              Task Monitor
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'uploader' ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-md bg-slate-50/50 border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900">JSON File Uploader</h2>
                  <p className="text-slate-500 text-sm mt-1">Select or drag a .json file to begin processing</p>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative group cursor-pointer aspect-video rounded-2xl border-2 border-dashed transition-all duration-300
                    flex flex-col items-center justify-center gap-4 overflow-hidden
                    ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 hover:border-indigo-400 hover:bg-white'}
                    ${uploadStatus === 'success' ? 'border-emerald-500 bg-emerald-50/30' : ''}
                    ${uploadStatus === 'error' ? 'border-rose-500 bg-rose-50/30' : ''}
                  `}
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => validateAndSetFile(e.target.files?.[0] as File)} accept=".json" className="hidden" />
                  
                  <AnimatePresence mode="wait">
                    {!file && uploadStatus === 'idle' && (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-slate-400">
                        <Upload size={32} className="mb-2 group-hover:text-indigo-500 transition-colors" />
                        <p className="text-sm font-medium">Drag & drop .json here</p>
                      </motion.div>
                    )}

                    {file && uploadStatus === 'idle' && (
                      <motion.div key="selected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-indigo-600">
                        <FileJson size={32} className="mb-2" />
                        <p className="text-sm font-semibold truncate max-w-[200px]">{file.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="absolute top-4 right-4 p-1.5 bg-white rounded-full shadow-sm text-slate-400 hover:text-rose-500 transition-colors">
                          <X size={16} />
                        </button>
                      </motion.div>
                    )}

                    {uploadStatus === 'uploading' && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-indigo-600">
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <p className="text-sm font-medium">Processing...</p>
                      </motion.div>
                    )}

                    {uploadStatus === 'success' && (
                      <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-emerald-600">
                        <CheckCircle2 size={32} className="mb-2" />
                        <p className="text-sm font-semibold">Upload Successful</p>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="mt-2 text-xs font-medium underline underline-offset-4">Reset</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  disabled={!file || uploadStatus !== 'idle'}
                  onClick={simulateUpload}
                  className={`w-full mt-8 py-4 rounded-2xl font-bold text-white transition-all ${!file || uploadStatus !== 'idle' ? 'bg-slate-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
                >
                  {uploadStatus === 'uploading' ? 'Uploading...' : 'Submit JSON'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="monitor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Task Core Grid</h2>
                    <p className="text-slate-500 text-sm">Real-time unit status visualization</p>
                  </div>
                  <button onClick={addTask} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600">
                    <Plus size={20} />
                  </button>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-8">
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    <AnimatePresence>
                      {tasks.map((task, index) => (
                        <motion.button
                          key={task.id}
                          layout
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{}}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`
                            relative group aspect-square rounded-lg border-2 transition-all duration-300 overflow-hidden
                            ${selectedTaskId === task.id ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}
                            ${task.status === 'pending' ? 'bg-white border-slate-200 hover:border-indigo-300' : ''}
                            ${task.status === 'success' ? 'bg-emerald-500 border-emerald-400' : ''}
                            ${task.status === 'warning' ? 'bg-amber-400 border-amber-300' : ''}
                          `}
                        >
                          {/* Subtle backdrop on hover */}
                          <span className="
                            absolute inset-0 bg-white/90 backdrop-blur-sm
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          " />
                          {/* Floating ID on hover */}
                          <span className="
                            absolute inset-0 z-10 flex items-center justify-center
                            text-sm font-bold tracking-tight text-violet-600
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-300
                          ">
                            {index + 1}
                          </span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex gap-6 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div>Pending</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>Success</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div>Fault</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Monitor</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100"><p className="text-[10px] text-slate-400 mb-1">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100"><p className="text-[10px] text-emerald-600 mb-1">Success</p><p className="text-xl font-bold text-emerald-600">{stats.success}</p></div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100"><p className="text-[10px] text-amber-600 mb-1">Faults</p><p className="text-xl font-bold text-amber-600">{stats.warning}</p></div>
                    <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200"><p className="text-[10px] text-slate-500 mb-1">Pending</p><p className="text-xl font-bold text-slate-700">{stats.pending}</p></div>
                  </div>

                  {selectedTask ? (
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{selectedTask.name}</span>
                        <button onClick={() => removeTask(selectedTask.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="flex gap-2">
                        {(['pending', 'success', 'warning'] as TaskStatus[]).map(s => (
                          <button 
                            key={s}
                            onClick={() => updateTaskStatus(selectedTask.id, s)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedTask.status === s ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-slate-200 text-center py-8">
                      <Info size={24} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-[10px] text-slate-400">Select a unit to modify</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}



