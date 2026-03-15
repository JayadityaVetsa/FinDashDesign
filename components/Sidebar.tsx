"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  PenLine,
  Check,
  X,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Dashboard } from "@/lib/storage";

type SidebarProps = {
  dashboards: Dashboard[];
  activeDashboardId: string;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void; // Now accepts a name
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export default function Sidebar({
  dashboards,
  activeDashboardId,
  collapsed,
  onToggle,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus rename input
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Auto-focus new dashboard input
  useEffect(() => {
    if (showNewInput && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [showNewInput]);

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (id: string) => {
    if (dashboards.length <= 1) return; // Must keep at least 1
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleCreateSubmit = () => {
    const name = newName.trim() || "Untitled Dashboard";
    onCreate(name);
    setNewName("");
    setShowNewInput(false);
  };

  const handleNewDashboardClick = () => {
    if (collapsed) {
      // When collapsed, just open a new dashboard with a default name
      onCreate("Untitled Dashboard");
    } else {
      setShowNewInput(true);
    }
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] transition-all duration-300 ease-in-out ${
        collapsed ? "w-12" : "w-60"
      }`}
      style={{ minHeight: "calc(100vh - 52px)" }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Collapsed state — icon strip */}
      {collapsed && (
        <div className="flex flex-col items-center gap-1 pt-10 px-1">
          {dashboards.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                d.id === activeDashboardId
                  ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)]"
              }`}
              title={d.name}
            >
              {d.name.charAt(0).toUpperCase()}
            </button>
          ))}
          {/* Plus icon always visible in collapsed mode */}
          <button
            onClick={handleNewDashboardClick}
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--accent-blue)]"
            title="New Dashboard"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Expanded state */}
      {!collapsed && (
        <>
          {/* Section header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Dashboards
              </span>
            </div>
            {/* Plus icon always visible in expanded mode header */}
            <button
              onClick={handleNewDashboardClick}
              className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--accent-blue)]"
              title="New Dashboard"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Dashboard list */}
          <nav className="flex-1 overflow-y-auto px-2">
            {dashboards.map((d) => {
              const isActive = d.id === activeDashboardId;
              const isEditing = editingId === d.id;
              const isConfirmingDelete = confirmDeleteId === d.id;

              return (
                <div
                  key={d.id}
                  className={`group mb-0.5 flex items-center rounded-lg px-2 py-1.5 transition-colors ${
                    isActive
                      ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isEditing ? (
                    /* Rename input */
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        ref={inputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") cancelRename();
                        }}
                        onBlur={commitRename}
                        className="flex-1 rounded bg-[var(--bg-primary)] px-1.5 py-0.5 text-xs outline-none ring-1 ring-[var(--accent-blue)]"
                        maxLength={30}
                      />
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={commitRename}
                        className="p-0.5 text-[var(--accent-green)]"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={cancelRename}
                        className="p-0.5 text-[var(--accent-red)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    /* Normal display */
                    <>
                      <button
                        onClick={() => onSelect(d.id)}
                        className="flex-1 truncate text-left text-xs font-medium"
                      >
                        {d.name}
                      </button>

                      {/* Action buttons (visible on hover) */}
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(d.id, d.name);
                          }}
                          className="rounded p-1 hover:bg-[var(--bg-secondary)]"
                          title="Rename"
                        >
                          <PenLine className="h-3 w-3" />
                        </button>
                        {dashboards.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(d.id);
                            }}
                            className={`rounded p-1 transition-colors ${
                              isConfirmingDelete
                                ? "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
                                : "hover:bg-[var(--accent-red)]/10 hover:text-[var(--accent-red)]"
                            }`}
                            title={
                              isConfirmingDelete
                                ? "Click again to confirm"
                                : "Delete"
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            
            {/* New Dashboard input - right below the list */}
            {showNewInput && (
              <div className="mb-0.5 flex items-center gap-1 rounded-lg px-2 py-1.5">
                <input
                  ref={newInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSubmit();
                    if (e.key === "Escape") {
                      setShowNewInput(false);
                      setNewName("");
                    }
                  }}
                  onBlur={() => {
                    if (!newName.trim()) {
                      setShowNewInput(false);
                      setNewName("");
                    }
                  }}
                  className="flex-1 rounded bg-[var(--bg-primary)] px-1.5 py-0.5 text-xs outline-none ring-1 ring-[var(--accent-blue)]"
                  placeholder="Dashboard name..."
                  maxLength={30}
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreateSubmit}
                  className="p-0.5 text-[var(--accent-green)]"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowNewInput(false);
                    setNewName("");
                  }}
                  className="p-0.5 text-[var(--accent-red)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </nav>
        </>
      )}
    </aside>
  );
}
