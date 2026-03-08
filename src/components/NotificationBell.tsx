import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications?.length || 0;

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const handleClick = async (notif: NonNullable<typeof notifications>[number]) => {
    await markRead.mutateAsync(notif.id);
    setOpen(false);
    if (notif.entity_type === 'deal' && notif.entity_id) {
      navigate(`/messages?deal=${notif.entity_id}`);
    } else if (notif.entity_type === 'campaign' && notif.entity_id) {
      navigate('/campaigns');
    } else {
      navigate('/deals');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {unreadCount === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">All caught up!</p>
          ) : (
            notifications?.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                )}
              >
                <p className="text-sm font-medium">{notif.title}</p>
                {notif.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
