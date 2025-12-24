import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
            <div className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <SidebarTrigger className="shrink-0" />
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-primary rounded-lg shrink-0">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Assistência Técnica</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">Sistema de Gestão</p>
                  </div>
                </div>
              </div>
              <Button onClick={signOut} variant="outline" size="sm" className="shrink-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
