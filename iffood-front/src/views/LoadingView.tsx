import { BouncingDots } from "@/components/BoucingDots";

export function LoadingView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <BouncingDots />
    </div>
  );
}
