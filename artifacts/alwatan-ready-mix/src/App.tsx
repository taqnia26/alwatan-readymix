import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { LanguageProvider } from '@/lib/i18n';
import NotFound from '@/pages/not-found';

import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/layout/AdminLayout';

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

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminQuotes from '@/pages/admin/AdminQuotes';
import AdminContent from '@/pages/admin/AdminContent';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Admin Routes */}
        <Route path="/admin">
          <AdminLayout><AdminDashboard /></AdminLayout>
        </Route>
        <Route path="/admin/quotes">
          <AdminLayout><AdminQuotes /></AdminLayout>
        </Route>
        <Route path="/admin/content">
          <AdminLayout><AdminContent /></AdminLayout>
        </Route>

        <Route path="/">
          <Layout><Home /></Layout>
        </Route>

        {/* Public Routes */}
        <Route path="/:rest*">
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
              <Route path="/quote" component={Quote} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
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
