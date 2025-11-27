import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const getTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

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

interface LocalEquipamento {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const LocalEquipamentoTable = () => {
  const [locais, setLocais] = useState<LocalEquipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingLocal, setEditingLocal] = useState<LocalEquipamento | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    fetchLocais();
  }, []);

  const fetchLocais = async () => {
    try {
      const { data, error } = await supabase
        .from('local_equipamento')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocais(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar locais');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingLocal) {
        const { error } = await supabase
          .from('local_equipamento')
          .update(formData)
          .eq('id', editingLocal.id);

        if (error) throw error;
        toast.success('Local atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('local_equipamento')
          .insert([formData]);

        if (error) throw error;
        toast.success('Local adicionado com sucesso');
      }

      setShowDialog(false);
      setEditingLocal(null);
      setFormData({ name: '', color: '#3B82F6' });
      fetchLocais();
    } catch (error: any) {
      toast.error('Erro ao salvar local');
      console.error(error);
    }
  };

  const handleEdit = (local: LocalEquipamento) => {
    setEditingLocal(local);
    setFormData({
      name: local.name,
      color: local.color,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('local_equipamento')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Local excluído com sucesso');
      setDeleteId(null);
      fetchLocais();
    } catch (error: any) {
      toast.error('Erro ao excluir local');
      console.error(error);
    }
  };

  const filteredLocais = locais.filter(local =>
    local.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Buscar local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Local
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                  Nenhum local encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLocais.map((local) => (
                <TableRow key={local.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{local.name}</TableCell>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: local.color,
                        color: getTextColor(local.color)
                      }}
                      className="shadow-sm"
                    >
                      {local.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(local)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(local.id)}
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

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setEditingLocal(null);
          setFormData({ name: '', color: '#3B82F6' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocal ? 'Editar' : 'Novo'} Local do Equipamento</DialogTitle>
            <DialogDescription>
              Defina o nome e a cor do local.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Bancada"
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
                  color: getTextColor(formData.color)
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
              {editingLocal ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este local? Esta ação não pode ser desfeita.
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
