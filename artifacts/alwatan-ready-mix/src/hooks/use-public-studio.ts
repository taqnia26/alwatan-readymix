import { useGetPublicStudio, getGetPublicStudioQueryKey } from '@workspace/api-client-react';
export function usePublicStudio() {
  return useGetPublicStudio({ query: { staleTime: 30_000, queryKey: getGetPublicStudioQueryKey() } });
}
