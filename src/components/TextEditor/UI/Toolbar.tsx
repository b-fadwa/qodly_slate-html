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

interface ToolbarProps {
  readonly?: boolean;
}

const Toolbar: FC<ToolbarProps> = ({ readonly }) => {
  return (
    <div id="toolbar" className="flex w-full flex-wrap gap-2 border-b p-2">
      <MarkButton icon={MdOutlineFormatBold} format="bold" readonly={readonly} />
      <MarkButton icon={MdOutlineFormatItalic} format="italic" readonly={readonly} />
      <MarkButton icon={MdOutlineFormatUnderlined} format="underline" readonly={readonly} />
      <MarkButton icon={MdOutlineStrikethroughS} format="strikethrough" readonly={readonly} />
      <FontSizeButton icon={MdOutlineFormatSize} readonly={readonly} />
      <ColorPickerButton icon={MdOutlineFormatColorText} readonly={readonly} format="color" />
      <ColorPickerButton
        icon={MdOutlineFormatColorFill}
        readonly={readonly}
        format="backgroundColor"
      />
      <ClearButton icon={MdOutlineFormatClear} readonly={readonly} />
    </div>
  );
};

export default Toolbar;
