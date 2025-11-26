import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading, refetch } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Subscription check error:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  const startCheckout = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Opening checkout in new tab...");
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout. Please try again.");
    },
  });

  const openCustomerPortal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Opening subscription management...");
      }
    },
    onError: (error) => {
      console.error('Portal error:', error);
      toast.error("Failed to open subscription management. Please try again.");
    },
  });

  const refreshSubscription = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["premium-status"] });
  };

  return {
    subscriptionData,
    isLoading,
    startCheckout: startCheckout.mutate,
    isCheckoutLoading: startCheckout.isPending,
    openCustomerPortal: openCustomerPortal.mutate,
    isPortalLoading: openCustomerPortal.isPending,
    refreshSubscription,
  };
};
