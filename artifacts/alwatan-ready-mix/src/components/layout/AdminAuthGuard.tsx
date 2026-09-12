import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetAuthMe } from '@workspace/api-client-react';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: me, isLoading, error } = useGetAuthMe();

  useEffect(() => {
    if (!isLoading && (error || !me)) {
      setLocation('/admin/login');
    }
  }, [isLoading, me, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !me) {
    return null;
  }

  return <>{children}</>;
}
