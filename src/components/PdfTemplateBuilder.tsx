import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2, Type, FileText, Image, Table2, PenTool, Save, Eye, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

type BlockType = "title" | "content" | "image" | "table" | "signature" | "divider" | "spacer";

interface Block {
  id: string;
  type: BlockType;
  label: string;
  config: Record<string, string>;
}

const BLOCK_PALETTE: { type: BlockType; icon: React.ReactNode; label: string }[] = [
  { type: "title", icon: <Type className="w-4 h-4" />, label: "Titel" },
  { type: "content", icon: <FileText className="w-4 h-4" />, label: "Text" },
  { type: "image", icon: <Image className="w-4 h-4" />, label: "Bild" },
  { type: "table", icon: <Table2 className="w-4 h-4" />, label: "Tabelle" },
  { type: "signature", icon: <PenTool className="w-4 h-4" />, label: "Unterschrift" },
  { type: "divider", icon: <span className="text-xs">—</span>, label: "Trennlinie" },
  { type: "spacer", icon: <span className="text-xs">↕</span>, label: "Abstand" },
];

const defaultConfig: Record<BlockType, Record<string, string>> = {
  title: { text: "Titel", fontSize: "24", align: "left" },
  content: { text: "Inhalt hier...", fontSize: "12" },
  image: { src: "", width: "100", caption: "" },
  table: { rows: "3", cols: "3", header: "true" },
  signature: { label: "Unterschrift", showDate: "true", showLine: "true" },
  divider: { style: "solid", color: "#e5e5e5" },
  spacer: { height: "20" },
};

export default function PdfTemplateBuilder() {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("report");
  const [brandKit, setBrandKit] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "title", label: "Titel", config: { ...defaultConfig.title } },
    { id: "2", type: "content", label: "Text", config: { ...defaultConfig.content } },
  ]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Brand colors from profile
  const brandColors = {
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#f59e0b",
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      label: BLOCK_PALETTE.find(b => b.type === type)?.label || type,
      config: { ...defaultConfig[type] },
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (direction === "up" && idx > 0) {
        const arr = [...prev];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        return arr;
      }
      if (direction === "down" && idx < prev.length - 1) {
        const arr = [...prev];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        return arr;
      }
      return prev;
    });
  };

  const updateBlockConfig = (id: string, key: string, value: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, config: { ...b.config, [key]: value } } : b));
  };

  const generateTemplateHtml = useCallback(() => {
    const font = brandKit ? "'Segoe UI', sans-serif" : "Arial, sans-serif";
    const primary = brandKit ? brandColors.primary : "#000";

    const blocksHtml = blocks.map(block => {
      switch (block.type) {
        case "title":
          return `<h1 style="font-size:${block.config.fontSize}px;text-align:${block.config.align};color:${primary};margin:16px 0 8px">${block.config.text}</h1>`;
        case "content":
          return `<p style="font-size:${block.config.fontSize}px;line-height:1.6;margin:8px 0">${block.config.text}</p>`;
        case "image":
          return `<div style="text-align:center;margin:12px 0"><img src="${block.config.src || 'placeholder.png'}" style="max-width:${block.config.width}%" />${block.config.caption ? `<p style="font-size:10px;color:#999">${block.config.caption}</p>` : ""}</div>`;
        case "table":
          const rows = parseInt(block.config.rows) || 3;
          const cols = parseInt(block.config.cols) || 3;
          let table = '<table style="width:100%;border-collapse:collapse;margin:12px 0">';
          for (let r = 0; r < rows; r++) {
            table += "<tr>";
            for (let c = 0; c < cols; c++) {
              const tag = r === 0 && block.config.header === "true" ? "th" : "td";
              table += `<${tag} style="border:1px solid #ddd;padding:8px;font-size:11px">${r === 0 ? `Spalte ${c + 1}` : ""}</${tag}>`;
            }
            table += "</tr>";
          }
          table += "</table>";
          return table;
        case "signature":
          return `<div style="margin-top:40px"><div style="width:200px;border-top:${block.config.showLine === "true" ? "1px solid #333" : "none"};padding-top:4px"><p style="font-size:10px;margin:0">${block.config.label}</p>${block.config.showDate === "true" ? '<p style="font-size:9px;color:#999;margin:2px 0">Datum: __________</p>' : ""}</div></div>`;
        case "divider":
          return `<hr style="border:none;border-top:1px ${block.config.style} ${block.config.color};margin:16px 0" />`;
        case "spacer":
          return `<div style="height:${block.config.height}px"></div>`;
        default:
          return "";
      }
    }).join("\n");

    return `<!DOCTYPE html><html><head><style>body{font-family:${font};max-width:700px;margin:0 auto;padding:40px 30px;color:#1a1a1a}</style></head><body>${blocksHtml}</body></html>`;
  }, [blocks, brandKit, brandColors]);

  const saveTemplate = async () => {
    if (!name.trim()) { toast.error("Bitte Vorlagenname eingeben"); return; }
    if (!user) return;
    setSaving(true);
    try {
      const html = generateTemplateHtml();
      const { error } = await supabase.from("pdf_templates").insert({
        name: name.trim(),
        description: description.trim() || null,
        category,
        template_html: html,
        brand_kit_compatible: brandKit,
        is_system: false,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Vorlage gespeichert!");
      setName("");
      setDescription("");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const selected = blocks.find(b => b.id === selectedBlock);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Vorlagenname</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Meine Vorlage" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Kategorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="guide">Guide</SelectItem>
              <SelectItem value="notes">Meeting Notes</SelectItem>
              <SelectItem value="invoice">Kostenvoranschlag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Beschreibung</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Wofür ist diese Vorlage?" className="mt-1 text-sm min-h-[60px]" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Brand Kit Auto-Apply</Label>
          <p className="text-[10px] text-muted-foreground">Farben, Fonts und Logo automatisch</p>
        </div>
        <Switch checked={brandKit} onCheckedChange={setBrandKit} />
      </div>

      {/* Builder Area */}
      <div className="grid grid-cols-[1fr_200px] gap-3 min-h-[300px]">
        {/* Canvas */}
        <Card className="p-3 overflow-hidden">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium">Blöcke (Reihenfolge = Layout)</p>
          <ScrollArea className="h-[280px]">
            <div className="space-y-1.5">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlock(block.id)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer text-xs transition-all",
                    selectedBlock === block.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                  )}
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="shrink-0">{BLOCK_PALETTE.find(p => p.type === block.type)?.icon}</span>
                  <span className="flex-1 truncate font-medium">{block.label}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, "up"); }} className="p-0.5 hover:bg-muted rounded" disabled={idx === 0}>↑</button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, "down"); }} className="p-0.5 hover:bg-muted rounded" disabled={idx === blocks.length - 1}>↓</button>
                    <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="p-0.5 hover:bg-destructive/20 text-destructive rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Sidebar: Block palette + config */}
        <div className="space-y-3">
          <Card className="p-2">
            <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Block hinzufügen</p>
            <div className="grid grid-cols-2 gap-1">
              {BLOCK_PALETTE.map(bp => (
                <button
                  key={bp.type}
                  onClick={() => addBlock(bp.type)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-border hover:border-primary/50 hover:bg-accent text-[10px] transition-all"
                >
                  {bp.icon}
                  <span>{bp.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {selected && (
            <Card className="p-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Einstellungen: {selected.label}</p>
              <div className="space-y-2">
                {selected.type === "title" && (
                  <>
                    <Input value={selected.config.text} onChange={e => updateBlockConfig(selected.id, "text", e.target.value)} className="h-7 text-xs" placeholder="Titel" />
                    <Select value={selected.config.fontSize} onValueChange={v => updateBlockConfig(selected.id, "fontSize", v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18">18px</SelectItem>
                        <SelectItem value="24">24px</SelectItem>
                        <SelectItem value="32">32px</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selected.config.align} onValueChange={v => updateBlockConfig(selected.id, "align", v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Links</SelectItem>
                        <SelectItem value="center">Zentriert</SelectItem>
                        <SelectItem value="right">Rechts</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {selected.type === "content" && (
                  <>
                    <Textarea value={selected.config.text} onChange={e => updateBlockConfig(selected.id, "text", e.target.value)} className="text-xs min-h-[60px]" />
                    <Select value={selected.config.fontSize} onValueChange={v => updateBlockConfig(selected.id, "fontSize", v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10px</SelectItem>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {selected.type === "table" && (
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <Label className="text-[9px]">Zeilen</Label>
                      <Input type="number" min="1" max="20" value={selected.config.rows} onChange={e => updateBlockConfig(selected.id, "rows", e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[9px]">Spalten</Label>
                      <Input type="number" min="1" max="10" value={selected.config.cols} onChange={e => updateBlockConfig(selected.id, "cols", e.target.value)} className="h-7 text-xs" />
                    </div>
                  </div>
                )}
                {selected.type === "signature" && (
                  <Input value={selected.config.label} onChange={e => updateBlockConfig(selected.id, "label", e.target.value)} className="h-7 text-xs" placeholder="Unterschrift-Label" />
                )}
                {selected.type === "spacer" && (
                  <div>
                    <Label className="text-[9px]">Höhe (px)</Label>
                    <Input type="number" min="5" max="100" value={selected.config.height} onChange={e => updateBlockConfig(selected.id, "height", e.target.value)} className="h-7 text-xs" />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Vorschau</span>
        </div>
        <div className="p-4 bg-background min-h-[150px]">
          <div
            className="text-xs [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-primary [&_p]:text-muted-foreground [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-1.5 [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_th]:bg-muted [&_th]:font-medium [&_hr]:border-border"
            dangerouslySetInnerHTML={{ __html: generateTemplateHtml().replace(/<\/?html>|<\/?head>|<\/?body>|<style[^>]*>.*?<\/style>/gs, "") }}
          />
        </div>
      </Card>

      {/* Save */}
      <Button onClick={saveTemplate} disabled={saving || !name.trim()} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Wird gespeichert…" : "Vorlage speichern"}
      </Button>
    </div>
  );
}
