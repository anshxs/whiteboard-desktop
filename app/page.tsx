"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  Clock3,
  FilePlus2,
  FolderOpen,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import FirstRunSetup from "@/components/FirstRunSetup";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProjectWorkspace = dynamic(
  () => import("@/components/ProjectWorkspace"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    ),
  },
);

type Settings = { userName: string; notesPath: string };
type ProjectListItem = {
  path: string;
  name: string;
  updatedAt: string;
  preview: {
    document: WBoardProject["document"];
    canvas: WBoardProject["canvas"];
  };
};

export default function WhiteboardApp() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [project, setProject] = useState<WBoardProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(
    null,
  );
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [quitDialogOpen, setQuitDialogOpen] = useState(false);

  const refreshProjects = useCallback(async (folder: string) => {
    if (window.desktop) setProjects(await window.desktop.listProjects(folder));
  }, []);

  useEffect(() => {
    if (!window.desktop) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    window.desktop
      .getSettings()
      .then(async (saved) => {
        setSettings(saved);
        if (saved?.notesPath) await refreshProjects(saved.notesPath);
      })
      .catch(() => setError("Could not load app settings."))
      .finally(() => setLoading(false));
  }, [refreshProjects]);

  useEffect(() => {
    if (!window.desktop || project) return;
    return window.desktop.onQuitRequest(() => setQuitDialogOpen(true));
  }, [project]);

  const filteredProjects = projects.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const duplicateProjectName = projectName.trim().length > 0 && projects.some(
    (item) => item.name.trim().toLocaleLowerCase() === projectName.trim().toLocaleLowerCase(),
  );

  async function openProject(filePath: string) {
    setError("");
    try {
      setProject(await window.desktop!.openProject(filePath));
    } catch {
      setError(
        "Could not open this project. It may be damaged or unsupported.",
      );
    }
  }

  async function importProject() {
    setError("");
    try {
      const filePath = await window.desktop?.chooseProjectFile();
      if (filePath) setProject(await window.desktop!.openProject(filePath));
    } catch {
      setError("Could not import that .wboard project.");
    }
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings?.notesPath || !projectName.trim() || duplicateProjectName || !window.desktop) return;
    setError("");
    try {
      const created = await window.desktop.createProject({
        folder: settings.notesPath,
        name: projectName.trim(),
      });
      setProject(created);
      setProjectName("");
      setCreateOpen(false);
      await refreshProjects(settings.notesPath);
    } catch {
      setError(
        "Could not create this project. Check that the notes folder is available.",
      );
    }
  }

  async function deleteProject() {
    if (!deleteTarget || deleteText !== deleteTarget.name || !window.desktop)
      return;
    setDeleting(true);
    setError("");
    try {
      await window.desktop.deleteProject({
        filePath: deleteTarget.path,
        projectName: deleteTarget.name,
      });
      setDeleteTarget(null);
      setDeleteText("");
      if (settings?.notesPath) await refreshProjects(settings.notesPath);
    } catch {
      setError("Could not delete this project.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f9fc] text-sm text-muted-foreground">
        Starting Whiteboard…
      </main>
    );

  return (
    <main className="relative flex h-screen min-h-[560px] flex-col overflow-hidden bg-white pt-9 text-slate-950">
      <div aria-hidden="true" className="electron-drag-region absolute inset-x-0 top-0 z-10 h-9" />
      <AlertDialog open={quitDialogOpen} onOpenChange={setQuitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quit Whiteboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to quit the app?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setQuitDialogOpen(false)}>
              Cancel
            </Button>
            <AlertDialogAction onClick={() => window.desktop?.confirmQuit()}>
              Quit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <FirstRunSetup
        key={settingsOpen ? "settings-open" : "settings-closed"}
        initialSettings={settings}
        forceOpen={settingsOpen}
        onDismiss={() => setSettingsOpen(false)}
        onComplete={(saved) => {
          const folderChanged = settings?.notesPath !== saved.notesPath;
          setSettings(saved);
          if (folderChanged)
            refreshProjects(saved.notesPath).catch(() =>
              setError("Could not read your notes folder."),
            );
        }}
      />
      {project ? (
        <ProjectWorkspace
          project={project}
          onBack={() => {
            setProject(null);
            if (settings?.notesPath)
              refreshProjects(settings.notesPath).catch(() => {});
          }}
        />
      ) : (
        <>
          <header className="flex h-[72px] shrink-0 items-center justify-between bg-white px-8">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Whiteboard logo"
                width={48}
                height={48}
              />
              <h1 className="text-[18px] font-bold tracking-tight">
                WHITEBOARD
              </h1>
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl border-slate-200"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings2 className="mr-1.5 size-4" />
              Settings
            </Button>
          </header>
          <section className="flex w-full flex-1 flex-col overflow-auto bg-white px-8 py-10">
            <div className="mb-8">
              <div className="text-sm text-black">
                {settings
                  ? `Hi, ${settings.userName}`
                  : "Desktop app setup required"}
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Your projects
              </h2>
            </div>
            <div className="mb-7 flex items-center gap-3">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your projects"
                  className="h-10 w-full rounded-xl bg-secondary pl-10 pr-3 text-sm outline-none"
                />
              </label>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-slate-200 bg-white"
                  onClick={importProject}
                >
                  <FolderOpen className="mr-1" />
                  Import
                </Button>
                <Button
                  className="h-10 rounded-xl bg-black px-4 text-white"
                  disabled={!settings}
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-1" />
                  Create
                </Button>
              </div>
            </div>
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {filteredProjects.length ? (
              <div className="overflow-scroll scrollbar-none rounded-2xl bg-secondary">
                {filteredProjects.map((item) => (
                  <div
                    key={item.path}
                    className="group flex min-h-16 items-center gap-4 px-4 py-3 last:border-b-0 hover:bg-black/5"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openProject(item.path)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openProject(item.path);
                        }
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                    >
                      <h3 className="truncate font-medium text-slate-900">{item.name}</h3>
                      <p className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 className="size-3.5" />
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0 rounded-lg bg-white text-slate-500 hover:text-red-600"
                      aria-label={`Delete ${item.name}`}
                      title="Delete project"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(item);
                        setDeleteText("");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid flex-1 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-black/10 text-black">
                    <FilePlus2 className="size-6" />
                  </div>
                  <h3 className="font-semibold">
                    {search ? "No matching projects" : "No projects yet"}
                  </h3>
                  {!search && (
                    <Button
                      className="mt-5 rounded-2xl bg-black px-4 py-5 text-white hover:bg-gray-800"
                      disabled={!settings}
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="mr-1" />
                      Create your first project
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>
          {createOpen && (
            <div
              className="fixed inset-0 z-40 grid place-items-center bg-slate-950/30 p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setCreateOpen(false);
              }}
            >
              <form
                onSubmit={createProject}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              >
                <h3 className="text-lg font-semibold">Create a project</h3>
                <p className="mt-1 text-sm text-slate-500">
                  A .wboard file will be created in your notes folder.
                </p>
                <label className="mt-5 grid gap-2 text-sm font-medium">
                  Project name
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="Untitled project"
                    aria-invalid={duplicateProjectName}
                    className="h-10 rounded-xl bg-secondary px-3 outline-none"
                  />
                  {duplicateProjectName && (
                    <span role="alert" className="text-xs text-destructive">
                      A project with this name already exists.
                    </span>
                  )}
                </label>
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!projectName.trim() || duplicateProjectName}
                    className="rounded-xl bg-black text-white hover:bg-gray-800"
                  >
                    Create project
                  </Button>
                </div>
              </form>
            </div>
          )}
          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open && !deleting) {
                setDeleteTarget(null);
                setDeleteText("");
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the project file. Type{" "}
                  <strong>{deleteTarget?.name}</strong> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="grid gap-2 text-sm font-medium">
                Project name
                <input
                  autoFocus
                  value={deleteText}
                  onChange={(event) => setDeleteText(event.target.value)}
                  className="h-10 rounded-xl bg-secondary px-3 outline-none"
                />
              </label>
              <AlertDialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteText("");
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={deleting || deleteText !== deleteTarget?.name}
                  onClick={() => void deleteProject()}
                >
                  {deleting ? "Deleting…" : "Delete project"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </main>
  );
}
