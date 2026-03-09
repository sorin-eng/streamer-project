import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LockedLinkProps {
  platform: string;
}

export const LockedLink = ({ platform }: LockedLinkProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed">
          <Lock className="h-3 w-3" />{platform}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Available after deal activation</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
