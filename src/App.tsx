import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import CustomerAccessPage from "@/pages/auth/CustomerAccessPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import CustomerLayout from "@/components/layout/CustomerLayout";
import SellerLayout from "@/components/layout/SellerLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import HomePage from "@/pages/customer/HomePage";
import AddressesPage from "@/pages/customer/AddressesPage";
import StoreListPage from "@/pages/customer/StoreListPage";
import StoreDetailPage from "@/pages/customer/StoreDetailPage";
const CreateSubscriptionPage = lazy(() => import("@/pages/customer/CreateSubscriptionPage"));
import SubscriptionsPage from "@/pages/customer/SubscriptionsPage";
const SubscriptionDetailPage = lazy(() => import("@/pages/customer/SubscriptionDetailPage"));
import ProfilePage from "@/pages/customer/ProfilePage";
import NotificationsPage from "@/pages/customer/NotificationsPage";
import FavoritesPage from "@/pages/customer/FavoritesPage";
import PaymentsPage from "@/pages/customer/PaymentsPage";
import PaymentMethodsPage from "@/pages/customer/PaymentMethodsPage";
const SupportPage = lazy(() => import("@/pages/customer/SupportPage"));
const AccountSecurityPage = lazy(
  () => import("@/pages/customer/AccountSecurityPage"),
);
import SubscriptionActionRedirect from "@/pages/customer/SubscriptionActionRedirect";
const SellerDashboard = lazy(() => import("@/pages/seller/SellerDashboard"));
import SellerDashboardEntryPage from "@/pages/seller/SellerDashboardEntryPage";
import SellerStoresListPage from "@/pages/seller/SellerStoresListPage";
import SellerStoreDetailLayout from "@/pages/seller/SellerStoreDetailLayout";
const StoreShowcasePage = lazy(() => import("@/pages/seller/StoreShowcasePage"));
import StorePendingPage from "@/pages/seller/StorePendingPage";
const StoreSubscriptionsPage = lazy(
  () => import("@/pages/seller/StoreSubscriptionsPage"),
);
const StoreDailyOrdersPage = lazy(
  () => import("@/pages/seller/StoreDailyOrdersPage"),
);
const StoreSettingsPage = lazy(
  () => import("@/pages/seller/StoreSettingsPage"),
);
import StoreReviewsPage from "@/pages/seller/StoreReviewsPage";
import StoreComplaintsPage from "@/pages/seller/StoreComplaintsPage";
import StoreOrderHistoryPage from "@/pages/seller/StoreOrderHistoryPage";
const StoreFinancePage = lazy(() => import("@/pages/seller/StoreFinancePage"));
const StoreAnalyticsPage = lazy(
  () => import("@/pages/seller/StoreAnalyticsPage"),
);
import StoreDocumentsPage from "@/pages/seller/StoreDocumentsPage";
import StoreStaffPage from "@/pages/seller/StoreStaffPage";
import StoreCampaignsPage from "@/pages/seller/StoreCampaignsPage";
import AppErrorBoundary from "@/components/common/AppErrorBoundary";
import StoreSubscriptionDetailPage from "@/pages/seller/StoreSubscriptionDetailPage";
const StoreProductionPage = lazy(
  () => import("@/pages/seller/StoreProductionPage"),
);
const StoreCouriersPage = lazy(
  () => import("@/pages/seller/StoreCouriersPage"),
);
import SellerProfilePage from "@/pages/seller/SellerProfilePage";
import SellerNotificationsPage from "@/pages/seller/SellerNotificationsPage";
import SellerOnboardingPage from "@/pages/seller/SellerOnboardingPage";
import SellerSupportPage from "@/pages/seller/SellerSupportPage";
import SellerAccountSecurityPage from "@/pages/seller/SellerAccountSecurityPage";
import CourierWorkspacePage from "@/pages/courier/CourierWorkspacePage";
const AcceptStaffInvitationPage = lazy(
  () => import("@/pages/staff/AcceptStaffInvitationPage"),
);
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage";
import AdminStoresPage from "@/pages/admin/AdminStoresPage";
import AdminStoreDetailPage from "@/pages/admin/AdminStoreDetailPage";
import AdminSubscriptionsPage from "@/pages/admin/AdminSubscriptionsPage";
import AdminFinancePage from "@/pages/admin/AdminFinancePage";
import AdminReconciliationPage from "@/pages/admin/AdminReconciliationPage";
import AdminComplaintsPage from "@/pages/admin/AdminComplaintsPage";
import AdminSellerOnboardingPage from "@/pages/admin/AdminSellerOnboardingPage";
import AdminAuditSearchPage from "@/pages/admin/AdminAuditSearchPage";
import AdminRiskPage from "@/pages/admin/AdminRiskPage";
import {
  defaultPathForRole,
  loginPathForAudience,
  type LoginAudience,
} from "@/utils/authRoutes";

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated)
    return <Navigate to={loginPathForAudience((role ?? "CUSTOMER") as LoginAudience)} replace />;
  if (role && user?.role !== role)
    return <Navigate to={defaultPathForRole(user?.role)} replace />;

  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return "/login";
    return defaultPathForRole(user?.role);
  };

  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div
            className="min-h-screen flex items-center justify-center"
            role="status"
            aria-live="polite"
          >
            Yükleniyor…
          </div>
        }
      >
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} />
              ) : (
                <CustomerAccessPage />
              )
            }
          />
          <Route
            path="/seller/login"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} replace />
              ) : (
                <LoginPage audience="SELLER" />
              )
            }
          />
          <Route
            path="/admin/login"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} replace />
              ) : (
                <LoginPage audience="ADMIN" />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} />
              ) : (
                <RegisterPage />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} />
              ) : (
                <ForgotPasswordPage audience="CUSTOMER" />
              )
            }
          />
          <Route
            path="/seller/forgot-password"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} replace />
              ) : (
                <ForgotPasswordPage audience="SELLER" />
              )
            }
          />
          <Route
            path="/admin/forgot-password"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} replace />
              ) : (
                <ForgotPasswordPage audience="ADMIN" />
              )
            }
          />
          <Route
            path="/reset-password"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRedirect()} />
              ) : (
                <ForgotPasswordPage audience="CUSTOMER" />
              )
            }
          />
          <Route
            path="/courier"
            element={
              <ProtectedRoute>
                <CourierWorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/invitations/accept"
            element={
              <ProtectedRoute>
                <AcceptStaffInvitationPage />
              </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/"
            element={
              isAuthenticated && user?.role === "SELLER" ? (
                <Navigate to="/seller/dashboard" />
              ) : isAuthenticated && user?.role === "ADMIN" ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <ProtectedRoute>
                  <CustomerLayout />
                </ProtectedRoute>
              )
            }
          >
            <Route index element={<HomePage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="stores" element={<StoreListPage />} />
            <Route path="stores/:id" element={<StoreDetailPage />} />
            <Route path="subscribe" element={<CreateSubscriptionPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route
              path="subscriptions/:id"
              element={<SubscriptionDetailPage />}
            />
            <Route
              path="subscriptions/:id/change"
              element={<SubscriptionActionRedirect />}
            />
            <Route
              path="subscriptions/:id/pause"
              element={<SubscriptionActionRedirect />}
            />
            <Route
              path="subscriptions/:id/deliveries/:deliveryId"
              element={<SubscriptionActionRedirect />}
            />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="security" element={<AccountSecurityPage />} />
            <Route path="security/sessions" element={<AccountSecurityPage />} />
            <Route path="verify-email" element={<AccountSecurityPage />} />
            <Route path="verify-phone" element={<AccountSecurityPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
          </Route>

          {/* Seller Routes */}
          <Route
            path="/seller"
            element={
              <ProtectedRoute role="SELLER">
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SellerDashboardEntryPage />} />
            <Route path="stores" element={<SellerStoresListPage />} />
            <Route path="stores/:storeId" element={<SellerStoreDetailLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="showcase" element={<StoreShowcasePage />} />
              <Route path="pending" element={<StorePendingPage />} />
              <Route
                path="subscriptions"
                element={<StoreSubscriptionsPage />}
              />
              <Route
                path="subscriptions/:subscriptionId"
                element={<StoreSubscriptionDetailPage />}
              />
              <Route path="daily-orders" element={<Navigate to="../operations" replace />} />
              <Route path="operations" element={<StoreDailyOrdersPage />} />
              <Route path="production" element={<StoreProductionPage />} />
              <Route path="couriers" element={<StoreCouriersPage />} />
              <Route path="order-history" element={<StoreOrderHistoryPage />} />
              <Route path="finance" element={<StoreFinancePage />} />
              <Route path="payouts" element={<StoreFinancePage />} />
              <Route path="analytics" element={<StoreAnalyticsPage />} />
              <Route path="reviews" element={<StoreReviewsPage />} />
              <Route path="complaints" element={<StoreComplaintsPage />} />
              <Route path="documents" element={<StoreDocumentsPage />} />
              <Route path="staff" element={<StoreStaffPage />} />
              <Route path="campaigns" element={<StoreCampaignsPage />} />
              <Route path="settings" element={<StoreSettingsPage />} />
            </Route>
            <Route path="profile" element={<SellerProfilePage />} />
            <Route path="support" element={<SellerSupportPage />} />
            <Route path="security" element={<SellerAccountSecurityPage />} />
            <Route path="onboarding" element={<SellerOnboardingPage />} />
            <Route path="notifications" element={<SellerNotificationsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:id" element={<AdminUserDetailPage />} />
            <Route path="stores" element={<AdminStoresPage />} />
            <Route path="stores/:id" element={<AdminStoreDetailPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="finance" element={<AdminFinancePage />} />
            <Route
              path="reconciliation"
              element={<AdminReconciliationPage />}
            />
            <Route path="complaints" element={<AdminComplaintsPage />} />
            <Route
              path="seller-onboarding"
              element={<AdminSellerOnboardingPage />}
            />
            <Route path="audit-search" element={<AdminAuditSearchPage />} />
            <Route path="risk" element={<AdminRiskPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}
