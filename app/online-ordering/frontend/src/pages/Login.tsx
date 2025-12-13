import { useState } from "react";
import { Calculator, Monitor, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OnlineUserLoginRequest } from "@shared/types/user.types";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [user, setUser] = useState<OnlineUserLoginRequest>({
    enrollId: "",
    name: "",
    password: "",
    role: "STUDENT",
  });

  const handleTabChange = (tab: "STUDENT" | "FACULTY") => {
    setActiveTab(tab);
    setUser({ enrollId: "", name: "", password: "", role: tab });
    setError(null);
  };

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    console.log("=== LOGIN START ===");
    console.log("Attempting login with:", user);

    await new Promise((r) => setTimeout(r, 1200));

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6">
      <div className="w-full sm:max-w-sm md:max-w-md max-w-sm lg:max-w-lg">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-0 ">
          {/* Tabs */}
          <div className="relative flex bg-gray-100 p-1 m-3 sm:m-4 rounded-2xl">
            {/* Sliding Indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.5rem)] tab-gradient-active rounded-xl shadow-lg transition-all duration-300 ease-out ${
                activeTab === "STUDENT" ? "left-1" : "left-[calc(50%+0.5rem)]"
              }`}
            />

            {/* STUDENT */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTabChange("STUDENT")}
              className={`relative flex-1 py-2 sm:py-3 px-3 sm:px-4 md:px-6 font-semibold rounded-xl transition-all duration-300 z-10 text-xs sm:text-sm md:text-base h-auto ${
                activeTab === "STUDENT"
                  ? "text-white hover:bg-transparent hover:text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">STUDENT Login</span>
                <span className="xs:hidden">STUDENT</span>
              </span>
            </Button>

            {/* FACULTY */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTabChange("FACULTY")}
              className={`relative flex-1 py-2 sm:py-3 px-3 sm:px-4 md:px-6 font-semibold rounded-xl transition-all duration-300 z-10 text-xs sm:text-sm md:text-base h-auto ${
                activeTab === "FACULTY"
                  ? "text-white hover:bg-transparent hover:text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">FACULTY Login</span>
                <span className="xs:hidden">FACULTY</span>
              </span>
            </Button>
          </div>

          {/* Form */}
          <div className="px-4 pb-4 sm:px-6 md:px-8 lg:px-10 lg:pb-10 ">
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-lg sm:text-lg md:text-xl font-bold text-gray-800">
                {activeTab === "STUDENT"
                  ? "STUDENT CANTEEN LOGIN"
                  : "FACULTY CANTEEN LOGIN"}
              </h2>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4 sm:space-y-5 md:space-y-6"
            >
              {/* Name */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    disabled={isLoading}
                    required
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 h-10 sm:h-11 md:h-12 rounded-xl border border-gray-300 text-gray-800 text-sm sm:text-base focus-gradient transition-all disabled:opacity-70"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              {/* Enrollment ID */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="enrollId"
                  className="text-sm font-medium text-gray-700"
                >
                  Enrollment ID <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="enrollId"
                    type="text"
                    value={user.enrollId}
                    onChange={(e) =>
                      setUser({ ...user, enrollId: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 h-10 sm:h-11 md:h-12 rounded-xl border border-gray-300 text-gray-800 text-sm sm:text-base focus-gradient transition-all disabled:opacity-70"
                    placeholder={
                      activeTab === "STUDENT"
                        ? "Enter your Enrollment ID"
                        : "Enter your Faculty Code"
                    }
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    value={user.password}
                    onChange={(e) =>
                      setUser({ ...user, password: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 h-10 sm:h-11 md:h-12 rounded-xl border border-gray-300 text-gray-800 text-sm sm:text-base focus-gradient transition-all disabled:opacity-70"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="rounded-lg">
                  <AlertDescription className="text-xs sm:text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => navigate("/home")}
                className="w-full py-2.5 sm:py-3 h-10 sm:h-11 md:h-12 rounded-xl font-semibold text-white btn-gradient-primary shadow-lg transition-all hover:shadow-xl disabled:opacity-70 active:scale-[0.98] text-sm sm:text-base"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
