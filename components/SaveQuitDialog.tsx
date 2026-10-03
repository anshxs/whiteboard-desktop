'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function SaveQuitDialog({ open, saving, intent, onCancel, onSaveAndContinue, onDiscardAndContinue }: {
  open: boolean;
  saving: boolean;
  intent: 'back' | 'quit';
  onCancel: () => void;
  onSaveAndContinue: () => void;
  onDiscardAndContinue: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next && !saving) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{intent === 'quit' ? 'Save and quit?' : 'Save before going back?'}</AlertDialogTitle>
          <AlertDialogDescription>{intent === 'quit' ? 'This project has unsaved changes. Save them before quitting, or quit and discard them.' : 'There are unsaved changes in this project.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={onSaveAndContinue} disabled={saving}>
            {saving ? 'Saving…' : intent === 'quit' ? 'Save and quit' : 'Save and go back'}
          </Button>
          {intent === 'quit' && <Button type="button" variant="destructive" onClick={onDiscardAndContinue} disabled={saving}>Quit without saving</Button>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
