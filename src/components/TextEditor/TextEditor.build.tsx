import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useState } from 'react';
import { createEditor } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';
import { ITextEditorProps } from './TextEditor.config';
import { Toolbar } from './UI';
import { BsFillInfoCircleFill } from 'react-icons/bs';

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'A line of text in a paragraph.' }],
  },
];
const TextEditor: FC<ITextEditorProps> = ({
  datasource,
  readOnly,
  style,
  className,
  classNames = [],
}) => {
  const {
    connectors: { connect },
  } = useEnhancedNode();
  const [editor] = useState(() => withReact(createEditor()));

  return (
    <div ref={connect} style={style} className={cn(className, classNames)}>
      {datasource ? (
        <Slate editor={editor} initialValue={initialValue}>
          {!readOnly && <Toolbar readonly={readOnly} />}
          <Editable readOnly className="p-2 h-full" />
        </Slate>
      ) : (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-purple-400 py-4 text-white">
          <BsFillInfoCircleFill className="mb-1 h-8 w-8" />
          <p>Please attach a datasource</p>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
