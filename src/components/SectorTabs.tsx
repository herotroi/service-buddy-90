import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSector, Sector } from '@/hooks/useSector';
import { Smartphone, Monitor } from 'lucide-react';

export const SectorTabs = () => {
  const { sector, setSector } = useSector();

  return (
    <Tabs value={sector} onValueChange={(value) => setSector(value as Sector)} className="w-full">
      <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-2">
        <TabsTrigger value="celulares" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="truncate">Celulares</span>
        </TabsTrigger>
        <TabsTrigger value="informatica" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="truncate">Informática</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
