/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileJson, CheckCircle2, Loader2, X,
  LayoutGrid, FileUp, Trash2, RefreshCcw, Info,
  Database, Download, Eye, CheckSquare, Square, RefreshCw, Search,
  AlertTriangle, XCircle, Trophy, Crown, Medal, Lock
} from 'lucide-react';
import tasksData from '@/json/images.json';

// --- Types ---
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type TaskStatus = 'pending' | 'done';
type TaskBackground = 'white' | 'green' | 'black';
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface Task {
  id: string;
  img_name: number;
  status: TaskStatus;
  background: TaskBackground;
}

interface StoredRecord {
  id: number;
  filename?: string;
  data: unknown;
  author?: string;
  created_at: string;
}

type Tab = 'uploader' | 'monitor' | 'admin' | 'leaderboard';

// --- Toast Component ---
const ToastNotification: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <XCircle size={18} className="text-rose-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    info: <Info size={18} className="text-indigo-500" />
  };
  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-rose-50 border-rose-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-indigo-50 border-indigo-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium text-slate-700">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="ml-2 text-slate-400 hover:text-slate-600">
        <X size={14} />
      </button>
    </motion.div>
  );
};

// --- Confirm Dialog Component ---
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}> = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, variant = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${variant === 'danger' ? 'bg-rose-100' : 'bg-amber-100'}`}>
              <AlertTriangle size={24} className={variant === 'danger' ? 'text-rose-500' : 'text-amber-500'} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-slate-600 text-sm mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
                variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Password Dialog Component ---
const PasswordDialog: React.FC<{
  isOpen: boolean;
  title: string;
  passwordType: 'download' | 'delete';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, passwordType, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Passwords from .env.local (in production, this should be server-side validation)
  const passwords = {
    download: '123456',
    delete: '1433223'
  };

  const handleSubmit = () => {
    if (password === passwords[passwordType]) {
      setPassword('');
      setError('');
      onConfirm();
    } else {
      setError('Incorrect password');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-indigo-100">
              <Lock size={24} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>

          <p className="text-slate-500 text-sm mb-4">
            Enter password to {passwordType === 'download' ? 'download' : 'delete'} records.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter password..."
            autoFocus
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
            }`}
          />

          {error && (
            <p className="text-rose-500 text-xs mt-2">{error}</p>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => { setPassword(''); setError(''); onCancel(); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('uploader');

  // ========== TOAST SYSTEM ==========
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ========== CONFIRM DIALOG ==========
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  }, []);

  // ========== PASSWORD DIALOG ==========
  const [passwordDialog, setPasswordDialog] = useState<{
    isOpen: boolean;
    title: string;
    passwordType: 'download' | 'delete';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', passwordType: 'download', onConfirm: () => {} });

  const showPasswordDialog = useCallback((title: string, passwordType: 'download' | 'delete', onConfirm: () => void) => {
    setPasswordDialog({ isOpen: true, title, passwordType, onConfirm });
  }, []);

  // ========== SHARED DATA SOURCE ==========
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [isDBLoading, setIsDBLoading] = useState(false);
  const isRequestPending = useRef(false);

  // 统一的数据获取函数（带请求锁）
  const fetchDBData = useCallback(async () => {
    if (isRequestPending.current) {
      console.log('⏳ Request in progress, skipping...');
      return;
    }

    isRequestPending.current = true;
    setIsDBLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/tasks');
      const data = await res.json();
      setRecords(data);
      console.log(`✅ Fetched ${data.length} records from database`);
    } catch (err) {
      console.error('❌ Failed to fetch data:', err);
    } finally {
      setIsDBLoading(false);
      isRequestPending.current = false;
    }
  }, []);

  // 从 records 提取已上传的文件名集合（共享给 Task Monitor 使用）
  const dbFilenames = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.filename) {
        // IMG_1279.json -> IMG_1279
        const name = r.filename.replace('.json', '');
        set.add(name);
      }
    });
    return set;
  }, [records]);

  // ========== AUTHOR LEADERBOARD ==========
  const authorLeaderboard = useMemo(() => {
    const authorCounts = new Map<string, number>();
    records.forEach(r => {
      const author = r.author?.trim() || 'Anonymous';
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
    });

    return Array.from(authorCounts.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [records]);

  // 初始化加载 & Tab 切换时加载数据
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      fetchDBData();
    }
  }, [fetchDBData]);

  // Tab 切换时清空选中状态
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedTaskId(null);
    setSearchQuery('');
  }, [activeTab]);

  // ========== TASK MONITOR ==========
  // 任务列表：从 images.json 加载，status 根据 dbFilenames 动态计算
  const tasks = useMemo<Task[]>(() => {
    return (tasksData as Array<{ img_name: number; state: string; background: string }>).map((item) => ({
      id: `task-${item.img_name}`,
      img_name: item.img_name,
      status: dbFilenames.has(`IMG_${item.img_name}`) ? 'done' : 'pending',
      background: item.background as TaskBackground,
    }));
  }, [dbFilenames]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    return tasks.filter(t => t.img_name.toString().includes(searchQuery.trim()));
  }, [tasks, searchQuery]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // ========== DATA ADMIN ==========
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
    showToast('success', `Downloaded ${selected.length} record(s)`);
  };

  const downloadSingle = (record: StoredRecord) => {
    const blob = new Blob([JSON.stringify(record.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.filename || `record_${record.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    showPasswordDialog(
      'Delete Verification',
      'delete',
      async () => {
        setPasswordDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const deletePromises = Array.from(selectedIds).map(id =>
            fetch(`http://localhost:3001/api/tasks/${id}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);

          // 更新本地 records
          setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
          showToast('success', `Deleted ${selectedIds.size} record(s)`);
          console.log(`✅ Deleted ${selectedIds.size} record(s)`);
          setSelectedIds(new Set());
        } catch (err) {
          console.error('❌ Delete failed:', err);
          showToast('error', 'Failed to delete records');
        }
      }
    );
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ========== UPLOADER ==========
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number } | null>(null);
  const [author, setAuthor] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    Array.from(newFiles).forEach(f => {
      if (f.type === 'application/json' || f.name.endsWith('.json')) {
        validFiles.push(f);
      } else {
        invalidNames.push(f.name);
      }
    });

    if (invalidNames.length > 0) {
      setUploadError(`Unsupported format: ${invalidNames.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setUploadError(null);
      setUploadStatus('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const simulateUpload = async () => {
    if (files.length === 0) return;
    setUploadStatus('uploading');
    setUploadError(null);
    setUploadProgress({ total: files.length, done: 0 });

    let successCount = 0;
    let failCount = 0;
    const failedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        console.log(`📤 [${i + 1}/${files.length}] Uploading: ${file.name}`);

        const res = await fetch('http://localhost:3001/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data, author: author.trim() || undefined }),
        });
        const result = await res.json();

        if (result.success) {
          successCount++;
          console.log(`   ✅ Success | ID: ${result.id}`);
        } else {
          failCount++;
          failedFiles.push(file.name);
          console.error(`   ❌ Failed:`, result.error);
        }
      } catch (err) {
        failCount++;
        failedFiles.push(file.name);
        console.error(`   ❌ Parse error:`, err);
      }
      setUploadProgress({ total: files.length, done: i + 1 });
    }

    console.log(`\n📊 Upload complete: ${successCount} success / ${failCount} failed`);
    setUploadStatus('success');
    setUploadProgress(null);

    // 显示上传结果
    if (failCount === 0) {
      showToast('success', `All ${successCount} file(s) uploaded successfully`);
    } else if (successCount === 0) {
      showToast('error', `All uploads failed. Check file format.`);
    } else {
      showToast('warning', `${successCount} succeeded, ${failCount} failed`);
    }

    // 上传成功后刷新共享数据
    if (successCount > 0) {
      fetchDBData();
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setUploadStatus('idle');
      setUploadError(null);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setUploadStatus('idle');
    setUploadError(null);
    setAuthor('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Toast Container */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastNotification key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant="danger"
      />

      {/* Password Dialog */}
      <PasswordDialog
        isOpen={passwordDialog.isOpen}
        title={passwordDialog.title}
        passwordType={passwordDialog.passwordType}
        onConfirm={passwordDialog.onConfirm}
        onCancel={() => setPasswordDialog(prev => ({ ...prev, isOpen: false }))}
      />

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
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'leaderboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Trophy size={16} />
              Leaderboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'uploader' ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-lg bg-slate-50/50 border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">JSON File Uploader</h2>
                  <p className="text-slate-500 text-sm mt-1">Drag & drop or select multiple JSON files</p>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
                    flex flex-col items-center justify-center gap-2 p-6
                    ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 hover:border-indigo-400 hover:bg-white'}
                    ${uploadStatus === 'success' ? 'border-emerald-500 bg-emerald-50/30' : ''}
                    ${uploadStatus === 'error' ? 'border-rose-500 bg-rose-50/30' : ''}
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)}
                    accept=".json"
                    multiple
                    className="hidden"
                  />

                  {uploadStatus === 'idle' && (
                    <div className="flex flex-col items-center text-slate-400">
                      <Upload size={28} className="mb-2 group-hover:text-indigo-500 transition-colors" />
                      <p className="text-sm font-medium">Drag & drop JSON files here</p>
                      <p className="text-xs text-slate-300 mt-1">Multiple selection supported</p>
                    </div>
                  )}

                  {uploadStatus === 'uploading' && uploadProgress && (
                    <div className="flex flex-col items-center text-indigo-600">
                      <Loader2 size={28} className="animate-spin mb-2" />
                      <p className="text-sm font-medium">Uploading...</p>
                      <p className="text-xs text-slate-400">{uploadProgress.done} / {uploadProgress.total}</p>
                    </div>
                  )}

                  {uploadStatus === 'success' && (
                    <div className="flex flex-col items-center text-emerald-600">
                      <CheckCircle2 size={28} className="mb-2" />
                      <p className="text-sm font-semibold">Upload Complete</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearAllFiles(); }}
                        className="mt-1 text-xs text-slate-400 hover:text-indigo-600"
                      >
                        Clear & upload more
                      </button>
                    </div>
                  )}
                </div>

                {/* Author Input */}
                {files.length > 0 && uploadStatus === 'idle' && (
                  <div className="mt-4">
                    <label className="block text-xs text-slate-500 mb-1.5">Author (optional)</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter author name..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* File List */}
                {files.length > 0 && uploadStatus === 'idle' && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs text-slate-500">{files.length} file(s) selected</span>
                      <button
                        onClick={clearAllFiles}
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        Clear all
                      </button>
                    </div>
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileJson size={16} className="text-indigo-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{f.name}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {(f.size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <button
                  disabled={files.length === 0 || uploadStatus !== 'idle'}
                  onClick={simulateUpload}
                  className={`w-full mt-6 py-4 rounded-2xl font-bold text-white transition-all ${
                    files.length === 0 || uploadStatus !== 'idle'
                      ? 'bg-slate-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                  }`}
                >
                  {uploadStatus === 'uploading'
                    ? `Uploading (${uploadProgress?.done}/${uploadProgress?.total})...`
                    : files.length > 0 ? `Upload ${files.length} file(s)` : 'Upload'
                  }
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
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Task Core Grid</h2>
                      <p className="text-slate-500 text-sm">Real-time unit status visualization</p>
                    </div>
                    <button
                      onClick={fetchDBData}
                      disabled={isDBLoading}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 disabled:opacity-50"
                      title="Sync with database"
                    >
                      <RefreshCw size={18} className={isDBLoading ? 'animate-spin' : ''} />
                    </button>
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
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))' }}>
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
                          <span className="
                            absolute inset-0 bg-white/90 backdrop-blur-sm
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          " />
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

                  {/* Progress Bar */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-indigo-500 uppercase tracking-widest">Progress</p>
                      <p className="text-sm font-bold text-indigo-600">
                        {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
                      </p>
                    </div>
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      />
                    </div>
                  </div>

                  {selectedTask ? (
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">IMG_{selectedTask.img_name}</span>
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
                      <p className="text-[10px] text-slate-400">Select a unit to view details</p>
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
                    onClick={fetchDBData}
                    disabled={isDBLoading}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={isDBLoading ? 'animate-spin' : ''} />
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
                {isDBLoading ? (
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
                          <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filename</th>
                          <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Author</th>
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
                              <td className="p-4">
                                <span className="text-sm text-slate-600 font-mono">{record.filename || '-'}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-600">{record.author || '-'}</span>
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
          ) : activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-200 mb-4">
                  <Trophy size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Author Leaderboard</h2>
                <p className="text-slate-500 text-sm mt-1">Top contributors by upload count</p>
              </div>

              {/* Leaderboard Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl overflow-hidden">
                {authorLeaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Trophy size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold">No data yet</p>
                    <p className="text-sm mt-1">Upload some files to see the leaderboard</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {authorLeaderboard.map((entry, index) => (
                      <motion.div
                        key={entry.author}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 hover:bg-white/60 transition-colors ${
                          index === 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50' :
                          index === 1 ? 'bg-gradient-to-r from-slate-50 to-slate-100' :
                          index === 2 ? 'bg-gradient-to-r from-orange-50/50 to-amber-50/50' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-200' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-200' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {index === 0 ? <Crown size={20} /> :
                           index === 1 ? <Medal size={20} /> :
                           index === 2 ? <Medal size={20} /> :
                           <span className="text-sm font-bold">{index + 1}</span>}
                        </div>

                        {/* Author Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            index === 0 ? 'text-amber-700' :
                            index === 1 ? 'text-slate-600' :
                            index === 2 ? 'text-amber-600' :
                            'text-slate-700'
                          }`}>
                            {entry.author}
                          </p>
                          <p className="text-xs text-slate-400">
                            {entry.count} upload{entry.count !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Upload Count Badge */}
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-slate-100 text-slate-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {entry.count}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              {authorLeaderboard.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Total Authors</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {new Set(records.map(r => r.author?.trim() || 'Anonymous')).size}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-amber-500 uppercase tracking-widest mb-1">Top Author</p>
                    <p className="text-lg font-bold text-amber-600 truncate">
                      {authorLeaderboard[0]?.author || '-'}
                    </p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-indigo-500 uppercase tracking-widest mb-1">Total Uploads</p>
                    <p className="text-2xl font-bold text-indigo-600">{records.length}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
