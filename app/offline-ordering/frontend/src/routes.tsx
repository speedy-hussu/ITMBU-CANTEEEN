import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Layout } from "@/components/layout";
import Login from "@/pages/Login";

// Lazy load components for better performance
const PosPage = lazy(() => import("@/pages/Pos"));
const KdsPage = lazy(() => import("@/pages/Kds"));
// const AdminPage = lazy(() => import("@/pages/Admin"));

// Create a loading component for Suspense fallback
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Create routes configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: (
          <Suspense fallback={<Loading />}>
            <PosPage />
          </Suspense>
        ),
      },
      {
        path: "/pos",
        element: (
          <Suspense fallback={<Loading />}>
            <PosPage />
          </Suspense>
        ),
      },
      {
        path: "/kds",
        element: (
          <Suspense fallback={<Loading />}>
            <KdsPage />
          </Suspense>
        ),
      },
      //   {
      //     path: "/admin",
      //     element: (
      //       <Suspense fallback={<Loading />}>
      //         <AdminPage />
      //       </Suspense>
      //     ),
      //   },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "*",
    element: <div>404 Not Found</div>,
  },
]);
