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
  MdOutlineFontDownload,
} from 'react-icons/md';

import { MarkButton } from './';
import ColorPickerButton from './ColorPickerButton';
import FontSizeButton from './FontSizeButton';
import FontFamilyButton from './FontFamilyButton';
import ClearButton from './ClearButton';
import ToolbarInfoPopover from './ToolbarInfoPopover';

interface ToolbarProps {
  readonly?: boolean;
}

const Toolbar: FC<ToolbarProps> = ({ readonly }) => {
  return (
    <div id="toolbar" className="flex w-full flex-wrap gap-2 border-b p-2">
      <ToolbarInfoPopover label="textEditor_bold">
        <MarkButton icon={MdOutlineFormatBold} format="bold" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_italic">
        <MarkButton icon={MdOutlineFormatItalic} format="italic" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_underline">
        <MarkButton icon={MdOutlineFormatUnderlined} format="underline" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_strikethrough">
        <MarkButton icon={MdOutlineStrikethroughS} format="strikethrough" readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_fontSize">
        <FontSizeButton icon={MdOutlineFormatSize} readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_fontFamily">
        <FontFamilyButton icon={MdOutlineFontDownload} readonly={readonly} />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_textColor">
        <ColorPickerButton icon={MdOutlineFormatColorText} readonly={readonly} format="color" />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_backgroundColor">
        <ColorPickerButton
          icon={MdOutlineFormatColorFill}
          readonly={readonly}
          format="backgroundColor"
        />
      </ToolbarInfoPopover>
      <ToolbarInfoPopover label="textEditor_clearFormatting">
        <ClearButton icon={MdOutlineFormatClear} readonly={readonly} />
      </ToolbarInfoPopover>
    </div>
  );
};

export default Toolbar;
