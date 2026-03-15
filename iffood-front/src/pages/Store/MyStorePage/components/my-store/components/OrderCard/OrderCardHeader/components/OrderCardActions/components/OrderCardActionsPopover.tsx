import { Popover } from "@base-ui/react/popover";
import { EllipsisVerticalIcon } from "lucide-react";

interface OrderCardActionsPopoverProps {
  children: React.ReactNode;
}

export function OrderCardActionsPopover({
  children,
}: OrderCardActionsPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center justify-center rounded-md p-0.5 select-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100">
        <EllipsisVerticalIcon size={16} className="text-gray-600" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="origin-[var(--transform-origin)] rounded-lg bg-[canvas] px-6 py-4 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <Popover.Description className="text-base text-gray-600">
              {children}
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
