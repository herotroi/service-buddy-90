import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WithdrawalSituation {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const WithdrawalSituationsTable = () => {
  const [situations, setSituations] = useState<WithdrawalSituation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSituation, setEditingSituation] = useState<WithdrawalSituation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
  });

  useEffect(() => {
    fetchSituations();
  }, []);

  const fetchSituations = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_situations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSituations(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar situações de retirada');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingSituation) {
        const { error } = await supabase
          .from('withdrawal_situations')
          .update(formData)
          .eq('id', editingSituation.id);

        if (error) throw error;
        toast.success('Situação atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('withdrawal_situations')
          .insert([formData]);

        if (error) throw error;
        toast.success('Situação adicionada com sucesso');
      }

      setShowDialog(false);
      setEditingSituation(null);
      setFormData({ name: '', color: '#6B7280' });
      fetchSituations();
    } catch (error: any) {
      toast.error('Erro ao salvar situação');
      console.error(error);
    }
  };

  const handleEdit = (situation: WithdrawalSituation) => {
    setEditingSituation(situation);
    setFormData({
      name: situation.name,
      color: situation.color,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('withdrawal_situations')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Situação excluída com sucesso');
      setDeleteId(null);
      fetchSituations();
    } catch (error: any) {
      toast.error('Erro ao excluir situação');
      console.error(error);
    }
  };

  const filteredSituations = situations.filter(sit =>
    sit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar situação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Situação
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Cor</TableHead>
              <TableHead className="font-semibold">Preview</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSituations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Nenhuma situação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredSituations.map((situation) => (
                <TableRow key={situation.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{situation.name}</TableCell>
                  <TableCell className="font-mono text-sm">{situation.color}</TableCell>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: situation.color,
                        color: '#ffffff'
                      }}
                      className="shadow-sm"
                    >
                      {situation.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(situation)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(situation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setEditingSituation(null);
          setFormData({ name: '', color: '#6B7280' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSituation ? 'Editar' : 'Nova'} Situação de Retirada</DialogTitle>
            <DialogDescription>
              Defina o nome e a cor da situação de retirada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: RETIRADO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor *</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#000000"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label className="text-sm text-muted-foreground mb-2 block">Preview:</Label>
              <Badge 
                style={{ 
                  backgroundColor: formData.color,
                  color: '#ffffff'
                }}
                className="shadow-sm"
              >
                {formData.name || 'Preview'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingSituation ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta situação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
