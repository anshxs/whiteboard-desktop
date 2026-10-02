"use client";

type Block = { type?: string; data?: Record<string, unknown> };

function blockText(block: Block): string {
  const data = block.data ?? {};
  if (typeof data.text === "string") return data.text.replace(/<[^>]*>/g, "");
  if (typeof data.title === "string") return data.title;
  if (Array.isArray(data.items))
    return data.items
      .map((item) => (typeof item === "string" ? item : ""))
      .join(" · ");
  return "";
}

export default function ProjectCardPreview({
  projectName,
  preview,
}: {
  projectName: string;
  preview: {
    document: { blocks: Array<Record<string, unknown>> };
    canvas: { elements: Array<Record<string, unknown>> };
  };
}) {
  const blocks = preview.document?.blocks ?? [];
  const visibleBlocks = blocks.slice(0, 5).map((value) => value as Block);
  const elements = preview.canvas?.elements ?? [];
  const shapes = elements.slice(0, 8).map((element, index) => {
    const x = Number(element.x ?? 30 + (index % 4) * 55);
    const y = Number(element.y ?? 24 + Math.floor(index / 4) * 50);
    const width = Math.max(24, Math.min(82, Number(element.width ?? 50)));
    const height = Math.max(16, Math.min(52, Number(element.height ?? 32)));
    const stroke =
      typeof element.strokeColor === "string" ? element.strokeColor : "#818cf8";
    const type = element.type;
    return {
      x: 16 + (Math.abs(x) % 170),
      y: 10 + (Math.abs(y) % 96),
      width,
      height,
      stroke,
      type,
      key: String(element.id ?? index),
    };
  });

  const markup = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:16px;background:#f8f9fc;color:#334155;font:12px ui-sans-serif,system-ui,sans-serif;overflow:hidden}
    .page{height:150px;max-width:520px;margin:auto;padding:14px 20px;background:white;border:1px solid #e8ebf2;border-radius:8px;box-shadow:0 4px 18px #1725540d;overflow:hidden}
    h1{font-size:13px;margin:0 0 8px;color:#1e293b}.line{height:4px;margin:6px 0;border-radius:4px;background:#e5eaf2;width:92%}.line.short{width:55%}.drawing{position:absolute;inset:18px 20px}.shape{position:absolute;border:1.5px solid;border-radius:5px;background:#eef2ff66}.diamond{transform:rotate(45deg);border-radius:2px}.ellipse{border-radius:50%}.label{position:absolute;left:8px;bottom:7px;color:#94a3b8;font-size:9px}
  </style></head><body><div class="page"><h1>${projectName.replace(/[<>&"']/g, "")}</h1>${visibleBlocks.length ? visibleBlocks.map((block) => `<div class="line ${block.type === "header" ? "" : "short"}" title="${blockText(block).replace(/[<>&"']/g, "")}"></div>`).join("") : '<div class="line"></div><div class="line short"></div><div class="line"></div>'}</div><div class="drawing">${shapes.map((shape) => `<div class="shape ${shape.type === "ellipse" ? "ellipse" : shape.type === "diamond" ? "diamond" : ""}" style="left:${shape.x}px;top:${shape.y}px;width:${shape.width}px;height:${shape.height}px;border-color:${shape.stroke}"></div>`).join("")}</div><div class="label">DOCUMENT  ·  CANVAS</div></body></html>`;

  return (
    <iframe
      title={`${projectName} project preview`}
      srcDoc={markup}
      sandbox=""
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full border-0"
    />
  );
}
