declare module '@editorjs/marker' {
  import type { InlineTool } from '@editorjs/editorjs';
  const Marker: InlineTool;
  export default Marker;
}

declare module '@editorjs/checklist' {
  import type { BlockToolConstructable } from '@editorjs/editorjs';
  const Checklist: BlockToolConstructable;
  export default Checklist;
}
