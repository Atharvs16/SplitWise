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
    path: "/",
    element: <LandingPage />, 
  },
  {
    path: "/Auth",
    element: <Auth />,
  },
  {
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
