import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { useCommissions, useReportUploads, useDeals } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, BarChart3, Upload, Calculator } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { FileUpload } from '@/components/FileUpload';
import type { DealWithRelations, CommissionWithDeal } from '@/types/supabase-joins';

const ReportsPage = () => {
  const { user } = useAuth();
  const { data: commissions } = useCommissions();
  const { data: uploads } = useReportUploads();
  const { data: deals } = useDeals();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [computeOpen, setComputeOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState('');
  const [computeDeal, setComputeDeal] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [csvData, setCsvData] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [computing, setComputing] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const totalAmount = commissions?.reduce((s, c) => s + Number(c.amount), 0) || 0;
  const pendingCount = commissions?.filter(c => c.status === 'pending').length || 0;
  const approvedCount = commissions?.filter(c => c.status === 'approved').length || 0;

  const handleFileSelect = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    setCsvData(text);
  };

  const handleUpload = async () => {
    if (!selectedDeal || !csvData.trim()) return;
    setUploading(true);
    try {
      // Upload file to storage if we have one
      let fileUrl: string | null = null;
      if (csvFile && user?.organizationId) {
        const filePath = `reports/${user.organizationId}/${Date.now()}_${csvFile.name}`;
        const { error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, csvFile);
        if (!storageError) {
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        }
      }

      const lines = csvData.trim().split('\n').filter(l => l.trim());
      const rows = lines.map(line => {
        const [event_type, event_date, amount, player_id] = line.split(',').map(s => s.trim());
        return {
          event_type: event_type || 'ftd',
          event_date: event_date || new Date().toISOString().split('T')[0],
          amount: parseFloat(amount) || 0,
          player_id: player_id || null,
        };
      });

      const { data, error } = await supabase.functions.invoke('report-upload', {
        body: { deal_id: selectedDeal, rows, file_url: fileUrl },
      });

      if (error) throw error;
      toast({ title: 'Report uploaded', description: `${data.data.events_count} events processed` });
      setUploadOpen(false);
      setCsvData('');
      setCsvFile(null);
      qc.invalidateQueries({ queryKey: ['report_uploads'] });
      qc.invalidateQueries({ queryKey: ['commissions'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleCompute = async () => {
    if (!computeDeal) return;
    setComputing(true);
    try {
      const { data, error } = await supabase.functions.invoke('compute-commissions', {
        body: {
          deal_id: computeDeal,
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
        },
      });

      if (error) throw error;
      const result = data.data;
      toast({
        title: 'Commissions computed',
        description: `${result.commissions.length} commission(s) created from ${result.events_processed} events`,
      });
      setComputeOpen(false);
      qc.invalidateQueries({ queryKey: ['commissions'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Computation failed', description: message, variant: 'destructive' });
    }
    setComputing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{user?.role === 'streamer' ? 'Earnings' : 'Reports'}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'casino_manager' ? 'Upload and track campaign performance' : 'View your earnings and performance'}
            </p>
          </div>
          {user?.role === 'casino_manager' && (
            <div className="flex gap-2">
              <Button className="bg-gradient-brand hover:opacity-90" onClick={() => setUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />Upload Report
              </Button>
              <Button variant="outline" onClick={() => setComputeOpen(true)}>
                <Calculator className="mr-2 h-4 w-4" />Compute Commissions
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Commissions" value={`$${totalAmount.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="Pending" value={pendingCount} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Approved" value={approvedCount} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Reports Uploaded" value={uploads?.length || 0} icon={<Upload className="h-5 w-5" />} />
        </div>

        {uploads && uploads.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold mb-4">Upload History</h2>
            <div className="space-y-3">
              {uploads.map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{u.file_name}</p>
                    <p className="text-xs text-muted-foreground">{u.row_count} rows · {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {commissions && commissions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold mb-4">Commission History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map((c: CommissionWithDeal) => (
                    <tr key={c.id}>
                      <td className="py-3 font-medium">{c.deals?.campaigns?.title || 'Direct Deal'}</td>
                      <td className="py-3">${Number(c.amount).toLocaleString()}</td>
                      <td className="py-3"><StatusBadge status={c.status} /></td>
                      <td className="py-3 text-muted-foreground">{c.period_start || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Upload Performance Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Deal</Label>
              <Select value={selectedDeal} onValueChange={setSelectedDeal}>
                <SelectTrigger><SelectValue placeholder="Choose a deal..." /></SelectTrigger>
                <SelectContent>
                  {(deals || []).map((d: DealWithRelations) => (
                    <SelectItem key={d.id} value={d.id}>{d.campaigns?.title || 'Direct Deal'} — ${Number(d.value).toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".csv"
                maxSizeMB={10}
                label="Drop your CSV file here or click to browse"
                selectedFile={csvFile}
                onClear={() => { setCsvFile(null); setCsvData(''); }}
              />
            </div>
            {!csvFile && (
              <div className="space-y-2">
                <Label>Or Paste CSV Data</Label>
                <p className="text-xs text-muted-foreground">Format: event_type, event_date, amount, player_id (one per line)</p>
                <Textarea
                  value={csvData}
                  onChange={e => setCsvData(e.target.value)}
                  placeholder={`ftd,2026-02-15,100,player_001\ndeposit,2026-02-16,50,player_002`}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            )}
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleUpload}
              disabled={uploading || !selectedDeal || !csvData.trim()}
            >
              {uploading ? 'Processing...' : 'Upload & Process'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={computeOpen} onOpenChange={setComputeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Compute Commissions</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Deal</Label>
              <Select value={computeDeal} onValueChange={setComputeDeal}>
                <SelectTrigger><SelectValue placeholder="Choose a deal..." /></SelectTrigger>
                <SelectContent>
                  {(deals || []).map((d: DealWithRelations) => (
                    <SelectItem key={d.id} value={d.id}>{d.campaigns?.title || 'Direct Deal'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Period Start</Label>
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Period End</Label>
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave dates empty to compute for all conversion events.</p>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleCompute}
              disabled={computing || !computeDeal}
            >
              {computing ? 'Computing...' : 'Compute Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReportsPage;
