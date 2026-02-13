import { Shield, Server, Lock } from "lucide-react";

export default function TrustFooter() {
  return (
    <section className="bg-secondary py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-secondary-foreground mb-2">AI for Good</h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto text-sm">
            Warum HufiAi neue Maßstäbe in Tierwohl & Datensicherheit setzt.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Server, title: "Serverstandort: Frankfurt", desc: "Alle Daten werden ausschließlich in Deutschland (EU) gespeichert. Volle DSGVO/GDPR-Konformität." },
            { icon: Lock, title: "Deine Daten gehören dir", desc: "Gewerbe-Daten sind explizit vom KI-Training ausgeschlossen. Opt-in statt Opt-out." },
            { icon: Shield, title: "Verschlüsselung & Sicherheit", desc: "End-to-End-Verschlüsselung, Row-Level-Security und regelmäßige Sicherheitsaudits." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-secondary-foreground/60 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
