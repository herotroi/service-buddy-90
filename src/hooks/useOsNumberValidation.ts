import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface ExistingOrder {
  os_number: number;
  client_name: string;
  device_info: string;
}

interface UseOsNumberValidationProps {
  table: 'service_orders' | 'service_orders_informatica';
  currentOrderId?: string;
}

export const useOsNumberValidation = ({ table, currentOrderId }: UseOsNumberValidationProps) => {
  const [validating, setValidating] = useState(false);
  const { user } = useAuth();

  const checkOsNumberExists = async (osNumber: number): Promise<ExistingOrder | null> => {
    try {
      if (table === 'service_orders') {
        let query = supabase
          .from('service_orders')
          .select('id, os_number, client_name, device_model')
          .eq('os_number', osNumber)
          .eq('deleted', false);

        if (currentOrderId) {
          query = query.neq('id', currentOrderId);
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) return null;

        return {
          os_number: data.os_number,
          client_name: data.client_name,
          device_info: data.device_model || 'Não especificado',
        };
      } else {
        let query = supabase
          .from('service_orders_informatica')
          .select('id, os_number, client_name, equipment')
          .eq('os_number', osNumber)
          .eq('deleted', false);

        if (currentOrderId) {
          query = query.neq('id', currentOrderId);
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) return null;

        return {
          os_number: data.os_number,
          client_name: data.client_name,
          device_info: data.equipment || 'Não especificado',
        };
      }
    } catch (error) {
      console.error('Erro ao verificar número da OS:', error);
      return null;
    }
  };

  // Função atômica para buscar próximo número disponível usando a função do banco
  const getNextOsNumberFromDb = async (): Promise<number | null> => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase.rpc('get_next_os_number', {
        p_user_id: user.id,
        p_table: table
      });

      if (error) {
        console.error('Erro ao buscar próximo número da OS:', error);
        return null;
      }

      return data as number;
    } catch (error) {
      console.error('Erro ao buscar próximo número da OS:', error);
      return null;
    }
  };

  const findNextAvailableOsNumber = async (startingFrom: number): Promise<number> => {
    // Primeiro tenta usar a função do banco (mais segura para concorrência)
    const dbNextNumber = await getNextOsNumberFromDb();
    if (dbNextNumber && dbNextNumber > startingFrom) {
      return dbNextNumber;
    }
    
    // Fallback: busca local
    let currentNumber = Math.max(startingFrom, dbNextNumber || startingFrom);
    const maxAttempts = 100;

    for (let i = 0; i < maxAttempts; i++) {
      const exists = await checkOsNumberExists(currentNumber);
      if (!exists) {
        return currentNumber;
      }
      currentNumber++;
    }

    return currentNumber;
  };

  const validateAndGetAvailableOsNumber = async (
    osNumber: number,
    onConflict: (existingOrder: ExistingOrder, newNumber: number) => void
  ): Promise<{ valid: boolean; newNumber?: number }> => {
    setValidating(true);

    try {
      const existingOrder = await checkOsNumberExists(osNumber);

      if (existingOrder) {
        const nextAvailable = await findNextAvailableOsNumber(osNumber + 1);
        
        toast.error(
          `Este número de OS já foi cadastrado para o cliente '${existingOrder.client_name}', aparelho '${existingOrder.device_info}'.`,
          { duration: 5000 }
        );

        onConflict(existingOrder, nextAvailable);

        return { valid: false, newNumber: nextAvailable };
      }

      return { valid: true };
    } catch (error) {
      console.error('Erro na validação do número da OS:', error);
      return { valid: true };
    } finally {
      setValidating(false);
    }
  };

  const saveWithRetry = async <T extends { os_number: number }>(
    orderData: T,
    saveOperation: (data: T) => Promise<{ error: any; data?: any }>,
    maxRetries: number = 10 // Aumentado para 10 tentativas
  ): Promise<{ success: boolean; data?: any; finalOsNumber?: number }> => {
    let currentData = { ...orderData };
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;

      const result = await saveOperation(currentData);

      if (!result.error) {
        if (attempts > 1) {
          toast.success(`OS salva com o número ${currentData.os_number}`);
        }
        return { success: true, data: result.data, finalOsNumber: currentData.os_number };
      }

      // Verificar se é erro de constraint único (race condition)
      const isUniqueError = 
        result.error.code === '23505' || 
        result.error.message?.includes('unique') ||
        result.error.message?.includes('duplicate') ||
        result.error.message?.includes('user_os_number_unique');

      if (isUniqueError) {
        console.log(`[saveWithRetry] Tentativa ${attempts}: Conflito de número de OS ${currentData.os_number}, buscando próximo...`);
        
        // Buscar próximo número disponível usando a função do banco
        const nextNumber = await findNextAvailableOsNumber(currentData.os_number + 1);
        
        toast.warning(
          `Número de OS ${currentData.os_number} já está em uso. Tentando com ${nextNumber}...`,
          { duration: 2000 }
        );

        currentData = { ...currentData, os_number: nextNumber };
        
        // Pequeno delay para evitar race condition imediata
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      } else {
        // Erro não relacionado a constraint único
        console.error('[saveWithRetry] Erro não tratado:', result.error);
        return { success: false };
      }
    }

    toast.error('Não foi possível encontrar um número de OS disponível. Tente novamente.');
    return { success: false };
  };

  return {
    validating,
    checkOsNumberExists,
    findNextAvailableOsNumber,
    validateAndGetAvailableOsNumber,
    saveWithRetry,
    getNextOsNumberFromDb,
  };
};
