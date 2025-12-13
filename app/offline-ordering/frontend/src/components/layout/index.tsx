import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/store/authStore";
import { Navigate } from "react-router-dom";

export function Layout() {
  const { user } = useAuthStore();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster position="top-center" />
    </div>
  );
}
