import { api } from "@/lib/api";
import type { UserProfile } from "@/models";

export const userProfileService = {
  getMe: async () => {
    const response = await api.get<UserProfile>("/user-profile/me");
    return response.data;
  },
  updateWhatsapp: async (whatsapp: string) => {
    const response = await api.patch<UserProfile>("/user-profile/me/whatsapp", {
      whatsapp,
    });
    return response.data;
  },
};
