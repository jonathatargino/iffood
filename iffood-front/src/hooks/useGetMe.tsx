import type { UserProfile } from "@/models";
import { userProfileService } from "@/services/userProfile";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export function useGetMe(
  options: Omit<UseQueryOptions<UserProfile>, "queryKey" | "queryFn"> = {},
) {
  return useQuery<UserProfile>({
    ...options,
    queryKey: ["user-profile-me"],
    queryFn: userProfileService.getMe,
  });
}
