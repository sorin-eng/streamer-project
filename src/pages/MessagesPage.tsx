import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useDeals, useDealMessages, useSendMessage } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: deals } = useDeals();
  const [selectedDeal, setSelectedDeal] = useState<string | null>(searchParams.get('deal'));
  const { data: messages } = useDealMessages(selectedDeal);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!selectedDeal && deals?.length) {
      setSelectedDeal(deals[0].id);
    }
  }, [deals, selectedDeal]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedDeal) return;
    const channel = supabase
      .channel(`messages-${selectedDeal}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${selectedDeal}` }, () => {
        // refetch handled by react-query polling
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDeal]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedDeal) return;
    await sendMessage.mutateAsync({ dealId: selectedDeal, content: newMessage });
    setNewMessage('');
  };

  if (!deals?.length) {
    return (
      <DashboardLayout>
        <EmptyState icon={<MessageSquare className="h-6 w-6" />} title="No conversations" description="Messages will appear when you have active deals." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-10rem)] rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <div className="w-72 border-r border-border flex-shrink-0 hidden md:block">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Deal Threads</h2>
          </div>
          <div className="overflow-y-auto">
            {deals.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDeal(d.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border transition-colors",
                  selectedDeal === d.id ? "bg-accent" : "hover:bg-muted"
                )}
              >
                <p className="text-sm font-medium truncate">{(d.campaigns as any)?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === 'streamer' ? (d.organizations as any)?.name : (d.profiles as any)?.display_name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">{deals.find(d => d.id === selectedDeal)?.campaigns?.title || 'Select a deal'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(messages || []).map(msg => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-xl px-4 py-2.5",
                    isMine ? "bg-gradient-brand text-primary-foreground" : "bg-muted"
                  )}>
                    <p className="text-xs font-medium opacity-70 mb-1">{(msg.profiles as any)?.display_name}</p>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <Button className="bg-gradient-brand hover:opacity-90" onClick={handleSend} disabled={sendMessage.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
