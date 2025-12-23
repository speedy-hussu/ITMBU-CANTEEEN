//Canteen staff schema
// ==================================================
export interface StaffUser {
  username: string | "";
  password: string | "";
  role: "POS" | "KDS" | "ADMIN";
}
export interface StaffLoginRequest {
  username: string;
  password: string;
  role: StaffUser["role"];
}

export interface StaffLoginResponse {
  user: {
    username: string;
    role: StaffUser["role"];
  };
  token: string;
}
// ======================================================

//online user schema [student/faculty]
// ===============================================
export interface OnlineUser {
  enrollId: string;
  password: string;
  name: string;
  role: "STUDENT" | "FACULTY";
}
export interface OnlineUserLoginRequest {
  enrollId: string;
  password: string;
  name: string;
  role: OnlineUser["role"];
}
export interface OnlineUserLoginResponse {
  user: {
    role: StaffUser["role"];
    username: string;
    EnrolId: string;
  };
  token: string;
}
