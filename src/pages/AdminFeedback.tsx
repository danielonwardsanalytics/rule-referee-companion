import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Filter, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminFeedback, useUpdateFeedbackStatus, exportFeedbackToCSV, FEEDBACK_CATEGORIES } from "@/hooks/useBetaFeedback";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'addressed', label: 'Addressed' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  reviewed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  addressed: 'bg-green-500/20 text-green-400 border-green-500/30',
  archived: 'bg-muted text-muted-foreground border-muted',
};

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: feedback, isLoading } = useAdminFeedback({
    category: categoryFilter,
    status: statusFilter,
  });

  const updateStatus = useUpdateFeedbackStatus();

  const handleExport = () => {
    if (feedback) {
      exportFeedbackToCSV(feedback);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ 
      id, 
      status, 
      admin_notes: adminNotes[id] 
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryData = (category: string) => {
    return FEEDBACK_CATEGORIES.find(c => c.value === category);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Beta Feedback</h1>
              <p className="text-xs text-muted-foreground">{feedback?.length || 0} submissions</p>
            </div>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 pb-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {FEEDBACK_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="p-4 space-y-3 pb-24">
        {feedback?.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No feedback yet</p>
          </div>
        ) : (
          feedback?.map((item) => {
            const categoryData = getCategoryData(item.category);
            const isExpanded = expandedId === item.id;

            return (
              <Card 
                key={item.id} 
                className="p-4 bg-card/50 border-border/50"
              >
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <span className="text-xl">{categoryData?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {categoryData?.label}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[item.status])}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className={cn(
                      "text-sm text-foreground/80",
                      !isExpanded && "line-clamp-2"
                    )}>
                      {item.feedback_text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(item.created_at), 'MMM d, h:mm a')}</span>
                      {item.page_url && <span className="truncate max-w-[120px]">{item.page_url}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Admin Notes
                      </label>
                      <Textarea
                        placeholder="Add notes..."
                        value={adminNotes[item.id] ?? item.admin_notes ?? ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={item.status === 'reviewed' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'reviewed')}
                        disabled={updateStatus.isPending}
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'addressed' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'addressed')}
                        disabled={updateStatus.isPending}
                      >
                        Addressed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(item.id, 'archived')}
                        disabled={updateStatus.isPending}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
