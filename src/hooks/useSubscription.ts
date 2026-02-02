import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  tier: "free" | "pro";
  cancelAtPeriodEnd: boolean;
  priceAmount: number | null;
  interval: string | null;
}

export const subscriptionKeys = {
  status: ["subscription-status"] as const,
};

async function checkSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data, error } = await supabase.functions.invoke("check-subscription");
  
  if (error) {
    console.error("Error checking subscription:", error);
    return {
      subscribed: false,
      productId: null,
      subscriptionEnd: null,
      tier: "free",
      cancelAtPeriodEnd: false,
      priceAmount: null,
      interval: null,
    };
  }

  return {
    subscribed: data?.subscribed ?? false,
    productId: data?.product_id ?? null,
    subscriptionEnd: data?.subscription_end ?? null,
    tier: data?.subscribed ? "pro" : "free",
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    priceAmount: data?.price_amount ?? null,
    interval: data?.interval ?? null,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: subscriptionKeys.status,
    queryFn: checkSubscriptionStatus,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true, // Auto-refresh when user returns to tab
    retry: 1,
  });

  const refreshSubscription = async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
    return queryClient.refetchQueries({ queryKey: subscriptionKeys.status });
  };

  return {
    ...query,
    isPro: query.data?.subscribed ?? false,
    tier: query.data?.tier ?? "free",
    subscriptionEnd: query.data?.subscriptionEnd,
    cancelAtPeriodEnd: query.data?.cancelAtPeriodEnd ?? false,
    refreshSubscription,
  };
}

export function useSubscriptionActions() {
  const queryClient = useQueryClient();

  const startCheckout = async (isYearly: boolean = false) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { isYearly },
    });

    if (error) throw error;
    
    if (data?.url) {
      window.location.href = data.url;
    }
    
    return data;
  };

  const openCustomerPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");

    if (error) throw error;
    
    if (data?.url) {
      window.location.href = data.url;
    }
    
    return data;
  };

  const refreshAfterCheckout = async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
    return queryClient.refetchQueries({ queryKey: subscriptionKeys.status });
  };

  return {
    startCheckout,
    openCustomerPortal,
    refreshAfterCheckout,
  };
}
