import React, { useState } from 'react';
import { CheckSquare, Square, UserPlus, Calendar, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { InvestigationTask, User } from '../../types';
import { Badge } from '../common/Badge';

interface InvestigationBoxProps {
  exceptionId: string;
  status: string;
  investigation: any;
  tasks: InvestigationTask[];
  users: User[];
  onStartInvestigation: (data: {
    assignedToId: string;
    priority: string;
    dueDate?: string;
    reason?: string;
    notes?: string;
  }) => Promise<void>;
  onToggleTask?: (taskId: string, isCompleted: boolean, notes?: string) => Promise<void>;
  onUpdateTask?: (taskId: string, updateData: { isCompleted?: boolean; status?: string; notes?: string; description?: string; dueDate?: string }) => Promise<void>;
  onAddTask: (data: any, assignedToId?: string) => Promise<void>;
  onOpenResolutionModal: () => void;
}

export const InvestigationBox: React.FC<InvestigationBoxProps> = ({
  exceptionId,
  status,
  investigation,
  tasks,
  users,
  onStartInvestigation,
  onToggleTask,
  onUpdateTask,
  onAddTask,
  onOpenResolutionModal,
}) => {
  const [showStartForm, setShowStartForm] = useState(false);
  const [assignedToId, setAssignedToId] = useState(users[0]?.id || '');
  const [priority, setPriority] = useState('HIGH');
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('Variance between physical verification and ledger requires root-cause audit.');
  const [notes, setNotes] = useState('');

  // Add Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showTaskOptions, setShowTaskOptions] = useState(false);

  // Inline note editing state
  const [editingNoteTaskId, setEditingNoteTaskId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId) return;
    setSubmitting(true);
    try {
      await onStartInvestigation({
        assignedToId,
        priority,
        dueDate: dueDate || undefined,
        reason,
        notes,
      });
      setShowStartForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await onAddTask({
      title: newTaskTitle.trim(),
      assignedToId: newTaskAssignee || assignedToId || undefined,
      dueDate: newTaskDueDate || undefined,
      description: newTaskDescription.trim() || undefined,
    }, newTaskAssignee || assignedToId || undefined);

    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setShowTaskOptions(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    const isCompleted = newStatus === 'COMPLETED';
    if (onUpdateTask) {
      await onUpdateTask(taskId, { status: newStatus, isCompleted });
    } else if (onToggleTask) {
      await onToggleTask(taskId, isCompleted);
    }
  };

  const handleToggle = async (task: InvestigationTask) => {
    const willComplete = !task.isCompleted;
    const newStatus = willComplete ? 'COMPLETED' : 'TODO';
    if (onUpdateTask) {
      await onUpdateTask(task.id, { isCompleted: willComplete, status: newStatus });
    } else if (onToggleTask) {
      await onToggleTask(task.id, willComplete, task.notes);
    }
  };

  const handleSaveNote = async (taskId: string) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, { notes: tempNoteText });
    } else if (onToggleTask) {
      const task = tasks.find((t) => t.id === taskId);
      await onToggleTask(taskId, task?.isCompleted || false, tempNoteText);
    }
    setEditingNoteTaskId(null);
    setTempNoteText('');
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const isAllCompleted = tasks.length > 0 && completedCount === tasks.length;
  const isInvestigating = status === 'INVESTIGATING' || status === 'ACTION_REQUIRED';
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Investigation & Verification Checklist
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical root-cause discovery tasks assigned to warehouse personnel
          </p>
        </div>

        {/* Action Trigger */}
        {!isInvestigating && !isResolved && (
          <button
            onClick={() => setShowStartForm(!showStartForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Start Investigation</span>
          </button>
        )}

        {isInvestigating && (
          <button
            onClick={onOpenResolutionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolve & Determine Root Cause</span>
          </button>
        )}
      </div>

      {/* Start Investigation Form */}
      {showStartForm && (
        <form onSubmit={handleStart} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 animate-fadeIn">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Assign Investigation Lead
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Investigator</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'INVENTORY_MANAGER' ? 'Manager' : 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Investigation Scope / Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Initial Instructions / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Inspect adjacent Rack B and check recent transfer manifests..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowStartForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {submitting ? 'Starting...' : 'Confirm & Launch Investigation'}
            </button>
          </div>
        </form>
      )}

      {/* Active Investigation Lead Metadata Bar */}
      {investigation && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Lead Investigator:</span>
            <span className="font-bold text-slate-900">{investigation.assignedTo?.name || 'Unassigned'}</span>
            <Badge variant="high">{investigation.priority} PRIORITY</Badge>
          </div>
          {investigation.dueDate && (
            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Due: {new Date(investigation.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Task Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500">
            Action Tasks ({completedCount} / {tasks.length} Completed)
          </span>
          <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task) => {
            const currentStatus = task.status || (task.isCompleted ? 'COMPLETED' : 'TODO');
            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  task.isCompleted ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-left flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(task)}
                      disabled={isResolved}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 disabled:opacity-50"
                      title={task.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {task.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold ${
                            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.assignedTo && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {task.assignedTo.name}
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          {task.description}
                        </p>
                      )}

                      {task.notes && (
                        <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-slate-700">
                          <span className="font-semibold text-amber-800">Finding:</span> "{task.notes}"
                        </div>
                      )}

                      {/* Inline Note Editor */}
                      {editingNoteTaskId === task.id ? (
                        <div className="mt-2 space-y-1.5">
                          <textarea
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="Record physical inspection findings (e.g. checked adjacent shelf, counting variance confirmed)..."
                            rows={2}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveNote(task.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                            >
                              Save Finding
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteTaskId(null)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        !isResolved && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteTaskId(task.id);
                              setTempNoteText(task.notes || '');
                            }}
                            className="mt-1.5 text-[10px] text-slate-500 hover:text-emerald-700 font-semibold block transition-colors"
                          >
                            {task.notes ? 'Edit Findings Note' : '+ Add Inspection Note'}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                      disabled={isResolved}
                      className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                        currentStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : currentStatus === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom task */}
        {!isResolved && (
          <form onSubmit={handleCreateTask} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="+ Add another investigation task (e.g. Inspect quarantined pallets)..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowTaskOptions(!showTaskOptions)}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs text-slate-600 font-medium"
              >
                {showTaskOptions ? 'Less Options' : '+ Details'}
              </button>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                Add Task
              </button>
            </div>

            {showTaskOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-200 animate-fadeIn text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Default (Lead Investigator)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Description</label>
                  <input
                    type="text"
                    placeholder="Specific instructions..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
