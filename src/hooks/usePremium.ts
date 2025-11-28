import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// DEVELOPMENT OVERRIDE - Set to true to bypass premium checks during development
const DEV_PREMIUM_ACCESS = true;

interface PremiumStatus {
  hasAccess: boolean;
  status: 'trial' | 'free' | 'premium' | 'cancelled';
  trialEndsAt: string | null;
  isTrial: boolean;
}

export const usePremium = () => {
  const { user } = useAuth();

  const { data: premiumStatus, isLoading } = useQuery({
    queryKey: ["premium-status", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc("get_premium_status", {
        _user_id: user.id,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const status = data[0];
        return {
          hasAccess: status.has_access,
          status: status.status,
          trialEndsAt: status.trial_ends_at,
          isTrial: status.is_trial,
        } as PremiumStatus;
      }

      return null;
    },
    enabled: !!user,
  });

  const daysLeftInTrial = premiumStatus?.isTrial && premiumStatus?.trialEndsAt
    ? Math.ceil(
        (new Date(premiumStatus.trialEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    premiumStatus,
    isLoading,
    hasPremiumAccess: DEV_PREMIUM_ACCESS || (premiumStatus?.hasAccess ?? false),
    isTrial: premiumStatus?.isTrial ?? false,
    isFree: premiumStatus?.status === 'free',
    isPremium: premiumStatus?.status === 'premium',
    daysLeftInTrial,
  };
};
