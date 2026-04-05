import { HomeBaseHeader } from "@/pages/Home/components/HomeBaseHeader";
import { HomeSearchCTA } from "@/pages/Home/components/HomeBaseHeader/components/HomeSearchCTA";

export function HomeHeader() {
  return <HomeBaseHeader children={<HomeSearchCTA />} />;
}
