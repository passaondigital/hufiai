import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACCENT = [244, 123, 32]; // #F47B20
const DARK = [30, 30, 30];
const GRAY = [120, 120, 120];
const LIGHT_BG = [250, 247, 243];

interface GenerateRequest {
  conversation_id: string;
  template: "business" | "private" | "professional";
  horse_name?: string;
  horse_breed?: string;
  horse_age?: string;
  owner_name?: string;
  expert_name?: string;
  expert_title?: string;
  expert_certificates?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify user
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Nicht autorisiert");

    const body: GenerateRequest = await req.json();
    const { conversation_id, template, horse_name, horse_breed, horse_age, owner_name } = body;

    // Fetch conversation
    const { data: conv, error: convErr } = await userClient
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .single();
    if (convErr || !conv) throw new Error("Konversation nicht gefunden");

    // Fetch messages
    const { data: messages, error: msgErr } = await userClient
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error("Nachrichten konnten nicht geladen werden");

    // Fetch user profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Generate AI summary using Lovable AI
    const chatContent = (messages || [])
      .map((m: any) => `${m.role === "user" ? "Nutzer" : "KI"}: ${m.content}`)
      .join("\n");

    let summary = { observations: "", analysis: "", recommendations: "" };
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Du bist ein veterinärmedizinischer Dokumentationsassistent für die Pferdebranche. Erstelle aus dem folgenden Chat eine strukturierte Zusammenfassung auf Deutsch.

TONALITÄT – Empathische Sachlichkeit:
- Formuliere unterstützend und professionell, niemals allwissend oder belehrend.
- Verwende Formulierungen wie: "Basierend auf den vorliegenden Daten...", "Ein möglicher Lösungsansatz wäre...", "In Zusammenarbeit mit Fachleuten vor Ort..."
- Betone stets, dass diese KI-Analyse eine fachliche Beratung vor Ort nicht ersetzt.

Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Code-Blöcke) mit genau diesen Schlüsseln:
{"observations": "Beobachtungen und Beschreibungen des Nutzers", "analysis": "KI-Analyse und Einschätzung", "recommendations": "Empfohlene Maßnahmen und nächste Schritte"}
Jeder Wert soll 2-5 Sätze lang sein. Falls der Chat wenig Inhalt hat, fasse sinngemäß zusammen.`,
            },
            { role: "user", content: chatContent.slice(0, 8000) },
          ],
          temperature: 0.3,
        }),
      });
      const aiData = await aiRes.json();
      const raw = aiData.choices?.[0]?.message?.content || "";
      // Try to parse JSON from the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("AI summary error:", e);
      summary = {
        observations: "Chat-Zusammenfassung konnte nicht automatisch erstellt werden.",
        analysis: "Bitte überprüfen Sie den vollständigen Chat-Verlauf.",
        recommendations: "Konsultieren Sie einen Fachexperten für spezifische Empfehlungen.",
      };
    }

    // Build PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const contentW = pageW - margin * 2;
    const isBusinessTemplate = template === "business" || template === "professional";
    const isProfessionalTemplate = template === "professional";
    const now = new Date();
    const dateStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    // --- HEADER ---
    // Accent line
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, 3, "F");

    let yPos = 14;

    // Logo area
    const companyName = isProfessionalTemplate && expert_name
      ? expert_name
      : (isBusinessTemplate && profile?.company_name) ? profile.company_name : "HufiAi";
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(companyName, margin, yPos + 6);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const subtitle = isProfessionalTemplate
      ? `${expert_title || "Fachexperte"} · Professioneller Fallbericht · Vertraulich`
      : isBusinessTemplate
        ? "Professioneller Fallbericht · Vertraulich"
        : "Persönlicher Pferde-Bericht";
    doc.text(subtitle, margin, yPos + 12);

    // Certificates line for professional template
    if (isProfessionalTemplate && expert_certificates && expert_certificates.length > 0) {
      doc.setFontSize(7);
      doc.text(`Qualifikationen: ${expert_certificates.join(" · ")}`, margin, yPos + 17);
    }

    // Date right-aligned
    doc.setFontSize(9);
    doc.text(`${dateStr} · ${timeStr}`, pageW - margin, yPos + 6, { align: "right" });
    doc.text(`Bericht-Nr. ${conversation_id.slice(0, 8).toUpperCase()}`, pageW - margin, yPos + 12, { align: "right" });

    yPos += 20;
    // Divider
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageW - margin, yPos);
    yPos += 8;

    // --- MASTER DATA BOX ---
    doc.setFillColor(...LIGHT_BG);
    const boxH = isBusinessTemplate ? 32 : 24;
    doc.roundedRect(margin, yPos, contentW, boxH, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Stammdaten", margin + 5, yPos + 7);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);

    // Left column
    const col1X = margin + 5;
    const col2X = margin + contentW / 2 + 5;
    let dataY = yPos + 14;

    doc.text(`Pferd: ${horse_name || conv.title || "Nicht angegeben"}`, col1X, dataY);
    doc.text(`Rasse: ${horse_breed || "–"}`, col2X, dataY);
    dataY += 6;
    doc.text(`Alter: ${horse_age || "–"}`, col1X, dataY);
    doc.text(`Besitzer: ${owner_name || profile?.display_name || "–"}`, col2X, dataY);

    if (isBusinessTemplate) {
      dataY += 6;
      doc.text(`Betrieb: ${profile?.company_name || "–"}`, col1X, dataY);
      if (profile?.company_address) doc.text(`Adresse: ${profile.company_address}`, col2X, dataY);
    }

    yPos += boxH + 10;

    // --- SMART SUMMARY SECTIONS ---
    const sections = [
      { title: "📋 Beobachtungen", content: summary.observations, icon: "Observations" },
      { title: "🔬 KI-Analyse", content: summary.analysis, icon: "Analysis" },
      { title: "✅ Empfohlene Maßnahmen", content: summary.recommendations, icon: "Actions" },
    ];

    for (const section of sections) {
      if (yPos > pageH - 50) {
        doc.addPage();
        yPos = 20;
      }

      // Section header with accent
      doc.setFillColor(...ACCENT);
      doc.rect(margin, yPos, 2, 6, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(section.title, margin + 6, yPos + 5);
      yPos += 10;

      // Section content
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(section.content || "Keine Daten verfügbar.", contentW - 6);
      doc.text(lines, margin + 6, yPos);
      yPos += lines.length * 4.5 + 8;
    }

    // --- CHAT EXCERPT (Business only) ---
    if (isBusinessTemplate && messages && messages.length > 0) {
      if (yPos > pageH - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(...ACCENT);
      doc.rect(margin, yPos, 2, 6, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("💬 Chat-Auszug", margin + 6, yPos + 5);
      yPos += 12;

      const excerptMsgs = messages.slice(0, 10);
      for (const msg of excerptMsgs) {
        if (yPos > pageH - 30) {
          doc.addPage();
          yPos = 20;
        }

        const role = msg.role === "user" ? "Nutzer" : "HufiAi";
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(msg.role === "user" ? ACCENT[0] : DARK[0], msg.role === "user" ? ACCENT[1] : DARK[1], msg.role === "user" ? ACCENT[2] : DARK[2]);
        doc.text(role, margin + 6, yPos);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const msgLines = doc.splitTextToSize(msg.content.slice(0, 300), contentW - 12);
        doc.text(msgLines, margin + 6, yPos + 4);
        yPos += msgLines.length * 3.5 + 6;
      }
    }

    // --- FOOTER ---
    const footerY = pageH - 12;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text("Erstellt mit HufiAi · KI-gestützte Analyse für die Pferdebranche · DSGVO-konform · Serverstandort Frankfurt, DE", margin, footerY);
    doc.text("hufi.ai", pageW - margin, footerY, { align: "right" });

    doc.setFontSize(6);
    doc.text("HufiAi ist eine KI-Assistenz zur Unterstützung. Informationen ersetzen keine fachliche Beratung durch Tierärzte, Huf-Experten oder Juristen. Nutzung auf eigenes Risiko.", margin, footerY + 4);

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer");

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="HufiAi-Bericht-${conversation_id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
