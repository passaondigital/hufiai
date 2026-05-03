import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "de" | "en";

type Translations = Record<string, Record<Lang, string>>;

const translations: Translations = {
  // Navbar
  "nav.about": { de: "Über Hufi", en: "About Hufi" },
  "nav.ethics": { de: "Ethik", en: "Ethics" },
  "nav.features": { de: "Funktionen", en: "Features" },
  "nav.experts": { de: "Experten", en: "Experts" },
  "nav.pricing": { de: "Preise", en: "Pricing" },
  "nav.login": { de: "Anmelden", en: "Sign In" },
  "nav.cta": { de: "Kostenlos starten", en: "Start Free" },

  // Hero
  "hero.badge": { de: "Für Pferdebetriebe", en: "For Equine Businesses" },
  "hero.title1": { de: "Deine Zeit gehört dem Pferd.", en: "Your time belongs to the horse." },
  "hero.title2": { de: "Den Rest macht Hufi.", en: "Hufi handles the rest." },
  "hero.subtitle": {
    de: "Das digitale Betriebssystem für moderne Pferdebetriebe und mobile Pferdeprofis. DSGVO-konform, in Deutschland entwickelt.",
    en: "The digital operating system for modern equine businesses and mobile horse professionals. GDPR-compliant, built in Germany.",
  },
  "hero.cta": { de: "Jetzt starten", en: "Get Started" },
  "hero.cta2": { de: "Mehr erfahren", en: "Learn More" },

  // Trust Bar
  "trust.gdpr": { de: "DSGVO-konform", en: "GDPR Compliant" },
  "trust.eu": { de: "EU-Server", en: "EU Servers" },
  "trust.available": { de: "24/7 verfügbar", en: "24/7 Available" },
  "trust.multiLLM": { de: "Integrierter Assistent", en: "Integrated Assistant" },

  // Why Hufi
  "why.title": { de: "Warum Hufi?", en: "Why Hufi?" },
  "why.subtitle": {
    de: "Struktur, Ruhe und Klarheit – entwickelt von Pferdemenschen für Pferdemenschen.",
    en: "Structure, calm and clarity – built by horse people, for horse people.",
  },
  "why.trust.title": { de: "Kein Risiko, kein Hokuspokus", en: "No Risk, No Magic Tricks" },
  "why.trust.desc": {
    de: "Hufi ersetzt keinen Experten. Es gibt dir Werkzeuge, die dein Wissen erweitern und deinen Alltag erleichtern – transparent und nachvollziehbar.",
    en: "Hufi doesn't replace experts. It gives you tools that expand your knowledge and simplify your daily work – transparent and traceable.",
  },
  "why.data.title": { de: "Deine Daten gehören dir", en: "Your Data Belongs to You" },
  "why.data.desc": {
    de: "Alle Daten liegen auf EU-Servern, sind verschlüsselt und werden niemals verkauft. Du bestimmst, was geteilt wird.",
    en: "All data is stored on EU servers, encrypted, and never sold. You decide what gets shared.",
  },
  "why.easy.title": { de: "Einfach wie WhatsApp", en: "Simple as WhatsApp" },
  "why.easy.desc": {
    de: "Keine Schulung nötig. Stelle deine Frage, lade ein Foto hoch oder diktiere – Hufi versteht dich sofort.",
    en: "No training needed. Ask a question, upload a photo, or dictate – Hufi understands you instantly.",
  },

  // Features
  "features.title": { de: "Was du mit Hufi erreichst", en: "What You Can Achieve with Hufi" },
  "features.subtitle": {
    de: "Von der ersten Frage bis zum professionellen Video – eine Plattform für alles.",
    en: "From your first question to professional video – one platform for everything.",
  },
  "features.chat.title": { de: "Intelligenter KI-Chat", en: "Intelligent AI Chat" },
  "features.chat.desc": {
    de: "Fragen zu Hufpflege, Fütterung, Stallbau und mehr – sofort beantwortet mit fundiertem Fachwissen.",
    en: "Questions about hoof care, feeding, stable building and more – answered instantly with expert knowledge.",
  },
  "features.video.title": { de: "KI Video Engine", en: "AI Video Engine" },
  "features.video.desc": {
    de: "Erstelle professionelle Marketing-Videos mit KI. Autopilot-Modus, Multi-Modell-Unterstützung und Batch-Export.",
    en: "Create professional marketing videos with AI. Autopilot mode, multi-model support and batch export.",
  },
  "features.hufmanager.title": { de: "Huf-Manager", en: "Hoof Manager" },
  "features.hufmanager.desc": {
    de: "Dokumentiere Hufgesundheit, verwalte Pferdeprofile und teile Daten sicher mit Tierärzten und Hufschmieden.",
    en: "Document hoof health, manage horse profiles and securely share data with vets and farriers.",
  },
  "features.ecosystem.title": { de: "Ecosystem & Netzwerk", en: "Ecosystem & Network" },
  "features.ecosystem.desc": {
    de: "Vernetze dich mit zertifizierten Experten, teile Pferdeprofile und finde Dienstleister in deiner Nähe.",
    en: "Connect with certified experts, share horse profiles and find service providers near you.",
  },
  "features.knowledge.title": { de: "Wissensdatenbank", en: "Knowledge Base" },
  "features.knowledge.desc": {
    de: "Lade eigene Dokumente hoch und lass die KI mit deinem Fachwissen arbeiten – maßgeschneiderte Antworten.",
    en: "Upload your own documents and let AI work with your expertise – tailored answers.",
  },
  "features.content.title": { de: "Content-Zentrale", en: "Content Hub" },
  "features.content.desc": {
    de: "Generiere Social-Media-Posts, Blogartikel und Marketingtexte – perfekt auf die Pferdebranche zugeschnitten.",
    en: "Generate social media posts, blog articles and marketing texts – perfectly tailored to the equine industry.",
  },

  // Use Cases
  "usecases.title": { de: "Wähle deine Situation", en: "Choose Your Situation" },
  "usecases.subtitle": { de: "So hilft dir Hufi im Alltag.", en: "How Hufi helps you every day." },
  "usecases.private": { de: "Pferdebesitzer", en: "Horse Owner" },
  "usecases.business": { de: "Profi / Gewerbe", en: "Professional" },

  "usecases.p1.q": { de: "Mein Pferd hat einen Hufspalt", en: "My horse has a hoof crack" },
  "usecases.p1.a": {
    de: "Hufi analysiert das Problem, erklärt mögliche Ursachen und gibt dir einen Aktionsplan mit Pflege-Tipps.",
    en: "Hufi analyzes the problem, explains possible causes and gives you an action plan with care tips.",
  },
  "usecases.p2.q": { de: "Welches Futter bei Hufrehe?", en: "What feed for laminitis?" },
  "usecases.p2.a": {
    de: "Du erhältst eine sofortige, fachlich fundierte Einschätzung mit Ernährungsplan und Tierarzt-Hinweisen.",
    en: "You receive an immediate, professionally founded assessment with a nutrition plan and vet recommendations.",
  },
  "usecases.p3.q": { de: "Stallbau-Planung für einen Offenstall", en: "Planning an open stable build" },
  "usecases.p3.a": {
    de: "Schritt-für-Schritt-Beratung zu Boden, Entwässerung, Abmessungen und Materialien.",
    en: "Step-by-step guidance on flooring, drainage, dimensions and materials.",
  },
  "usecases.b1.q": { de: "10 Beschläge heute dokumentieren", en: "Document 10 shoeings today" },
  "usecases.b1.a": {
    de: "Strukturierte Eingabe, automatische Fallakte und professioneller PDF-Export mit deinem Firmenlogo.",
    en: "Structured input, automatic case files and professional PDF export with your company logo.",
  },
  "usecases.b2.q": { de: "Kunden-Report für Tierarzt erstellen", en: "Create client report for vet" },
  "usecases.b2.a": {
    de: "Hufi generiert einen druckreifen Bericht mit Befund, Empfehlung und Verlaufsdokumentation.",
    en: "Hufi generates a print-ready report with findings, recommendations and progress documentation.",
  },
  "usecases.b3.q": { de: "Marketing-Video für meine Schmiede", en: "Marketing video for my forge" },
  "usecases.b3.a": {
    de: "Der Autopilot erstellt professionelle Videos – automatisch, in DE & EN, mit deinem Branding.",
    en: "Autopilot creates professional videos – automatically, in DE & EN, with your branding.",
  },

  // Comparison
  "compare.title": { de: "Tarife im Vergleich", en: "Plan Comparison" },
  "compare.subtitle": { de: "Finde den passenden Plan für deine Bedürfnisse.", en: "Find the right plan for your needs." },
  "compare.feature": { de: "Feature", en: "Feature" },

  // Expert CTA
  "expert.title": { de: "Finde einen Experten in deiner Nähe", en: "Find an Expert Near You" },
  "expert.desc": {
    de: "Zertifizierte Hufbearbeiter, Tierärzte und Stallbetreiber – geprüft und bereit, dir und deinem Pferd zu helfen.",
    en: "Certified farriers, veterinarians and stable operators – verified and ready to help you and your horse.",
  },
  "expert.cta": { de: "Experten suchen", en: "Find Experts" },

  // Stats
  "stats.gdpr": { de: "DSGVO-konform", en: "GDPR Compliant" },
  "stats.available": { de: "Verfügbar", en: "Available" },
  "stats.models": { de: "Integrationen", en: "Integrations" },

  // Footer
  "footer.desc": {
    de: "Das digitale Betriebssystem für Pferdebetriebe. DSGVO-konform, in der EU gehostet.",
    en: "The digital operating system for equine businesses. GDPR-compliant, hosted in the EU.",
  },
  "footer.product": { de: "Produkt", en: "Product" },
  "footer.features": { de: "Funktionen", en: "Features" },
  "footer.findExperts": { de: "Experten finden", en: "Find Experts" },
  "footer.manual": { de: "Handbuch", en: "Manual" },
  "footer.pricing": { de: "Preise", en: "Pricing" },
  "footer.company": { de: "Unternehmen", en: "Company" },
  "footer.about": { de: "Über Hufi", en: "About Hufi" },
  "footer.ethics": { de: "Ethik & Verantwortung", en: "Ethics & Responsibility" },
  "footer.legal": { de: "Rechtliches", en: "Legal" },
  "footer.imprint": { de: "Impressum", en: "Imprint" },
  "footer.terms": { de: "AGB", en: "Terms" },
  "footer.privacy": { de: "Datenschutz", en: "Privacy" },
  "footer.rights": { de: "Alle Rechte vorbehalten.", en: "All rights reserved." },
  "footer.aiDisclaimer": { de: "kann Fehler machen. Nutzung auf eigenes Risiko.", en: "can make mistakes. Use at your own risk." },

  // Blog
  "blog.title": { de: "Blog & Neuigkeiten", en: "Blog & News" },
  "blog.subtitle": { de: "Wissenswertes rund um die Pferdebranche und KI.", en: "Insights on the equine industry and AI." },

  // Video Engine Feature Detail
  "videoShowcase.title": { de: "Video Engine im Detail", en: "Video Engine in Detail" },
  "videoShowcase.subtitle": {
    de: "Professionelle Videos auf Knopfdruck – mit KI-Autopilot, Storyboard-Vorschau und Batch-Export.",
    en: "Professional videos at the push of a button – with AI autopilot, storyboard preview and batch export.",
  },
  "videoShowcase.autopilot": { de: "Autopilot-Produzent", en: "Autopilot Producer" },
  "videoShowcase.autopilot.desc": {
    de: "Gib eine URL ein – Hufi scrapt den Inhalt, erstellt ein Skript und produziert ein fertiges Video. Automatisch.",
    en: "Enter a URL – Hufi scrapes the content, creates a script and produces a finished video. Automatically.",
  },
  "videoShowcase.storyboard": { de: "Storyboard-Vorschau", en: "Storyboard Preview" },
  "videoShowcase.storyboard.desc": {
    de: "Sieh dir jede Szene vorab an, prüfe die Kosten und gib erst dann das Rendering frei.",
    en: "Preview every scene, check costs and only then approve rendering.",
  },
  "videoShowcase.batch": { de: "Batch-Download", en: "Batch Download" },
  "videoShowcase.batch.desc": {
    de: "Exportiere alle Videos als ZIP – in DE & EN, allen Formaten, mit einem Klick.",
    en: "Export all videos as ZIP – in DE & EN, all formats, with one click.",
  },
  "videoShowcase.models": { de: "Multi-Modell-KI", en: "Multi-Model AI" },
  "videoShowcase.models.desc": {
    de: "Wähle aus 5+ KI-Modellen das beste für deinen Einsatzzweck: Realismus, Biomechanik oder 3D.",
    en: "Choose from 5+ AI models for your use case: realism, biomechanics or 3D.",
  },

  // Gamification Journey
  "gamification.badge": { de: "Dein Weg zum Profi", en: "Your Path to Pro" },
  "gamification.title": { de: "Von Unsicher zu Selbstbewusst – in 4 Wochen", en: "From Uncertain to Confident – in 4 Weeks" },
  "gamification.before": { de: "Vorher", en: "Before" },
  "gamification.before.quote": { de: "KI? Das ist viel zu kompliziert für mich. Ich bleibe lieber bei dem, was ich kenne.", en: "AI? That's way too complicated for me. I'll stick with what I know." },
  "gamification.before.persona": { de: "Typischer Anfänger", en: "Typical Beginner" },
  "gamification.before.feeling": { de: "Überfordert & unsicher", en: "Overwhelmed & unsure" },
  "gamification.after": { de: "Nachher", en: "After" },
  "gamification.after.quote": { de: "Ich erstelle jetzt professionelle Berichte und Videos – in Minuten statt Stunden!", en: "I now create professional reports and videos – in minutes instead of hours!" },
  "gamification.after.persona": { de: "Hufi Nutzer · Level 5", en: "Hufi User · Level 5" },
  "gamification.after.feeling": { de: "Selbstbewusst & produktiv", en: "Confident & productive" },
  "gamification.week": { de: "Woche", en: "Week" },

  "gamification.level1.title": { de: "Erste Schritte", en: "First Steps" },
  "gamification.level1.desc": { de: "Stelle deine erste Frage im Chat. Hufi führt dich sanft ein – wie WhatsApp, nur schlauer. Kein Vorwissen nötig.", en: "Ask your first question in chat. Hufi gently guides you – like WhatsApp, just smarter. No prior knowledge needed." },
  "gamification.level1.badge": { de: "🏅 Erster Chat abgeschlossen", en: "🏅 First Chat Completed" },

  "gamification.level2.title": { de: "Wissen aufbauen", en: "Building Knowledge" },
  "gamification.level2.desc": { de: "Lerne, Fotos hochzuladen und Pferdeprofile anzulegen. Die KI merkt sich dein Pferd und gibt personalisierte Tipps.", en: "Learn to upload photos and create horse profiles. AI remembers your horse and gives personalized tips." },
  "gamification.level2.badge": { de: "📸 Erstes Pferdeprofil erstellt", en: "📸 First Horse Profile Created" },

  "gamification.level3.title": { de: "Profi-Werkzeuge nutzen", en: "Using Pro Tools" },
  "gamification.level3.desc": { de: "Erstelle deinen ersten PDF-Bericht oder Content-Post. Nutze die Wissensdatenbank für maßgeschneiderte Antworten.", en: "Create your first PDF report or content post. Use the knowledge base for tailored answers." },
  "gamification.level3.badge": { de: "📄 Erster Bericht exportiert", en: "📄 First Report Exported" },

  "gamification.level4.title": { de: "Experte werden", en: "Becoming an Expert" },
  "gamification.level4.desc": { de: "Nutze die Video Engine, vernetze dich im Ecosystem und teile Pferdeprofile mit Tierärzten und Hufschmieden.", en: "Use the Video Engine, connect in the Ecosystem and share horse profiles with vets and farriers." },
  "gamification.level4.badge": { de: "🎬 Erstes Video erstellt", en: "🎬 First Video Created" },

  "gamification.level5.title": { de: "Hufi Meister", en: "Hufi Master" },
  "gamification.level5.desc": { de: "Du nutzt alle Features wie ein Profi – Autopilot-Videos, Batch-Exporte und KI-gestützte Geschäftsprozesse. Teile dein Wissen mit der Community!", en: "You use all features like a pro – autopilot videos, batch exports and AI-powered business processes. Share your knowledge with the community!" },
  "gamification.level5.badge": { de: "🏆 Hufi Meister", en: "🏆 Hufi Master" },

  "gamification.social.achievements": { de: "Achievements", en: "Achievements" },
  "gamification.social.achievements.desc": { de: "Sammle Abzeichen auf deinem Weg", en: "Collect badges along your journey" },
  "gamification.social.share": { de: "Teile Erfolge", en: "Share Achievements" },
  "gamification.social.share.desc": { de: "Zeige deinen Fortschritt", en: "Show your progress" },
  "gamification.social.community": { de: "Community", en: "Community" },
  "gamification.social.community.desc": { de: "Lerne gemeinsam mit anderen", en: "Learn together with others" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "de",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem("hufi_lang");
    if (stored === "en" || stored === "de") return stored;
    return navigator.language.startsWith("en") ? "en" : "de";
  });

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("hufi_lang", newLang);
  }, []);

  const t = useCallback(
    (key: string) => translations[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
