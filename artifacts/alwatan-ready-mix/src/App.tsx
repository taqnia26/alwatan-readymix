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
import AdminAuthGuard from '@/components/layout/AdminAuthGuard';

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

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminQuotes from '@/pages/admin/AdminQuotes';
import AdminContent from '@/pages/admin/AdminContent';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminArticles from '@/pages/admin/AdminArticles';
import AdminBranches from '@/pages/admin/AdminBranches';
import AdminCertificates from '@/pages/admin/AdminCertificates';
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminSettings from '@/pages/admin/AdminSettings';

const queryClient = new QueryClient();

function ProtectedAdminRoutes() {
  return (
    <AdminAuthGuard>
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/quotes" component={AdminQuotes} />
          <Route path="/admin/content" component={AdminContent} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/articles" component={AdminArticles} />
          <Route path="/admin/branches" component={AdminBranches} />
          <Route path="/admin/certificates" component={AdminCertificates} />
          <Route path="/admin/media" component={AdminMedia} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/messages" component={AdminMessages} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    </AdminAuthGuard>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
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
