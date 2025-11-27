import { ClipboardList, Users, Tag, Package, Settings, MapPin } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useSector } from '@/hooks/useSector';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { open } = useSidebar();
  const { sector } = useSector();

  const items = [
    { title: 'Ordens de Serviço', url: '/', icon: ClipboardList },
    { title: 'Funcionários', url: '/funcionarios', icon: Users },
    { title: 'Situações', url: '/situacoes', icon: Tag },
    { title: 'Retirada', url: '/retirada', icon: Package },
    ...(sector === 'informatica' ? [{ title: 'Local Equipamento', url: '/local-equipamento', icon: MapPin }] : []),
    { title: 'Configurações', url: '/configuracoes', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className="flex items-center gap-3"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
