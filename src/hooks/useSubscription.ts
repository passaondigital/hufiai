import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  plan: string;
  social_media_addon: boolean;
  founder_flow_active: boolean;
  founder_flow_started_at: string | null;
  founder_flow_expires_at: string | null;
  expires_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSubscription(null); setLoading(false); return; }

    supabase
      .from("user_subscriptions")
      .select("plan, social_media_addon, founder_flow_active, founder_flow_started_at, founder_flow_expires_at, expires_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data as Subscription | null);
        setLoading(false);
      });
  }, [user]);

  const isFounderFlowActive = subscription?.founder_flow_active &&
    subscription?.founder_flow_expires_at &&
    new Date(subscription.founder_flow_expires_at) > new Date();

  const founderFlowDaysLeft = isFounderFlowActive && subscription?.founder_flow_expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.founder_flow_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const effectivePlan = subscription?.plan || "free";

  const hasGewerbeAccess = effectivePlan === "gewerbe_pro" || effectivePlan === "gewerbe_team" || isFounderFlowActive;

  return { subscription, loading, isFounderFlowActive, founderFlowDaysLeft, effectivePlan, hasGewerbeAccess };
}
