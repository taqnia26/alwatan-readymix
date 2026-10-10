import { useGetPublicStudio, getGetPublicStudioQueryKey } from '@workspace/api-client-react';
export function usePublicStudio() {
  return useGetPublicStudio({ query: {
    staleTime: 15_000, refetchOnMount: 'always', refetchOnWindowFocus: true,
    refetchInterval: 30_000, queryKey: getGetPublicStudioQueryKey(),
  } });
}
