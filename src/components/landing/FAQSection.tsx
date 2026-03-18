import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Brauche ich Vorwissen?",
    a: "Nein. Level 1 ist für absolute Anfänger. Kein Tech-Wissen nötig.",
  },
  {
    q: "Kostet das etwas?",
    a: "Nein, der Free Plan ist komplett kostenfrei. Für immer.",
  },
  {
    q: "Ist das sicher?",
    a: "Ja. DSGVO-konform, EU-Server, deine Daten sind safe.",
  },
  {
    q: "Kann ich mit Freunden zusammenarbeiten?",
    a: "Ja. Der Collaboration Mode existiert für Team Work.",
  },
  {
    q: "Wie schnell werde ich sicher mit KI?",
    a: "In 4 Wochen erreichst du Level 5 (Master).",
  },
  {
    q: "Was wenn mir HufiAi nicht passt?",
    a: "30-Tage Geld-zurück-Garantie. Kein Risiko.",
  },
];

export default function FAQSection() {
  return (
    <section className="max-w-3xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Häufige Fragen</h2>
        <p className="text-muted-foreground">Alles was du wissen musst.</p>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/30 transition-colors"
          >
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
