import { IconType } from 'react-icons';
import { Button } from './';
import { useSlate } from 'slate-react';
import { FC } from 'react';
import { Editor, Transforms, Element as SlateElement, Text, Range } from 'slate';
import { LinkElement } from '../Hooks/useLink';

interface ClearButton {
  icon: IconType;
  readonly?: boolean;
}

const TEXT_MARKS = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
  'color',
  'backgroundColor',
  'fontSize',
  'fontFamily',
];

const ClearButton: FC<ClearButton> = ({ icon: Icon, readonly }) => {
  const editor = useSlate();

  const clearContent = (editor: Editor) => {
    const { selection } = editor;
    if (!selection) return;

    if (Range.isCollapsed(selection)) {
      TEXT_MARKS.forEach((mark) => Editor.removeMark(editor, mark));
      Transforms.unsetNodes(editor, TEXT_MARKS, {
        match: Text.isText,
        split: true,
        at: selection,
      });
      return;
    }

    Transforms.insertFragment(editor, [{ text: Editor.string(editor, selection) }]);
    Transforms.unsetNodes(editor, TEXT_MARKS, {
      match: Text.isText,
      split: true,
    });
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && (n as LinkElement).type === 'link',
      split: true,
    });
  };

  return (
    <Button
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        !readonly && clearContent(editor);
      }}
    >
      <Icon />
    </Button>
  );
};

export default ClearButton;
