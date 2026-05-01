import { useQuery } from '@tanstack/react-query';
import type { Mission } from '../data';
import { apiCall } from '../lib';

export function useMissionsQuery() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: () => apiCall<Mission[]>('/api/missions'),
  });
}
