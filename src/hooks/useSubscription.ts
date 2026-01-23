import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  tier: "free" | "pro";
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
    };
  }

  return {
    subscribed: data?.subscribed ?? false,
    productId: data?.product_id ?? null,
    subscriptionEnd: data?.subscription_end ?? null,
    tier: data?.subscribed ? "pro" : "free",
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
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
  };

  return {
    ...query,
    isPro: query.data?.subscribed ?? false,
    tier: query.data?.tier ?? "free",
    subscriptionEnd: query.data?.subscriptionEnd,
    refreshSubscription,
  };
}

export function useSubscriptionActions() {
  const startCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });

    if (error) throw error;
    
    if (data?.url) {
      window.open(data.url, "_blank");
    }
    
    return data;
  };

  const openCustomerPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");

    if (error) throw error;
    
    if (data?.url) {
      window.open(data.url, "_blank");
    }
    
    return data;
  };

  return {
    startCheckout,
    openCustomerPortal,
  };
}
