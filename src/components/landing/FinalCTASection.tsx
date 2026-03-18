import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Fall in Love with AI?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-2">
          Starte kostenlos. Keine Kreditkarte nötig.
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto mb-2">
          30 Tage Geld-zurück-Garantie.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Tausende glückliche User. Einer davon könntest du sein.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-10">
            Kostenlos Starten <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <button
            onClick={() => document.getElementById("about-pascal")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm font-medium text-primary hover:underline"
          >
            Meine Story lesen →
          </button>
        </div>
      </div>
    </section>
  );
}
