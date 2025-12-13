import { useState } from "react";
import { Calculator, Monitor, Mail, Lock } from "lucide-react";
import { loginApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import type { StaffLoginRequest } from "@shared/types/user.types";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"POS" | "KDS" | "ADMIN">("POS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login); // ✅ Get login function from Zustand

  const [user, setUser] = useState<StaffLoginRequest>({
    username: "",
    password: "",
    role: "POS",
  });

  const handleTabChange = (tab: "POS" | "KDS" | "ADMIN") => {
    setActiveTab(tab);
    setUser({ username: "", password: "", role: tab }); // Clear fields on tab change
    setError(null);
  };

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    console.log("=== LOGIN START ===");
    console.log("Attempting login with:", user);

    try {
      const data = await loginApi(user);
      console.log("Login response:", data);

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      console.log("Calling Zustand login...");

      // ✅ Call Zustand login function
      login({
        username: data.user.username,
        role: data.user.role,
        token: data.token,
      });

      console.log("✅ Login successful, navigating...");

      // Navigate based on role
      if (data.user.role === "POS") {
        navigate("/pos");
      } else if (data.user.role === "KDS") {
        navigate("/kds");
      } else if (data.user.role === "ADMIN") {
        navigate("/admin");
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">
            ITMBU CANTEEN
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Cool Tabs */}
          <div className="relative flex bg-gray-100 p-1 m-4 rounded-2xl">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] tab-gradient-active rounded-xl shadow-lg transition-all duration-300 ease-out ${
                activeTab === "POS" ? "left-1" : "left-[calc(50%+0.25rem)]"
              }`}
            />

            {/* Tab Buttons */}
            <button
              onClick={() => handleTabChange("POS")}
              className={`relative flex-1 py-3 px-6 font-semibold rounded-xl transition-all duration-300 z-10 ${
                activeTab === "POS"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5" />
                POS Login
              </span>
            </button>
            <button
              onClick={() => handleTabChange("KDS")}
              className={`relative flex-1 py-3 px-6 font-semibold rounded-xl transition-all duration-300 z-10 ${
                activeTab === "KDS"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Monitor className="w-5 h-5" />
                KDS Login
              </span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-gray-800 ">
                {activeTab === "POS" ? "Point of Sale" : "Kitchen Display"}
              </h2>
              <p className="text-sm text-gray-500">
                {activeTab === "POS"
                  ? "Access your sales terminal"
                  : "View kitchen orders"}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-6"
            >
              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={user.username}
                    onChange={(e) =>
                      setUser({ ...user, username: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-gray-800 transition-all duration-200 focus-gradient disabled:opacity-70"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={user.password}
                    onChange={(e) =>
                      setUser({ ...user, password: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-gray-800 transition-all duration-200 focus-gradient disabled:opacity-70"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-white btn-gradient-primary transform hover:scale-[1.02] active:scale-[0.98] hover:btn-gradient-primary-hover cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl">
          <p className="text-sm text-white/90 font-medium">
            {activeTab === "POS"
              ? "🛒 Point of Sale System Access"
              : "👨‍🍳 Kitchen Display System Access"}
          </p>
        </div>
      </div>
    </div>
  );
}
