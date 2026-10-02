'use client';

import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function FirstRunSetup() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [notesPath, setNotesPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!window.desktop) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    window.desktop.getSettings()
      .then((settings) => setOpen(!settings?.userName || !settings?.notesPath))
      .catch(() => {
        setError('Could not load your settings. Please restart the app and try again.');
        setOpen(true);
      })
      .finally(() => setLoading(false));
  }, []);

  async function chooseFolder() {
    setError('');
    try {
      const folder = await window.desktop?.chooseNotesFolder();
      if (folder) setNotesPath(folder);
    } catch {
      setError('Could not open the folder picker. Please try again.');
    }
  }

  async function saveSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = userName.trim();
    if (!name || !notesPath || !window.desktop) return;

    setSaving(true);
    setError('');
    try {
      await window.desktop.saveSettings({ userName: name, notesPath });
      setOpen(false);
    } catch {
      setError('Could not save your setup. Check the folder and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={!loading && open}>
      <AlertDialogContent>
        <form onSubmit={saveSetup} className="grid gap-5">
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome to Whiteboard</AlertDialogTitle>
            <AlertDialogDescription>
              Set up your profile and choose where Whiteboard should keep your notes.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="grid gap-2 text-sm font-medium">
            Your name
            <input
              autoFocus
              required
              maxLength={80}
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="e.g. Alex"
              className="h-10 rounded-xl bg-secondary px-3 text-foreground outline-none"
            />
          </label>

          <div className="grid gap-2 text-sm font-medium">
            Notes folder
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3 py-2.5 font-normal text-muted-foreground" title={notesPath}>
                {notesPath || 'No folder selected'}
              </div>
              <Button className="h-10 rounded-xl" type="button" variant="outline" onClick={chooseFolder} aria-label="Choose notes folder">
                <FolderOpen />
                Browse
              </Button>
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <AlertDialogAction type="submit" disabled={saving || !userName.trim() || !notesPath || !window.desktop}>
              {saving ? 'Saving…' : 'Get started'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
