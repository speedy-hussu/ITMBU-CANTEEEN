import api from "./api";
import type {
  StaffLoginRequest,
  StaffLoginResponse,
} from "@shared/types/user.types";

export const loginApi = async (
  creds: StaffLoginRequest
): Promise<StaffLoginResponse> => {
  try {
    const res = await api.post<StaffLoginResponse>("/auth/login", creds);
    return res.data;
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};
