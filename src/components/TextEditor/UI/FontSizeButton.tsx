import { FC, useState, useRef, useEffect } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, BaseRange } from 'slate';
import { Button } from '.';
import { IconType } from 'react-icons';
import get from 'lodash/get';

interface FontSizeButtonProps {
  icon: IconType;
  readonly?: boolean;
}

const parsePxValue = (fontSize: string) => {
  const match = fontSize.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? match[1] : '';
};

const FontSizeButton: FC<FontSizeButtonProps> = ({ icon: Icon, readonly }) => {
  const editor = useSlate();
  const [showPicker, setShowPicker] = useState(false);
  const [fontSize, setFontSize] = useState('');
  const [selection, setSelection] = useState<BaseRange | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMarkActive = (editor: Editor) => {
    const marks = Editor.marks(editor) as Record<string, string> | null;
    return get(marks, 'fontSize', '') !== '';
  };

  const applyFontSize = (value: string) => {
    if (!selection) return;

    ReactEditor.focus(editor as ReactEditor);
    editor.selection = selection;

    const trimmed = value.trim();
    if (!trimmed) {
      Editor.removeMark(editor, 'fontSize');
    } else {
      const px = Number(trimmed);
      if (!Number.isNaN(px) && px > 0) {
        Editor.addMark(editor, 'fontSize', `${px}px`);
      }
    }

    setShowPicker(false);
  };

  const openPicker = (editor: Editor) => {
    const marks = Editor.marks(editor) as Record<string, string> | null;
    setFontSize(parsePxValue(get(marks, 'fontSize', '')));
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
            type="number"
            min={1}
            max={200}
            value={fontSize}
            onChange={(event) => setFontSize(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyFontSize(fontSize);
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setShowPicker(false);
              }
            }}
            className="w-16 rounded border px-2 py-1 text-sm"
            placeholder="16"
          />
          <span className="text-sm text-gray-500">px</span>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm hover:bg-gray-100"
            onMouseDown={(event) => {
              event.preventDefault();
              applyFontSize(fontSize);
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default FontSizeButton;
