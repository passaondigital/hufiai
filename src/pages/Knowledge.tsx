import AppLayout from "@/components/AppLayout";
import { FileText } from "lucide-react";

export default function Knowledge() {
  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Wissensdatenbank</h1>
        <p className="text-muted-foreground mb-8">Lade Dokumente hoch, um die KI mit deinem Fachwissen zu trainieren.</p>
        <div className="text-center py-16 animate-fade-in">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Dokumenten-Upload wird in Kürze verfügbar sein.</p>
        </div>
      </div>
    </AppLayout>
  );
}
