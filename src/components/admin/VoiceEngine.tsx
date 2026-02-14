import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mic, Volume2, Loader2, Square, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VoiceEngineProps {
  selectedModel: string;
}

export default function VoiceEngine({ selectedModel }: VoiceEngineProps) {
  // Voice-In (STT)
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Voice-Out (TTS)
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState<"male" | "female">("female");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        await transcribeAudio(blob);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Mikrofon-Zugriff verweigert");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          action: "speech_to_text",
          model: selectedModel,
          audio_base64: base64,
          audio_type: "audio/webm",
        },
      });

      if (error) throw error;
      setTranscript(data.text || "");
      toast.success("Transkription abgeschlossen!");
    } catch (err: any) {
      toast.error(err.message || "Transkription fehlgeschlagen");
    }
    setTranscribing(false);
  };

  const generateSpeech = async () => {
    if (!ttsText.trim()) return;
    setGenerating(true);
    setAudioUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          action: "text_to_speech",
          model: selectedModel,
          text: ttsText,
          voice: ttsVoice,
        },
      });

      if (error) throw error;

      if (data.use_web_speech && data.optimized_text) {
        // Use Web Speech API for actual audio synthesis
        const utterance = new SpeechSynthesisUtterance(data.optimized_text);
        utterance.lang = "de-DE";
        utterance.rate = 0.95;
        
        // Find a German voice matching the selected gender
        const voices = window.speechSynthesis.getVoices();
        const germanVoices = voices.filter((v) => v.lang.startsWith("de"));
        const genderVoice = germanVoices.find((v) =>
          data.voice_type === "female"
            ? v.name.toLowerCase().includes("female") || v.name.includes("Anna") || v.name.includes("Petra")
            : v.name.toLowerCase().includes("male") || v.name.includes("Hans") || v.name.includes("Markus")
        ) || germanVoices[0];
        
        if (genderVoice) utterance.voice = genderVoice;
        window.speechSynthesis.speak(utterance);
        setAudioUrl("web-speech-active");
        toast.success("Audio wird vorgelesen!");
      } else if (data.audio_base64) {
        const audioSrc = `data:audio/mp3;base64,${data.audio_base64}`;
        setAudioUrl(audioSrc);
        toast.success("Audio generiert!");
      } else {
        toast.error("Kein Audio empfangen");
      }
    } catch (err: any) {
      toast.error(err.message || "TTS fehlgeschlagen");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Voice-In: Speech to Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="w-5 h-5 text-primary" /> Voice-In (Speech-to-Text)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nimm Audio auf und lasse es transkribieren. Optimiert für deutsche Sprache.
          </p>
          <div className="flex gap-3">
            {!recording ? (
              <Button onClick={startRecording} disabled={transcribing}>
                <Mic className="w-4 h-4 mr-2" /> Aufnahme starten
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive">
                <Square className="w-4 h-4 mr-2" /> Stopp
              </Button>
            )}
            {transcribing && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Transkribiere…
              </Badge>
            )}
          </div>
          {transcript && (
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-xs font-semibold text-primary mb-1">Transkript:</p>
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(transcript);
                  toast.success("Kopiert!");
                }}
              >
                Kopieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice-Out: Text to Speech */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="w-5 h-5 text-primary" /> Voice-Out (Text-to-Speech)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Text eingeben, der vorgelesen werden soll…"
            rows={4}
          />
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              {([
                { id: "female" as const, label: "👩 Die Innovatorin", desc: "Klar, motivierend – perfekt für Tutorials" },
                { id: "male" as const, label: "👨 Der Mentor", desc: "Tief, ruhig – perfekt für Analysen" },
              ]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setTtsVoice(v.id)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all text-left ${
                    ttsVoice === v.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-medium">{v.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>
            <Button onClick={generateSpeech} disabled={generating || !ttsText.trim()}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Generieren
            </Button>
          </div>
          {audioUrl && (
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              {audioUrl === "web-speech-active" ? (
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-sm">Audio wird über Web Speech API vorgelesen…</span>
                  <Button size="sm" variant="ghost" onClick={() => { window.speechSynthesis.cancel(); setAudioUrl(null); }}>
                    Stopp
                  </Button>
                </div>
              ) : (
                <audio controls src={audioUrl} className="w-full" />
              )}
            </div>
          )}
          <Badge variant="outline" className="text-xs">Modell: {selectedModel}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
