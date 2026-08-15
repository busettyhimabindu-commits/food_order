import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatbot from './components/AIChatbot';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import SearchPage from './pages/SearchPage';
import FoodDetailPage from './pages/FoodDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import AddressesPage from './pages/AddressesPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import AIChatPage from './pages/AIChatPage';

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import KitchenDisplayPage from './pages/KitchenDisplayPage';
import ManageRestaurantsPage from './pages/ManageRestaurantsPage';
import ManageFoodsPage from './pages/ManageFoodsPage';
import ManageOrdersPage from './pages/ManageOrdersPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageCouponsPage from './pages/ManageCouponsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import GroupOrderPage from './pages/GroupOrderPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import DesignSystemPreview from './components/DesignSystemPreview';

import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from './utils/motion';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {!isAdminRoute && <Navbar />}

      <div className="flex-1 overflow-x-hidden">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Routes location={location}>
                {/* Customer Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/restaurants" element={<RestaurantsPage />} />
                <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
                <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/food/:id" element={<FoodDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
                <Route path="/recommendations" element={<AIRecommendationsPage />} />
                <Route path="/chat" element={<AIChatPage />} />
                <Route path="/design-system" element={<DesignSystemPreview />} />
                <Route path="/group-orders/:code" element={<GroupOrderPage />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><AdminDashboardPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/kitchen-display"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><KitchenDisplayPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/restaurants"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><ManageRestaurantsPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/foods"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><ManageFoodsPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/orders"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><ManageOrdersPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/support"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><SupportTicketsPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/users"
                  element={<ProtectedRoute allowedRoles={['super_admin']}><ManageUsersPage /></ProtectedRoute>}
                />
                <Route
                  path="/admin/coupons"
                  element={<ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}><ManageCouponsPage /></ProtectedRoute>}
                />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </div>

      {!isAdminRoute && <AIChatbot />}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <BottomNav />}
      <PWAInstallPrompt />
    </div>
  );
};

import { ActiveOrderProvider } from './context/ActiveOrderContext';
import { LocationProvider } from './context/LocationContext';

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ActiveOrderProvider>
            <LocationProvider>
              <CartProvider>
                <AppLayout />
              </CartProvider>
            </LocationProvider>
          </ActiveOrderProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};


export default App;
