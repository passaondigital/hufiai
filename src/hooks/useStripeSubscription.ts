import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

// Stripe product → plan mapping
// These are the Stripe product IDs created for HufiAi
const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_TyUNeDWvGWGGWl: "privat_plus",
  prod_TyTqpIcDxURUJ4: "gewerbe_pro",
  prod_TyTqCg4deHyNKj: "gewerbe_team",
};

interface StripeSubscriptionState {
  subscribed: boolean;
  productId: string | null;
  plan: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useStripeSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<StripeSubscriptionState>({
    subscribed: false,
    productId: null,
    plan: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, productId: null, plan: null, subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const plan = data?.product_id ? PRODUCT_TO_PLAN[data.product_id] || null : null;
      setState({
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        plan,
        subscriptionEnd: data?.subscription_end || null,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return { ...state, refresh: checkSubscription };
}

// Plan → Price ID mapping for checkout
export const PLAN_PRICES: Record<string, string> = {
  privat_plus: "price_1T0XarHvMPLLWloqLiEG4Rp9",
  gewerbe_pro: "price_1T0XQjHvMPLLWloqnmCbmKWn",
  gewerbe_team: "price_1T0XPeHvMPLLWloqwhawDPi4",
};

// Note: The price IDs above are placeholders. They need to be replaced
// with actual Stripe price IDs from the Stripe Dashboard.
// The products have been created:
// - HufiAi Privat Plus (prod_TyTohMqivbT1AJ) → 9,99€/month
// - HufiAi Gewerbe Pro (prod_TyTqpIcDxURUJ4) → 24,99€/month
// - HufiAi Gewerbe Team (prod_TyTqCg4deHyNKj) → 49,00€/month
