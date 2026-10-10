import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { LanguageProvider } from '@/lib/i18n';
import NotFound from '@/pages/not-found';

import Layout from '@/components/layout/Layout';

import Home from '@/pages/public/Home';
import About from '@/pages/public/About';
import Products from '@/pages/public/Products';
import ProductDetail from '@/pages/public/ProductDetail';
import Branches from '@/pages/public/Branches';
import Certificates from '@/pages/public/Certificates';
import Blog from '@/pages/public/Blog';
import BlogPostDetail from '@/pages/public/BlogPostDetail';
import Contact from '@/pages/public/Contact';
import Quote from '@/pages/public/Quote';
import CompanyProfile from '@/pages/public/CompanyProfile';

const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const ProtectedAdminRoutes = lazy(() => import('@/components/layout/ProtectedAdminRoutes'));
import StudioPage from '@/pages/public/StudioPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Suspense fallback={<div role="status" className="flex min-h-[60vh] items-center justify-center gap-3 text-primary"><span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />جارٍ التحميل / Loading</div>}>
      <Switch>
        {/* Admin Login Route */}
        <Route path="/admin/login" component={AdminLogin} />

        {/* Protected Admin Routes */}
        <Route path="/admin">
          <ProtectedAdminRoutes />
        </Route>
        <Route path="/admin/:rest*">
          <ProtectedAdminRoutes />
        </Route>

        {/* Public Routes */}
        {/* Pathless fallback also matches "/", unlike "/:rest*" which only
            matches URLs containing at least one path segment. */}
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/about" component={About} />
              <Route path="/products" component={Products} />
              <Route path="/products/:slug" component={ProductDetail} />
              <Route path="/branches" component={Branches} />
              <Route path="/certificates" component={Certificates} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={BlogPostDetail} />
              <Route path="/contact" component={Contact} />
              <Route path="/company-profile" component={CompanyProfile} />
              <Route path="/quote" component={Quote} />
              <Route path="/p/:slug">{() => <StudioPage />}</Route>
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
      </Suspense>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
