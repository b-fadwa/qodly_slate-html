import { FC } from 'react';
import {
  MdOutlineFormatBold,
  MdOutlineFormatItalic,
  MdOutlineFormatUnderlined,
  MdOutlineStrikethroughS,
  MdOutlineFormatColorText,
  MdOutlineFormatColorFill,
  MdOutlineFormatClear,
  MdOutlineFormatSize,
} from 'react-icons/md';

import { MarkButton } from './';
import ColorPickerButton from './ColorPickerButton';
import FontSizeButton from './FontSizeButton';
import ClearButton from './ClearButton';
import ToolbarInfoPopover from './ToolbarInfoPopover';

interface ToolbarProps {
  readonly?: boolean;
}

const Toolbar: FC<ToolbarProps> = ({ readonly }) => {
  return (
    <div id="toolbar" className="flex w-full flex-wrap gap-2 border-b p-2">
      <ToolbarInfoPopover label="Bold">
        <MarkButton icon={MdOutlineFormatBold} format="bold" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Italic">
        <MarkButton icon={MdOutlineFormatItalic} format="italic" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Underline">
        <MarkButton icon={MdOutlineFormatUnderlined} format="underline" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Strikethrough">
        <MarkButton icon={MdOutlineStrikethroughS} format="strikethrough" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Font size (px)">
        <FontSizeButton icon={MdOutlineFormatSize} readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Text color">
        <ColorPickerButton icon={MdOutlineFormatColorText} readonly={readonly} format="color" />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Background color">
        <ColorPickerButton
          icon={MdOutlineFormatColorFill}
          readonly={readonly}
          format="backgroundColor"
        />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="Clear formatting">
        <ClearButton icon={MdOutlineFormatClear} readonly={readonly} />
      </ToolbarInfoPopover>
    </div>
  );
};

export default Toolbar;
