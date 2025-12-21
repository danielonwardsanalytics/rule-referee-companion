import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const FEEDBACK_CATEGORIES = [
  { value: 'bugs', emoji: '🚨', label: 'Bugs', description: 'Something broken, erroring, or not working as expected' },
  { value: 'confusing', emoji: '🤔', label: 'Confusing', description: 'Something unclear, hard to understand, or needs better explanation' },
  { value: 'user_flow', emoji: '🔄', label: 'User Flow / Usability', description: 'Navigation issues, awkward steps, or workflow improvements' },
  { value: 'design_ui', emoji: '🎨', label: 'Design / UI', description: 'Visual appearance, layout, colors, or styling feedback' },
  { value: 'performance', emoji: '⚡', label: 'Performance', description: 'Slow loading, lag, or responsiveness issues' },
  { value: 'feature_request', emoji: '💡', label: 'Feature Request', description: 'New functionality or enhancements you\'d like to see' },
  { value: 'beta_feedback', emoji: '🧪', label: 'Beta Feedback', description: 'Overall impressions, thoughts, or general beta testing notes' },
  { value: 'onboarding', emoji: '🧭', label: 'Onboarding', description: 'First-time user experience, setup, or learning curve' },
  { value: 'other', emoji: '📝', label: 'Other', description: 'Anything that doesn\'t fit the other categories' },
] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number]['value'];

interface FeedbackData {
  category: FeedbackCategory;
  feedback_text: string;
  page_url: string;
}

interface BetaFeedback {
  id: string;
  user_id: string;
  category: string;
  feedback_text: string;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const useBetaFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFeedback = useMutation({
    mutationFn: async (data: FeedbackData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('beta_feedback')
        .insert({
          user_id: user.id,
          category: data.category,
          feedback_text: data.feedback_text,
          page_url: data.page_url,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Thanks for your feedback!",
        description: "We appreciate you helping us improve.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { submitFeedback };
};

export const useAdminFeedback = (filters?: {
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  return useQuery({
    queryKey: ['admin-feedback', filters],
    queryFn: async () => {
      let query = supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BetaFeedback[];
    },
  });
};

export const useUpdateFeedbackStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ status, admin_notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: "Feedback updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const exportFeedbackToCSV = (feedback: BetaFeedback[]) => {
  const headers = ['Date', 'Category', 'Feedback', 'Page URL', 'Status', 'Admin Notes'];
  const rows = feedback.map(f => [
    new Date(f.created_at).toLocaleString(),
    FEEDBACK_CATEGORIES.find(c => c.value === f.category)?.label || f.category,
    `"${f.feedback_text.replace(/"/g, '""')}"`,
    f.page_url || '',
    f.status,
    f.admin_notes ? `"${f.admin_notes.replace(/"/g, '""')}"` : '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `beta-feedback-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
