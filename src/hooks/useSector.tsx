import { useState, createContext, useContext, ReactNode } from 'react';

export type Sector = 'celulares' | 'informatica';

const SectorContext = createContext<{
  sector: Sector;
  setSector: (sector: Sector) => void;
} | null>(null);

export const SectorProvider = ({ children }: { children: ReactNode }) => {
  const [sector, setSector] = useState<Sector>(() => {
    const stored = localStorage.getItem('selected-sector');
    return (stored as Sector) || 'celulares';
  });

  const handleSetSector = (newSector: Sector) => {
    setSector(newSector);
    localStorage.setItem('selected-sector', newSector);
  };

  return (
    <SectorContext.Provider value={{ sector, setSector: handleSetSector }}>
      {children}
    </SectorContext.Provider>
  );
};

export const useSector = () => {
  const context = useContext(SectorContext);
  if (!context) {
    throw new Error('useSector must be used within a SectorProvider');
  }
  return context;
};
