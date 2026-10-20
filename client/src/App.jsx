import './App.css'
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard"
import { createBrowserRouter, RouterProvider, BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
        path: "/dashboard",
        element: <Dashboard />,
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
