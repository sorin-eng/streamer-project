import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ContractBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealType: string;
  dealValue: number;
}

export const ContractBuilder: React.FC<ContractBuilderProps> = ({
  open, onOpenChange, dealId, dealType, dealValue,
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('Partnership Agreement');
  const [duration, setDuration] = useState('3 months');
  const [commissionType, setCommissionType] = useState(dealType);
  const [cpaAmount, setCpaAmount] = useState('');
  const [revsharePct, setRevsharePct] = useState('');
  const [specialClauses, setSpecialClauses] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    try {
      const termsJson: Record<string, unknown> = {
        deal_type: commissionType,
        deal_value: dealValue,
        duration,
        commission_structure: {} as Record<string, unknown>,
        special_clauses: specialClauses || null,
        created_at: new Date().toISOString(),
      };

      if (commissionType === 'cpa' || commissionType === 'hybrid') {
        (termsJson.commission_structure as Record<string, unknown>).cpa_amount = Number(cpaAmount) || 0;
      }
      if (commissionType === 'revshare' || commissionType === 'hybrid') {
        (termsJson.commission_structure as Record<string, unknown>).revshare_pct = Number(revsharePct) || 0;
      }

      const { error } = await supabase.from('contracts').insert({
        deal_id: dealId,
        title,
        terms_json: termsJson,
        status: 'draft',
      });

      if (error) throw error;

      toast({ title: 'Contract created' });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create contract';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Contract</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Contract Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="3 months" />
            </div>
            <div className="space-y-2">
              <Label>Commission Type</Label>
              <Select value={commissionType} onValueChange={setCommissionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpa">CPA</SelectItem>
                  <SelectItem value="revshare">RevShare</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="flat_fee">Flat Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(commissionType === 'cpa' || commissionType === 'hybrid') && (
            <div className="space-y-2">
              <Label>CPA Amount ($)</Label>
              <Input type="number" value={cpaAmount} onChange={e => setCpaAmount(e.target.value)} placeholder="50" />
            </div>
          )}
          {(commissionType === 'revshare' || commissionType === 'hybrid') && (
            <div className="space-y-2">
              <Label>RevShare Percentage (%)</Label>
              <Input type="number" value={revsharePct} onChange={e => setRevsharePct(e.target.value)} placeholder="25" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Special Clauses</Label>
            <Textarea value={specialClauses} onChange={e => setSpecialClauses(e.target.value)} rows={3} placeholder="Any additional terms or conditions..." />
          </div>
          <Button
            className="w-full bg-gradient-brand hover:opacity-90"
            onClick={handleCreate}
            disabled={creating || !title.trim()}
          >
            {creating ? 'Creating...' : 'Create Contract'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
