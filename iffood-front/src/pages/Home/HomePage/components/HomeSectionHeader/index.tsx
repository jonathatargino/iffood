import { SectionHeader } from "@/components/SectionHeader";
import { ChevronRight } from "lucide-react";

interface HomeSectionHeaderProps {
  title: string;
  onViewAll: () => void;
}

export function HomeSectionHeader({
  title,
  onViewAll,
}: HomeSectionHeaderProps) {
  return (
    <SectionHeader
      title={title}
      className="mb-2"
      actions={
        <button
          onClick={onViewAll}
          className="mr-3 h-fit w-fit rounded-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] p-1 text-white transition-all hover:shadow-xl active:scale-[0.98]"
        >
          <ChevronRight className="size-6 text-white" />
        </button>
      }
    />
  );
}
