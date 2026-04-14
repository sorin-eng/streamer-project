import { isMockMode } from '@/data/dataMode';
import type { AppDataService } from '@/core/services/appDataService';
import type { AppAuthService } from '@/core/services/authService';
import { mockAppDataService } from '@/core/services/mock/mockAppDataService';
import { mockAuthService } from '@/core/services/mock/mockAuthService';
import { supabaseAppDataService } from '@/core/services/supabase/supabaseAppDataService';
import { supabaseAuthService } from '@/core/services/supabase/supabaseAuthService';

let cachedDataService: AppDataService | null = null;
let cachedAuthService: AppAuthService | null = null;

export function getAppDataService(): AppDataService {
  if (cachedDataService) {
    return cachedDataService;
  }

  cachedDataService = isMockMode() ? mockAppDataService : supabaseAppDataService;
  return cachedDataService;
}

export function getAuthService(): AppAuthService {
  if (cachedAuthService) {
    return cachedAuthService;
  }

  cachedAuthService = isMockMode() ? mockAuthService : supabaseAuthService;
  return cachedAuthService;
}

export function resetServiceRegistry() {
  cachedDataService = null;
  cachedAuthService = null;
}
