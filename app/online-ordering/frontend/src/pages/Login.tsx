// frontend/src/pages/Login.tsx
import { useState } from "react";
import { Calculator, Monitor, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuthStore } from "@/store/authStore";
import { loginUser } from "@/api/api";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({ enrollId: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await loginUser(formData.enrollId, formData.password);

      // Update Zustand Store
      login(response.user);

      toast.success("Login Successful!");
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
      toast.error("Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2 bouxl mb-8 relative">
            <div
              className={`absolute h-[calc(100%-8px)] w-[calc(50%-4px)] tab-gradient-active rounded-xl transition-all duration-300 ease-in-out ${
                activeTab === "STUDENT" ? "left-1" : "left-[calc(50%+4px)]"
              }`}
            />
            <Button
              variant="ghost"
              className={`flex-1 z-10 font-bold ${
                activeTab === "STUDENT" ? "text-white" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("STUDENT")}
            >
              <Calculator className="mr-2 h-4 w-4" /> STUDENT
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 z-10 font-bold ${
                activeTab === "FACULTY" ? "text-white" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("FACULTY")}
            >
              <Monitor className="mr-2 h-4 w-4" /> FACULTY
            </Button>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 uppercase">
            {activeTab} Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="enrollId">
                {activeTab === "STUDENT" ? "Enrollment ID" : "Faculty Code"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="enrollId"
                  className="pl-10"
                  placeholder="Enter ID"
                  value={formData.enrollId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enrollId: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 btn-gradient-primary text-white font-bold rounded-xl"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
