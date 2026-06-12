import { FC, PropsWithChildren, useState } from 'react';

interface ToolbarInfoPopoverProps extends PropsWithChildren {
  label: string;
}

const ToolbarInfoPopover: FC<ToolbarInfoPopoverProps> = ({ label, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-md"
        >
          {label}
        </div>
      )}
    </div>
  );
};

export default ToolbarInfoPopover;
