/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileJson, CheckCircle2, Loader2, X,
  LayoutGrid, FileUp, Trash2, RefreshCcw, Info,
  Database, Download, Eye, CheckSquare, Square, RefreshCw, Search
} from 'lucide-react';
import tasksData from '@/json/images.json';

// --- Types ---
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type TaskStatus = 'pending' | 'done';
type TaskBackground = 'white' | 'green' | 'black';

interface Task {
  id: string;
  img_name: number;
  status: TaskStatus;
  background: TaskBackground;
}

interface StoredRecord {
  id: number;
  data: unknown;
  created_at: string;
}

type Tab = 'uploader' | 'monitor' | 'admin';

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
  const [tasks, setTasks] = useState<Task[]>(() =>
    (tasksData as Array<{ img_name: number; state: string; background: string }>).map((item, index) => ({
      id: `task-${item.img_name}`,
      img_name: item.img_name,
      status: item.state as TaskStatus,
      background: item.background as TaskBackground,
    }))
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Admin State ---
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // --- Admin Logic ---
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/tasks');
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') fetchRecords();
  }, [activeTab, fetchRecords]);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const downloadSelected = () => {
    const selected = records.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return;

    const exportData = selected.map(r => ({
      id: r.id,
      ...r.data as object,
      exported_at: r.created_at
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${selected.length}_records_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingle = (record: StoredRecord) => {
    const blob = new Blob([JSON.stringify(record.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `record_${record.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSelected = async () => {
    // Note: 后端需要添加 DELETE 接口，这里仅演示前端逻辑
    console.log('删除选中:', Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

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

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      console.log('📊 上传数据调试:');
      console.log('  - 总数:', Array.isArray(data) ? data.length : 'N/A');
      console.log('  - 类型:', typeof data);
      console.log('  - 内容:', data);
      console.log('  - 键名:', typeof data === 'object' ? Object.keys(data) : 'N/A');

      // 保存到 Neon 数据库
      const res = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const result = await res.json();
      if (result.success) {
        console.log('✅ 已保存到数据库, ID:', result.id);
      } else {
        console.error('❌ 保存失败:', result.error);
      }
    } catch (err) {
      console.error('❌ JSON 解析或上传失败:', err);
    }

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
    pending: tasks.filter(t => t.status === 'pending').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    return tasks.filter(t => t.img_name.toString().includes(searchQuery.trim()));
  }, [tasks, searchQuery]);

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
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Database size={16} />
              Data Admin
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
          ) : activeTab === 'monitor' ? (
            <motion.div
              key="monitor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Task Core Grid</h2>
                    <p className="text-slate-500 text-sm">Real-time unit status visualization</p>
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 w-32 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-8">
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    <AnimatePresence>
                      {filteredTasks.map((task) => (
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
                            ${task.status === 'done' ? 'bg-emerald-500 border-emerald-400' : ''}
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
                            {task.img_name}
                          </span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="lg:sticky lg:top-24 bg-slate-50/50 border border-slate-200 rounded-3xl p-6 space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Monitor</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100"><p className="text-[10px] text-slate-400 mb-1">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100"><p className="text-[10px] text-emerald-600 mb-1">Done</p><p className="text-xl font-bold text-emerald-600">{stats.done}</p></div>
                  </div>
                  <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200"><p className="text-[10px] text-slate-500 mb-1">Pending</p><p className="text-xl font-bold text-slate-700">{stats.pending}</p></div>

                  {selectedTask ? (
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">IMG_{selectedTask.img_name}</span>
                        <button onClick={() => removeTask(selectedTask.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="text-xs text-slate-500">
                        State: <span className={`font-semibold ${selectedTask.status === 'done' ? 'text-emerald-600' : 'text-slate-700'}`}>{selectedTask.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        Background:
                        <span className={`inline-block w-4 h-4 rounded ${
                          selectedTask.background === 'white' ? 'bg-white border border-slate-300' :
                          selectedTask.background === 'green' ? 'bg-emerald-500' :
                          'bg-slate-800'
                        }`}></span>
                        <span className="font-semibold capitalize">{selectedTask.background}</span>
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
          ) : activeTab === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Data Administration</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage uploaded JSON records</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchRecords}
                    disabled={isLoading}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={downloadSelected}
                    disabled={selectedIds.size === 0}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      selectedIds.size > 0
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Download size={18} />
                    Download ({selectedIds.size})
                  </button>
                  <button
                    onClick={deleteSelected}
                    disabled={selectedIds.size === 0}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      selectedIds.size > 0
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 size={18} />
                    Delete ({selectedIds.size})
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Total Records</p>
                  <p className="text-3xl font-bold text-slate-900">{records.length}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                  <p className="text-[10px] text-indigo-500 uppercase tracking-widest mb-2">Selected</p>
                  <p className="text-3xl font-bold text-indigo-600">{selectedIds.size}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[10px] text-emerald-500 uppercase tracking-widest mb-2">Last Updated</p>
                  <p className="text-lg font-bold text-emerald-600 truncate">{records[0] ? formatDate(records[0].created_at) : 'N/A'}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Database size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold">No records found</p>
                    <p className="text-sm mt-1">Upload some JSON files to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white/50">
                          <th className="text-left p-4 w-12">
                            <button
                              onClick={toggleSelectAll}
                              className="p-1 rounded hover:bg-slate-200 transition-colors"
                            >
                              {selectedIds.size === records.length ? (
                                <CheckSquare size={18} className="text-indigo-600" />
                              ) : (
                                <Square size={18} className="text-slate-400" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                          <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview</th>
                          <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created At</th>
                          <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {records.map((record, index) => (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`border-b border-slate-100 hover:bg-white/80 transition-colors ${
                                selectedIds.has(record.id) ? 'bg-indigo-50/50' : ''
                              }`}
                            >
                              <td className="p-4">
                                <button
                                  onClick={() => toggleSelect(record.id)}
                                  className="p-1 rounded hover:bg-slate-200 transition-colors"
                                >
                                  {selectedIds.has(record.id) ? (
                                    <CheckSquare size={18} className="text-indigo-600" />
                                  ) : (
                                    <Square size={18} className="text-slate-400" />
                                  )}
                                </button>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                                  {record.id}
                                </span>
                              </td>
                              <td className="p-4 max-w-md">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600 block truncate">
                                  {JSON.stringify(record.data).slice(0, 60)}...
                                </code>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-500">{formatDate(record.created_at)}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => downloadSingle(record)}
                                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors"
                                    title="Download"
                                  >
                                    <Download size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const blob = new Blob([JSON.stringify(record.data, null, 2)], { type: 'application/json' });
                                      const url = URL.createObjectURL(blob);
                                      window.open(url, '_blank');
                                    }}
                                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-emerald-600 transition-colors"
                                    title="Preview"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Delete this record?')) {
                                        setRecords(prev => prev.filter(r => r.id !== record.id));
                                        setSelectedIds(prev => {
                                          const next = new Set(prev);
                                          next.delete(record.id);
                                          return next;
                                        });
                                      }
                                    }}
                                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="text-center text-[10px] text-slate-400 uppercase tracking-wider">
                Showing {records.length} records · Select multiple for batch operations
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}



