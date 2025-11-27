import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSector, Sector } from '@/hooks/useSector';
import { Smartphone, Monitor } from 'lucide-react';

export const SectorTabs = () => {
  const { sector, setSector } = useSector();

  return (
    <Tabs value={sector} onValueChange={(value) => setSector(value as Sector)} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="celulares" className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Celulares
        </TabsTrigger>
        <TabsTrigger value="informatica" className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Informática
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
