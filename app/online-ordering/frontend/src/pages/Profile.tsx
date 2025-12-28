import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  Camera,
  Edit2,
  Save,
  X,
  Shield,
  Wallet,
  Heart,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutUser } from "@/api/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@itmbu.ac.in",
    phone: "+91 98765 43210",
    enrollmentId: "21BCA001",
    department: "Computer Science",
    year: "3rd Year",
    address: "Hostel Block A, Room 204",
    avatar: "",
  });

  const [editData, setEditData] = useState({ ...userData });

  const handleSave = () => {
    setUserData({ ...editData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  const stats = [
    { label: "Total Orders", value: "48", icon: CreditCard },
    { label: "Wallet Balance", value: "₹450", icon: Wallet },
    { label: "Favorites", value: "12", icon: Heart },
    { label: "Points", value: "850", icon: Star },
  ];

  const menuItems = [
    { label: "Payment Methods", icon: CreditCard, badge: "2" },
    { label: "Saved Addresses", icon: MapPin, badge: "1" },
    { label: "Privacy & Security", icon: Shield, badge: null },
    { label: "Help & Support", icon: Bell, badge: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-primary text-white pt-6 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleCancel}
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleSave}
                >
                  <Save className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-xl">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="bg-orange-500 text-white text-3xl sm:text-4xl font-bold">
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-orange-500 hover:bg-orange-600 shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-4">
              {userData.name}
            </h2>
            <p className="text-white/90 text-sm mt-1">
              {userData.enrollmentId}
            </p>
            <Badge className="mt-2 bg-white/20 text-white hover:bg-white/30">
              {userData.department} • {userData.year}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, idx) => (
            <Card
              key={idx}
              className="shadow-md hover:shadow-lg transition-shadow p-0"
            >
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Personal Information */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{userData.name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{userData.email}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{userData.phone}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Address
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{userData.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    Push Notifications
                  </p>
                  <p className="text-xs text-gray-500">Receive order updates</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Receive promotional emails
                  </p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-0">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge className="bg-orange-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Security Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3 text-gray-900 border-gray-300 hover:bg-gray-50"
          >
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3 text-red-500 border-red-300 hover:bg-red-50"
            onClick={() => {
              if (confirm("do want to logout ?")) {
                logoutUser();
                logout();
                navigate("/login");
              }
            }}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-gray-500 mt-6">
          ITMBU Canteen v1.0.0
        </p>
      </div>
    </div>
  );
}
