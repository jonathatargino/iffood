import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
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
        <Button onClick={onViewAll} size="icon">
          <ChevronRight />
        </Button>
      }
    />
  );
}
