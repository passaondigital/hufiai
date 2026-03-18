import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACCENT = [244, 123, 32] as const;
const DARK = [30, 30, 30] as const;
const GRAY = [120, 120, 120] as const;
const LIGHT_BG = [250, 247, 243] as const;
const WHITE = [255, 255, 255] as const;

interface GenerateRequest {
  conversation_ids: string[];
  batch_action?: "individual" | "combined";
  template: string;
  horse_name?: string;
  horse_breed?: string;
  horse_age?: string;
  owner_name?: string;
  expert_name?: string;
  expert_title?: string;
  expert_certificates?: string[];
  include_prompts?: boolean;
  include_metadata?: boolean;
  include_toc?: boolean;
  watermark?: string;
  compress_images?: boolean;
  date_from?: string;
  date_to?: string;
  // Legacy single conversation support
  conversation_id?: string;
}

// ─── Template-specific AI prompts ────────────────────────────────
const TEMPLATE_AI_PROMPTS: Record<string, string> = {
  report: `Du erstellst einen strukturierten Analysebericht. Antworte NUR mit JSON:
{"title":"Berichtstitel","summary":"Kurze Zusammenfassung (2-3 Sätze)","observations":"Detaillierte Beobachtungen","analysis":"Fachliche Analyse und Einschätzung","recommendations":"Empfohlene Maßnahmen","conclusion":"Fazit und Ausblick"}`,
  proposal: `Du erstellst ein professionelles Angebot/Proposal. Antworte NUR mit JSON:
{"title":"Angebotstitel","executive_summary":"Management Summary","problem_statement":"Problemstellung / Ausgangslage","proposed_solution":"Vorgeschlagene Lösung","benefits":"Nutzen und Vorteile","next_steps":"Nächste Schritte","pricing_notes":"Hinweise zu Kosten/Aufwand"}`,
  guide: `Du erstellst eine Anleitung/Tutorial basierend auf dem Chat. Antworte NUR mit JSON:
{"title":"Titel der Anleitung","introduction":"Einführung und Ziel","prerequisites":"Voraussetzungen","steps":"Schritt-für-Schritt Anleitung (als Text mit Nummerierung)","tips":"Tipps und häufige Fehler","summary":"Zusammenfassung der wichtigsten Punkte"}`,
  meeting: `Du erstellst strukturierte Gesprächsnotizen. Antworte NUR mit JSON:
{"title":"Thema des Gesprächs","participants":"Beteiligte (falls erkennbar)","key_topics":"Besprochene Hauptthemen","decisions":"Getroffene Entscheidungen","action_items":"Offene Aufgaben und nächste Schritte","follow_up":"Follow-Up Termine/Themen"}`,
  invoice: `Du erstellst einen Kostenvoranschlag. Antworte NUR mit JSON:
{"title":"Titel","description":"Beschreibung der Leistung","items":"Auflistung der Positionen/Leistungen","terms":"Bedingungen und Hinweise","validity":"Gültigkeitsdauer","notes":"Anmerkungen"}`,
  private: `Du erstellst einen verständlichen Bericht für Privatpersonen. Antworte NUR mit JSON:
{"title":"Berichtstitel","summary":"Einfache Zusammenfassung","observations":"Was wurde besprochen","recommendations":"Was du tun kannst","important_notes":"Wichtige Hinweise"}`,
  business: `Du erstellst einen formalen Geschäftsbericht. Antworte NUR mit JSON:
{"title":"Berichtstitel","summary":"Executive Summary","observations":"Beobachtungen und Befunde","analysis":"Fachliche Analyse","recommendations":"Empfohlene Maßnahmen","conclusion":"Fazit"}`,
  professional: `Du erstellst einen professionellen Expertenbericht. Antworte NUR mit JSON:
{"title":"Berichtstitel","summary":"Zusammenfassung","observations":"Klinische/fachliche Beobachtungen","analysis":"Differentialdiagnostische Einschätzung","recommendations":"Therapie-/Maßnahmenempfehlung","prognosis":"Prognose","disclaimer":"Fachlicher Haftungshinweis"}`,
};

// ─── Fetch messages with date filtering ──────────────────────────
async function fetchMessages(
  client: any,
  conversationId: string,
  opts: { date_from?: string; date_to?: string; include_prompts?: boolean },
) {
  let query = client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (opts.date_from) query = query.gte("created_at", opts.date_from);
  if (opts.date_to) query = query.lte("created_at", opts.date_to);

  const { data, error } = await query;
  if (error) throw new Error("Nachrichten konnten nicht geladen werden");

  let msgs = data || [];
  if (opts.include_prompts === false) {
    msgs = msgs.filter((m: any) => m.role !== "user");
  }
  return msgs;
}

// ─── AI Summary Generation ───────────────────────────────────────
async function generateAiSummary(
  chatContent: string,
  template: string,
  lovableKey: string,
): Promise<Record<string, string>> {
  const templatePrompt = TEMPLATE_AI_PROMPTS[template] || TEMPLATE_AI_PROMPTS.report;
  const fallback: Record<string, string> = { title: "Bericht", summary: "Zusammenfassung nicht verfügbar." };

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
            content: `Du bist ein professioneller Dokumentationsassistent für die Pferdebranche.
TONALITÄT – Empathische Sachlichkeit:
- Formuliere unterstützend und professionell.
- Betone stets, dass KI-Analyse eine fachliche Beratung nicht ersetzt.

${templatePrompt}

Jeder Wert soll 2-5 Sätze lang sein. Antworte AUSSCHLIEẞLICH mit dem JSON-Objekt, KEIN Markdown.`,
          },
          { role: "user", content: chatContent.slice(0, 12000) },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) return fallback;
    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("AI summary error:", e);
  }
  return fallback;
}

// ─── PDF Page Helpers ────────────────────────────────────────────
function addWatermarkToPage(doc: any, text: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 200, 200);
  // Diagonal watermark
  const cx = pageW / 2;
  const cy = pageH / 2;
  doc.text(text, cx, cy, { align: "center", angle: 45 });
  doc.restoreGraphicsState();
}

function addFooter(doc: any, pageNum: number, totalPages: number, template: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const footerY = pageH - 10;

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Erstellt mit HufiAi · KI-gestützte Analyse · DSGVO-konform · Serverstandort Frankfurt, DE", margin, footerY);
  doc.text(`Seite ${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });

  doc.setFontSize(5.5);
  doc.text("KI-Assistenz – ersetzt keine fachliche Beratung. Nutzung auf eigenes Risiko.", margin, footerY + 3.5);
}

function checkPageBreak(doc: any, yPos: number, needed: number): number {
  if (yPos + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return yPos;
}

// ─── Build a single PDF document ─────────────────────────────────
function buildPdf(
  messages: any[],
  summary: Record<string, string>,
  opts: GenerateRequest & { convTitle?: string; profile?: any },
): any {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;
  const isBusinessTemplate = ["business", "professional", "proposal", "invoice"].includes(opts.template);
  const isProfessionalTemplate = opts.template === "professional";

  const now = new Date();
  const dateStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  // ── TOC placeholder (we'll come back to fill it) ──
  const tocSections: { title: string; page: number }[] = [];
  let tocPageCount = 0;

  if (opts.include_toc) {
    // Reserve TOC page
    tocPageCount = 1;
    // We'll build TOC after we know all sections
  }

  // Start on page after TOC (or page 1 if no TOC)
  let currentPage = tocPageCount + 1;
  if (opts.include_toc) doc.addPage();

  let yPos = 14;

  // ── HEADER ──
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 3, "F");

  const companyName = isProfessionalTemplate && opts.expert_name
    ? opts.expert_name
    : (isBusinessTemplate && opts.profile?.company_name) ? opts.profile.company_name : "HufiAi";
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(companyName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);

  const templateLabels: Record<string, string> = {
    report: "Analysebericht",
    proposal: "Angebot / Proposal",
    guide: "Anleitung / Guide",
    meeting: "Gesprächsnotizen",
    invoice: "Kostenvoranschlag",
    private: "Persönlicher Bericht",
    business: "Geschäftsbericht",
    professional: "Experten-Bericht · Vertraulich",
  };
  doc.text(templateLabels[opts.template] || "Bericht", margin, yPos + 12);

  if (isProfessionalTemplate && opts.expert_certificates && opts.expert_certificates.length > 0) {
    doc.setFontSize(7);
    doc.text(`Qualifikationen: ${opts.expert_certificates.join(" · ")}`, margin, yPos + 17);
  }

  doc.setFontSize(9);
  doc.text(`${dateStr} · ${timeStr}`, pageW - margin, yPos + 6, { align: "right" });
  if (opts.include_metadata) {
    const convId = opts.conversation_ids?.[0] || "";
    doc.text(`Ref. ${convId.slice(0, 8).toUpperCase()}`, pageW - margin, yPos + 12, { align: "right" });
  }

  yPos += 22;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 8;

  // ── TITLE from AI summary ──
  if (summary.title) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    const titleLines = doc.splitTextToSize(summary.title, contentW);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 6 + 4;
  }

  // ── MASTER DATA BOX ──
  const hasHorseData = opts.horse_name || opts.horse_breed || opts.horse_age || opts.owner_name;
  if (hasHorseData || isBusinessTemplate) {
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

    const col1X = margin + 5;
    const col2X = margin + contentW / 2 + 5;
    let dataY = yPos + 14;

    doc.text(`Pferd: ${opts.horse_name || opts.convTitle || "–"}`, col1X, dataY);
    doc.text(`Rasse: ${opts.horse_breed || "–"}`, col2X, dataY);
    dataY += 6;
    doc.text(`Alter: ${opts.horse_age || "–"}`, col1X, dataY);
    doc.text(`Besitzer: ${opts.owner_name || opts.profile?.display_name || "–"}`, col2X, dataY);

    if (isBusinessTemplate) {
      dataY += 6;
      doc.text(`Betrieb: ${opts.profile?.company_name || "–"}`, col1X, dataY);
      if (opts.profile?.company_address) doc.text(`Adresse: ${opts.profile.company_address}`, col2X, dataY);
    }
    yPos += boxH + 10;
  }

  // ── AI-GENERATED SECTIONS ──
  const skipKeys = ["title"];
  const sectionIcons: Record<string, string> = {
    summary: "📋", executive_summary: "📋", observations: "🔍", analysis: "🔬",
    recommendations: "✅", conclusion: "📌", problem_statement: "❓", proposed_solution: "💡",
    benefits: "🎯", next_steps: "➡️", pricing_notes: "💰", introduction: "📖",
    prerequisites: "⚙️", steps: "📝", tips: "💡", participants: "👥",
    key_topics: "📋", decisions: "✅", action_items: "🔧", follow_up: "📅",
    description: "📄", items: "📦", terms: "📜", validity: "⏳", notes: "📝",
    important_notes: "⚠️", prognosis: "📈", disclaimer: "⚖️",
  };
  const sectionLabels: Record<string, string> = {
    summary: "Zusammenfassung", executive_summary: "Executive Summary",
    observations: "Beobachtungen", analysis: "Analyse", recommendations: "Empfehlungen",
    conclusion: "Fazit", problem_statement: "Ausgangslage", proposed_solution: "Lösung",
    benefits: "Nutzen", next_steps: "Nächste Schritte", pricing_notes: "Kosten",
    introduction: "Einführung", prerequisites: "Voraussetzungen", steps: "Anleitung",
    tips: "Tipps", participants: "Beteiligte", key_topics: "Hauptthemen",
    decisions: "Entscheidungen", action_items: "Aufgaben", follow_up: "Follow-Up",
    description: "Beschreibung", items: "Positionen", terms: "Bedingungen",
    validity: "Gültigkeit", notes: "Anmerkungen", important_notes: "Wichtige Hinweise",
    prognosis: "Prognose", disclaimer: "Haftungshinweis",
  };

  for (const [key, value] of Object.entries(summary)) {
    if (skipKeys.includes(key) || !value || typeof value !== "string") continue;

    yPos = checkPageBreak(doc, yPos, 25);

    const icon = sectionIcons[key] || "📄";
    const label = sectionLabels[key] || key;
    tocSections.push({ title: `${icon} ${label}`, page: doc.internal.getNumberOfPages() });

    // Section header with accent bar
    doc.setFillColor(...ACCENT);
    doc.rect(margin, yPos, 2, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(`${icon} ${label}`, margin + 6, yPos + 5);
    yPos += 10;

    // Section content
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(value, contentW - 6);

    for (let i = 0; i < lines.length; i++) {
      yPos = checkPageBreak(doc, yPos, 5);
      doc.text(lines[i], margin + 6, yPos);
      yPos += 4.5;
    }
    yPos += 6;
  }

  // ── CHAT EXCERPT ──
  if (messages.length > 0 && (isBusinessTemplate || opts.template === "meeting")) {
    yPos = checkPageBreak(doc, yPos, 30);

    tocSections.push({ title: "💬 Chat-Auszug", page: doc.internal.getNumberOfPages() });

    doc.setFillColor(...ACCENT);
    doc.rect(margin, yPos, 2, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("💬 Chat-Auszug", margin + 6, yPos + 5);
    yPos += 12;

    const excerptMsgs = messages.slice(0, 20);
    for (const msg of excerptMsgs) {
      yPos = checkPageBreak(doc, yPos, 12);

      const role = msg.role === "user" ? "Nutzer" : "HufiAi";
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const roleColor = msg.role === "user" ? ACCENT : DARK;
      doc.setTextColor(roleColor[0], roleColor[1], roleColor[2]);
      doc.text(role, margin + 6, yPos);

      if (opts.include_metadata && msg.created_at) {
        doc.setFontSize(6);
        doc.setTextColor(...GRAY);
        const ts = new Date(msg.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
        doc.text(ts, pageW - margin, yPos, { align: "right" });
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const msgLines = doc.splitTextToSize(msg.content.slice(0, 500), contentW - 12);
      for (let i = 0; i < msgLines.length; i++) {
        yPos = checkPageBreak(doc, yPos + 4, 5);
        doc.text(msgLines[i], margin + 6, yPos);
      }
      yPos += 6;
    }
  }

  // ── WATERMARK on all pages ──
  if (opts.watermark) {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addWatermarkToPage(doc, opts.watermark);
    }
  }

  // ── FOOTER on all pages ──
  const totalPages = doc.internal.getNumberOfPages();
  const startPage = opts.include_toc ? 2 : 1;
  for (let i = startPage; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i - startPage + 1, totalPages - startPage + 1, opts.template);
  }

  // ── BUILD TOC (page 1) ──
  if (opts.include_toc && tocSections.length > 0) {
    doc.setPage(1);
    let tocY = 14;

    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, 3, "F");

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Inhaltsverzeichnis", margin, tocY + 8);
    tocY += 16;

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(margin, tocY, pageW - margin, tocY);
    tocY += 8;

    doc.setFontSize(10);
    for (const section of tocSections) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(section.title, margin + 4, tocY);

      doc.setTextColor(...GRAY);
      const pageLabel = `${section.page - startPage + 1}`;
      doc.text(pageLabel, pageW - margin, tocY, { align: "right" });

      // Dotted line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      const textW = doc.getTextWidth(section.title) + margin + 6;
      const pageW2 = pageW - margin - doc.getTextWidth(pageLabel) - 2;
      if (pageW2 > textW) {
        for (let x = textW; x < pageW2; x += 2) {
          doc.circle(x, tocY - 1, 0.2, "F");
        }
      }
      tocY += 7;
    }

    // TOC footer
    addFooter(doc, 0, totalPages - startPage + 1, opts.template);
  }

  return doc;
}

// ─── Main handler ────────────────────────────────────────────────
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

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Nicht autorisiert");

    const body: GenerateRequest = await req.json();

    // Legacy support: single conversation_id → conversation_ids
    const convIds = body.conversation_ids?.length
      ? body.conversation_ids
      : body.conversation_id
        ? [body.conversation_id]
        : [];

    if (convIds.length === 0) throw new Error("Keine Konversation ausgewählt");

    // Fetch profile once
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const batchAction = body.batch_action || "individual";

    // ── COMBINED mode: merge all chats into one PDF ──
    if (batchAction === "combined" || convIds.length === 1) {
      let allMessages: any[] = [];
      let convTitles: string[] = [];

      for (const cid of convIds) {
        const { data: conv } = await userClient
          .from("conversations")
          .select("title")
          .eq("id", cid)
          .single();
        convTitles.push(conv?.title || "Unbenannt");

        const msgs = await fetchMessages(userClient, cid, {
          date_from: body.date_from,
          date_to: body.date_to,
          include_prompts: body.include_prompts,
        });
        allMessages = allMessages.concat(msgs);
      }

      // Generate AI summary
      const chatContent = allMessages
        .map((m: any) => `${m.role === "user" ? "Nutzer" : "KI"}: ${m.content}`)
        .join("\n");

      const summary = await generateAiSummary(chatContent, body.template, lovableKey);

      const doc = buildPdf(allMessages, summary, {
        ...body,
        conversation_ids: convIds,
        convTitle: convTitles.join(" + "),
        profile,
      } as any);

      const pdfBuffer = doc.output("arraybuffer");
      const pdfUint8 = new Uint8Array(pdfBuffer);
      const fileName = `HufiAi-${body.template}-${convIds[0].slice(0, 8)}.pdf`;

      // Save to storage
      const storagePath = `${user.id}/${Date.now()}-${fileName}`;
      let fileUrl: string | null = null;
      try {
        const { error: uploadErr } = await adminClient.storage
          .from("pdf-exports")
          .upload(storagePath, pdfUint8, { contentType: "application/pdf" });
        if (!uploadErr) {
          const { data: urlData } = adminClient.storage.from("pdf-exports").getPublicUrl(storagePath);
          fileUrl = urlData?.publicUrl || null;
        }
      } catch { /* non-critical */ }

      // Save to pdf_exports table
      try {
        await adminClient.from("pdf_exports").insert({
          user_id: user.id,
          conversation_id: convIds[0],
          pdf_title: summary.title || convTitles.join(" + "),
          file_url: fileUrl,
          file_size: pdfUint8.byteLength,
          page_count: doc.internal.getNumberOfPages(),
          format_options: {
            template: body.template,
            include_prompts: body.include_prompts,
            include_metadata: body.include_metadata,
            include_toc: body.include_toc,
            watermark: body.watermark || null,
          },
        });
      } catch { /* non-critical */ }

      // Log export
      try {
        await adminClient.from("chat_exports").insert({
          user_id: user.id,
          conversation_id: convIds[0],
          format: "pdf",
        });
      } catch { /* non-critical */ }

      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    // ── INDIVIDUAL mode: first PDF only (ZIP not supported in jsPDF) ──
    // For now, generate the first one. Batch ZIP would need a zip library.
    const cid = convIds[0];
    const { data: conv } = await userClient
      .from("conversations")
      .select("title")
      .eq("id", cid)
      .single();

    const msgs = await fetchMessages(userClient, cid, {
      date_from: body.date_from,
      date_to: body.date_to,
      include_prompts: body.include_prompts,
    });

    const chatContent = msgs
      .map((m: any) => `${m.role === "user" ? "Nutzer" : "KI"}: ${m.content}`)
      .join("\n");

    const summary = await generateAiSummary(chatContent, body.template, lovableKey);

    const doc = buildPdf(msgs, summary, {
      ...body,
      conversation_ids: [cid],
      convTitle: conv?.title || "Unbenannt",
      profile,
    } as any);

    const pdfBuffer = doc.output("arraybuffer");

    try {
      await adminClient.from("chat_exports").insert({
        user_id: user.id,
        conversation_id: cid,
        format: "pdf",
      });
    } catch { /* non-critical */ }

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="HufiAi-${body.template}-${cid.slice(0, 8)}.pdf"`,
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
