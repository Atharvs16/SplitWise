import './App.css'
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard"
import { createBrowserRouter, RouterProvider, BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    // 1. Your default landing page at "/"
    path: "/",
    element: <LandingPage />, 
  },
  {
    path: "/Auth",
    element: <Auth />,
  },
  {
    // 1. Wrap protected paths inside the ProtectedRoute layout
    element: <ProtectedRoute />, 
    children: [
      {
        path: "/workspace",
        element: <Dashboard />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
