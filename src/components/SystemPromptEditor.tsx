import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Brain, Save, RotateCcw, Loader2, Lightbulb } from "lucide-react";

export default function SystemPromptEditor() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_system_prompts")
          .select("system_prompt, title, description")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setPrompt(data.system_prompt || "");
          setTitle(data.title || "");
          setDescription(data.description || "");
        }
      } catch (err: any) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_system_prompts")
        .upsert({
          user_id: user.id,
          system_prompt: prompt,
          title: title || "Mein System Prompt",
          description,
          is_active: true,
        });
      if (error) throw error;
      toast.success("System Prompt gespeichert!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    try {
      await supabase
        .from("user_system_prompts")
        .delete()
        .eq("user_id", user.id);
      setPrompt("");
      setTitle("");
      setDescription("");
      toast.success("System Prompt zurückgesetzt");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Mein AI System Prompt</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Definiere wie dein KI-Assistent mit dir kommunizieren soll.
          Dieser Prompt wird bei jedem Chat automatisch geladen.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Titel (Optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. 'Mein persönlicher Coach'"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Beschreibung (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wofür nutzt du diesen Prompt?"
              className="mt-1"
            />
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Du bist ein KI-Assistent für...\n\nÜBER MICH:\n- Name:\n- Rolle:\n- Ziele:\n\nKOMMUNIKATIONSSTIL:\n- Deutsch, direkt, actionable...`}
              className="mt-1 min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Je detaillierter dein Prompt, desto besser wird die KI auf deine Bedürfnisse zugeschnitten.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !prompt.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!prompt && !title}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Tipps für einen guten System Prompt</h3>
        </div>
        <ul className="text-sm space-y-2 text-muted-foreground">
          <li>• <strong>Definiere deine Rolle:</strong> "Du bist ein KI-Coach für..."</li>
          <li>• <strong>Gib Kontext:</strong> "Ich bin [Name], [Rolle]..."</li>
          <li>• <strong>Kommunikationsstil:</strong> "Deutsch, direkt, no fluff..."</li>
          <li>• <strong>Fachgebiete:</strong> "Spezialisiert auf: Hufpflege, Business..."</li>
          <li>• <strong>Ziele:</strong> "Helfe mir bei: Strategie, Content, Code..."</li>
        </ul>
      </div>
    </div>
  );
}
