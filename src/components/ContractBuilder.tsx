import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { createContractDraft } from '@/core/services/platformService';
import { validateContractDraftInput } from '@/lib/contractValidation';

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
    const termsJson: Record<string, unknown> = {
      deal_type: commissionType,
      deal_value: dealValue,
      duration: duration.trim(),
      commission_structure: {} as Record<string, unknown>,
      special_clauses: specialClauses.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (commissionType === 'cpa' || commissionType === 'hybrid') {
      (termsJson.commission_structure as Record<string, unknown>).cpa_amount = Number(cpaAmount) || 0;
    }
    if (commissionType === 'revshare' || commissionType === 'hybrid') {
      (termsJson.commission_structure as Record<string, unknown>).revshare_pct = Number(revsharePct) || 0;
    }

    try {
      const validated = validateContractDraftInput({ title, termsJson });
      setCreating(true);
      await createContractDraft({ dealId, title: validated.title, termsJson: termsJson as any });

      toast({ title: 'Contract created and sent for signature' });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
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
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
          <DialogDescription>Turn the current deal into a signable agreement with explicit payout terms.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-title">Contract Title</Label>
            <Input id="contract-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contract-duration">Duration</Label>
              <Input id="contract-duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="3 months" />
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
              <Label htmlFor="contract-cpa-amount">CPA Amount ($)</Label>
              <Input id="contract-cpa-amount" type="number" value={cpaAmount} onChange={e => setCpaAmount(e.target.value)} placeholder="50" />
            </div>
          )}
          {(commissionType === 'revshare' || commissionType === 'hybrid') && (
            <div className="space-y-2">
              <Label htmlFor="contract-revshare-pct">RevShare Percentage (%)</Label>
              <Input id="contract-revshare-pct" type="number" value={revsharePct} onChange={e => setRevsharePct(e.target.value)} placeholder="25" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="contract-special-clauses">Special Clauses</Label>
            <Textarea id="contract-special-clauses" value={specialClauses} onChange={e => setSpecialClauses(e.target.value)} rows={3} placeholder="Any additional terms or conditions..." />
          </div>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleCreate}
            disabled={creating || !title.trim() || !duration.trim()}
          >
            {creating ? 'Creating...' : 'Create Contract'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
