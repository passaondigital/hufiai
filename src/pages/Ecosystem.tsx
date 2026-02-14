import AppLayout from "@/components/AppLayout";
import EcosystemConnect from "@/components/EcosystemConnect";

export default function Ecosystem() {
  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
        <EcosystemConnect />
      </div>
    </AppLayout>
  );
}
