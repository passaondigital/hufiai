import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, Zap, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Cost per 1M tokens (USD)
const COST_MAP: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "google/gemini-2.5-pro": { input: 1.25, output: 10 },
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.6 },
  "google/gemini-3.1-pro-preview": { input: 1.25, output: 10 },
};

const DEFAULT_COST = { input: 0.5, output: 2 };

const PROVIDER_COLORS: Record<string, string> = {
  lovable_gateway: "hsl(var(--primary))",
  claude_api: "hsl(45, 90%, 50%)",
};

interface LogEntry {
  id: string;
  created_at: string;
  model_used: string | null;
  source: string | null;
  input_tokens: number;
  output_tokens: number;
}

function calcCost(model: string | null, inputTokens: number, outputTokens: number) {
  const rates = COST_MAP[model || ""] || DEFAULT_COST;
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

export default function ApiCostTracker() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    fetchLogs();
  }, [range]);

  const fetchLogs = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - parseInt(range));

    const { data, error } = await supabase
      .from("training_data_logs")
      .select("id, created_at, model_used, source, input_tokens, output_tokens")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (!error && data) setLogs(data as unknown as LogEntry[]);
    setLoading(false);
  };

  const stats = useMemo(() => {
    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;
    const byProvider: Record<string, { calls: number; cost: number; input: number; output: number }> = {};
    const byDay: Record<string, { date: string; cost: number; calls: number; input: number; output: number }> = {};

    for (const log of logs) {
      const inp = log.input_tokens || 0;
      const out = log.output_tokens || 0;
      totalInput += inp;
      totalOutput += out;
      const cost = calcCost(log.model_used, inp, out);
      totalCost += cost;

      const provider = log.source || "lovable_gateway";
      if (!byProvider[provider]) byProvider[provider] = { calls: 0, cost: 0, input: 0, output: 0 };
      byProvider[provider].calls++;
      byProvider[provider].cost += cost;
      byProvider[provider].input += inp;
      byProvider[provider].output += out;

      const day = log.created_at?.slice(0, 10) || "unknown";
      if (!byDay[day]) byDay[day] = { date: day, cost: 0, calls: 0, input: 0, output: 0 };
      byDay[day].cost += cost;
      byDay[day].calls++;
      byDay[day].input += inp;
      byDay[day].output += out;
    }

    const days = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    const daysCount = days.length || 1;
    const avgDailyCost = totalCost / daysCount;
    const monthlyProjection = avgDailyCost * 30;

    return { totalInput, totalOutput, totalCost, byProvider, days, monthlyProjection, avgDailyCost, totalCalls: logs.length };
  }, [logs]);

  const pieData = Object.entries(stats.byProvider).map(([name, v]) => ({
    name: name === "claude_api" ? "Claude" : "Lovable AI",
    value: parseFloat(v.cost.toFixed(4)),
    calls: v.calls,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> API-Kosten Tracker
        </h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Letzte 7 Tage</SelectItem>
            <SelectItem value="30">Letzte 30 Tage</SelectItem>
            <SelectItem value="90">Letzte 90 Tage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gesamtkosten", value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, sub: `${stats.totalCalls} Calls` },
          { label: "Ø Tageskosten", value: `$${stats.avgDailyCost.toFixed(4)}`, icon: BarChart3, sub: "pro Tag" },
          { label: "Monatsprognose", value: `$${stats.monthlyProjection.toFixed(2)}`, icon: TrendingUp, sub: "≈ 30 Tage" },
          { label: "Tokens gesamt", value: `${((stats.totalInput + stats.totalOutput) / 1000).toFixed(1)}k`, icon: Zap, sub: `${(stats.totalInput / 1000).toFixed(1)}k in / ${(stats.totalOutput / 1000).toFixed(1)}k out` },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Cost Bar Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tägliche Kosten ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(4)}`, "Kosten"]}
                    labelFormatter={(label) => `Datum: ${label}`}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Provider Pie Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kosten nach Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: $${value}`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={Object.values(PROVIDER_COLORS)[i] || "hsl(var(--muted))"}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `$${value.toFixed(4)} (${props.payload.calls} Calls)`,
                        name,
                      ]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Keine Daten
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Detail Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Provider-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3">Provider</th>
                  <th className="text-right py-2 px-3">Calls</th>
                  <th className="text-right py-2 px-3">Input Tokens</th>
                  <th className="text-right py-2 px-3">Output Tokens</th>
                  <th className="text-right py-2 px-3">Kosten</th>
                  <th className="text-right py-2 px-3">Ø pro Call</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byProvider).map(([name, v]) => (
                  <tr key={name} className="border-b border-border/50">
                    <td className="py-2 px-3 font-medium">
                      {name === "claude_api" ? "🧠 Claude" : "⚡ Lovable AI"}
                    </td>
                    <td className="text-right py-2 px-3">{v.calls}</td>
                    <td className="text-right py-2 px-3">{(v.input / 1000).toFixed(1)}k</td>
                    <td className="text-right py-2 px-3">{(v.output / 1000).toFixed(1)}k</td>
                    <td className="text-right py-2 px-3 font-medium">${v.cost.toFixed(4)}</td>
                    <td className="text-right py-2 px-3 text-muted-foreground">
                      ${(v.cost / (v.calls || 1)).toFixed(4)}
                    </td>
                  </tr>
                ))}
                {Object.keys(stats.byProvider).length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      Keine API-Calls im gewählten Zeitraum
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
