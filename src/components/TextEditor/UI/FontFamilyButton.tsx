import { FC, useState, useRef, useEffect } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, BaseRange } from 'slate';
import { Button } from '.';
import { IconType } from 'react-icons';
import get from 'lodash/get';

interface FontFamilyButtonProps {
  icon: IconType;
  readonly?: boolean;
}

const FontFamilyButton: FC<FontFamilyButtonProps> = ({ icon: Icon, readonly }) => {
  const editor = useSlate();
  const [showPicker, setShowPicker] = useState(false);
  const [fontFamily, setFontFamily] = useState('');
  const [selection, setSelection] = useState<BaseRange | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMarkActive = (editor: Editor) => {
    const marks = Editor.marks(editor) as Record<string, string> | null;
    return get(marks, 'fontFamily', '') !== '';
  };

  const applyFontFamily = (value: string) => {
    if (!selection) return;

    ReactEditor.focus(editor as ReactEditor);
    editor.selection = selection;

    const trimmed = value.trim();
    if (!trimmed) {
      Editor.removeMark(editor, 'fontFamily');
    } else {
      Editor.addMark(editor, 'fontFamily', trimmed);
    }

    setShowPicker(false);
  };

  const openPicker = (editor: Editor) => {
    const marks = Editor.marks(editor) as Record<string, string> | null;
    setFontFamily(get(marks, 'fontFamily', ''));
    setShowPicker(true);
  };

  useEffect(() => {
    if (!showPicker) return;

    inputRef.current?.focus();
    inputRef.current?.select();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !btnRef.current?.contains(target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        ref={btnRef}
        active={isMarkActive(editor)}
        onMouseDown={(event: MouseEvent) => {
          event.preventDefault();
          if (!readonly) {
            setSelection(editor.selection);
            openPicker(editor);
          }
        }}
      >
        <Icon />
      </Button>
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute z-10 mt-1 flex items-center gap-1 rounded border bg-white p-2 shadow-md"
        >
          <input
            ref={inputRef}
            type="text"
            list="text-editor-font-families"
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyFontFamily(fontFamily);
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setShowPicker(false);
              }
            }}
            className="w-36 rounded border px-2 py-1 text-sm"
            placeholder="Arial"
          />
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm hover:bg-gray-100"
            onMouseDown={(event) => {
              event.preventDefault();
              applyFontFamily(fontFamily);
            }}
          >
            Apply
          </button>
          <datalist id="text-editor-font-families">
            <option value="Arial" />
            <option value="Calibri" />
            <option value="Georgia" />
            <option value="Times New Roman" />
            <option value="Verdana" />
            <option value="Courier New" />
          </datalist>
        </div>
      )}
    </div>
  );
};

export default FontFamilyButton;
