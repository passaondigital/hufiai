export default function MissionSection() {
  return (
    <section className="max-w-4xl mx-auto py-16 px-6">
      <div className="bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Warum ich HufiAi gebaut habe
        </h2>
        <div className="max-w-2xl mx-auto space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed text-left">
          <p>
            HufManager war mein Betriebssystem. Aber ich sah ein Problem in der Branche: <strong className="text-foreground">Angst.</strong>
          </p>
          <p>
            Angst vor KI. Angst vor Ver\u00e4nderung. Angst vor Technologie. Die meisten Menschen in der Pferdewelt haben Angst vor KI. Sie verstehen es nicht. Sie trauen sich nicht. Sie haben keine Guides.
          </p>
          <p>
            Und dann kam mir die Idee: <em>Was wenn ich eine KI-Plattform baue, die NICHT einsch\u00fcchternd ist? F\u00fcr die Pferdebranche? Mit Gamification, Learning Paths, und Transparenz von Anfang an?</em>
          </p>
          <p className="font-medium text-foreground">
            Es ist nicht ChatGPT f\u00fcr Pferde. Es ist ein KI-Coach der dir die Angst nimmt. Ein Lernbegleiter der dir Selbstvertrauen gibt. Ein System das transparent, sicher und FAIR ist.
          </p>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-primary font-bold text-sm">
            Entferne die Angst. Baue Vertrauen. Empowere Menschen.
          </p>
          <p className="text-xs text-muted-foreground mt-1">Das ist nicht nur Business. Das ist mein Lebenswerk.</p>
        </div>
      </div>
    </section>
  );
}
