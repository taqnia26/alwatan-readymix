import { createContext } from 'react';

export const ProfilePageWindow = createContext<{
  current: number;
  warming: number | null;
  onReady: (index: number, ready: boolean) => void;
  onError: (index: number) => void;
  retry: number;
  retryPages: () => void;
}>({ current: 0, warming: null, onReady: () => {}, onError: () => {}, retry: 0, retryPages: () => {} });
