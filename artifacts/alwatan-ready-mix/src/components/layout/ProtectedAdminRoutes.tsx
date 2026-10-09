import { Redirect, Route, Switch } from 'wouter';
import AdminLayout from './AdminLayout';
import AdminAuthGuard from './AdminAuthGuard';
import { StudioEditorProvider } from '@/hooks/use-studio-editor';
import NotFound from '@/pages/not-found';
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
import AdminPages from '@/pages/admin/AdminPages';
import AdminSliders from '@/pages/admin/AdminSliders';
import AdminMarketing from '@/pages/admin/AdminMarketing';
import AdminBranding from '@/pages/admin/AdminBranding';

export default function ProtectedAdminRoutes() {
  return (
    <AdminAuthGuard>
      <StudioEditorProvider>
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
            <Route path="/admin/pages" component={AdminPages} />
            <Route path="/admin/sliders" component={AdminSliders} />
            <Route path="/admin/marketing" component={AdminMarketing} />
            <Route path="/admin/branding" component={AdminBranding} />
            <Route path="/admin/settings"><Redirect to="/admin/branding" /></Route>
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </StudioEditorProvider>
    </AdminAuthGuard>
  );
}
