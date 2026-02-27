import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { mockDeals, mockMessages } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedDeal, setSelectedDeal] = useState(mockDeals[0]?.id || '');
  const [newMessage, setNewMessage] = useState('');

  const userDeals = user?.role === 'admin'
    ? mockDeals
    : mockDeals.filter(d => d.casinoId === user?.id || d.streamerId === user?.id);

  const messages = mockMessages.filter(m => m.dealId === selectedDeal);

  if (userDeals.length === 0) {
    return (
      <DashboardLayout>
        <EmptyState icon={<MessageSquare className="h-6 w-6" />} title="No conversations" description="Messages will appear when you have active deals." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-10rem)] rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        {/* Sidebar */}
        <div className="w-72 border-r border-border flex-shrink-0 hidden md:block">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Deal Threads</h2>
          </div>
          <div className="overflow-y-auto">
            {userDeals.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDeal(d.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border transition-colors",
                  selectedDeal === d.id ? "bg-accent" : "hover:bg-muted"
                )}
              >
                <p className="text-sm font-medium truncate">{d.campaignTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === 'streamer' ? d.casinoBrand : d.streamerName}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">{userDeals.find(d => d.id === selectedDeal)?.campaignTitle}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-xl px-4 py-2.5",
                    isMine ? "bg-gradient-brand text-primary-foreground" : "bg-muted"
                  )}>
                    <p className="text-xs font-medium opacity-70 mb-1">{msg.senderName}</p>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && setNewMessage('')} />
              <Button className="bg-gradient-brand hover:opacity-90" onClick={() => setNewMessage('')}>
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
