import { useState } from "react";
import { Calculator, Monitor, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login); // Zustand action

  const [formData, setFormData] = useState({
    enrollId: "",
    name: "",
    password: "",
  });

  const handleTabChange = (tab: "STUDENT" | "FACULTY") => {
    setActiveTab(tab);
    setFormData({ enrollId: "", name: "", password: "" });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Call your Fastify Backend
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollId: formData.enrollId,
          password: formData.password,
          role: activeTab,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials. Please try again.");
      }

      // 2. Update Global Auth State
      login({
        username: data.user.name,
        enrollId: data.user.enrollId,
        role: data.user.role as "STUDENT" | "FACULTY",
        token: data.token,
      });

      console.log("✅ Auth Success:", data.user.name);

      // 3. Navigate to home (WebSocket will connect automatically there)
      navigate("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6">
      <div className="w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-0">
          {/* Tabs Section */}
          <div className="relative flex bg-gray-100 p-1 m-3 sm:m-4 rounded-2xl">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.5rem)] tab-gradient-active rounded-xl shadow-lg transition-all duration-300 ease-out ${
                activeTab === "STUDENT" ? "left-1" : "left-[calc(50%+0.5rem)]"
              }`}
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTabChange("STUDENT")}
              className={`relative flex-1 py-2 sm:py-3 font-semibold rounded-xl transition-all duration-300 z-10 text-xs sm:text-sm md:text-base h-auto ${
                activeTab === "STUDENT" ? "text-white" : "text-gray-600"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>STUDENT</span>
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTabChange("FACULTY")}
              className={`relative flex-1 py-2 sm:py-3 font-semibold rounded-xl transition-all duration-300 z-10 text-xs sm:text-sm md:text-base h-auto ${
                activeTab === "FACULTY" ? "text-white" : "text-gray-600"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>FACULTY</span>
              </span>
            </Button>
          </div>

          {/* Form Section */}
          <div className="px-4 pb-6 sm:px-8 lg:px-10 lg:pb-10">
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 uppercase">
                {activeTab} CANTEEN LOGIN
              </h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
              {/* Enrollment ID / Faculty Code */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="enrollId"
                  className="text-sm font-medium text-gray-700"
                >
                  {activeTab === "STUDENT" ? "Enrollment ID" : "Faculty Code"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="enrollId"
                    type="text"
                    value={formData.enrollId}
                    onChange={(e) =>
                      setFormData({ ...formData, enrollId: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="w-full pl-10 h-11 rounded-xl border-gray-300 focus-gradient transition-all"
                    placeholder={`Enter ${
                      activeTab === "STUDENT" ? "Enrollment ID" : "Code"
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  title="Password is required"
                  className="text-sm font-medium text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="w-full pl-10 h-11 rounded-xl border-gray-300 focus-gradient transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert
                  variant="destructive"
                  className="py-2 rounded-lg border-red-200 bg-red-50"
                >
                  <AlertDescription className="text-xs sm:text-sm text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 h-12 rounded-xl font-semibold text-white btn-gradient-primary shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
