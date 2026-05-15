import { FC } from 'react';
import { MdDelete } from 'react-icons/md';
import { Button } from '.';
import { useFocused, useReadOnly, useSelected, useSlate } from 'slate-react';
import useImage from '../Hooks/useImage';

interface Element {
  attributes: any;
  children: any;
  element: any;
}

const Element: FC<Element> = ({ attributes, children, element }) => {
  const alignClass = element.align ? `text-${element.align}` : '';
  const isReadOnly = useReadOnly();

  switch (element.type) {
    case 'code':
      return (
        <pre className="whitespace-pre p-2 space-x-2 bg-zinc-300" {...attributes}>
          <code className={`lang-${element.language}`}>{children}</code>
        </pre>
      );
    case 'table':
      return (
        <table
          className="table-fixed w-full border-collapse border border-gray-400"
          {...attributes}
        >
          <tbody>{children}</tbody>
        </table>
      );
    case 'table-row':
      return (
        <tr className={!isReadOnly && 'even:bg-gray-200 hover:bg-gray-300'} {...attributes}>
          {children}
        </tr>
      );
    case 'table-cell':
      return (
        <td className="border border-gray-400 p-2" {...attributes}>
          {children}
        </td>
      );
    case 'image':
      const selected = useSelected();
      const focused = useFocused();
      const editor = useSlate();
      const { unwrapImage } = useImage();
      return (
        <div {...attributes}>
          <div className="relative w-fit" contentEditable={false}>
            <img
              src={element.url}
              className={`block max-h-80 max-w-full ${selected && focused ? 'shadow-outline' : ''}`}
            />
            <Button
              active
              onClick={() => unwrapImage(editor)}
              className={`absolute top-2 right-2 bg-white ${
                selected && focused ? 'inline' : 'hidden'
              }`}
            >
              <MdDelete />
            </Button>
          </div>
          {children}
        </div>
      );
    case 'link':
      return (
        <a
          className={`underline cursor-pointer ${alignClass} text-blue-600`}
          {...attributes}
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    case 'block-quote':
      return (
        <blockquote
          className={`${alignClass} border-l-4 border-gray-300 pl-4 bg-gray-100`}
          {...attributes}
        >
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul className={`list-inside list-disc ${alignClass}`} {...attributes}>
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 className={`${alignClass} text-3xl`} {...attributes}>
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 className={`${alignClass} text-2xl`} {...attributes}>
          {children}
        </h2>
      );
    case 'heading-three':
      return (
        <h3 className={`${alignClass} text-xl`} {...attributes}>
          {children}
        </h3>
      );
    case 'list-item':
      return (
        <li className={alignClass} {...attributes}>
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol className={`list-inside list-decimal ${alignClass}`} {...attributes}>
          {children}
        </ol>
      );
    case 'video':
      return (
        <div {...attributes}>
          <div contentEditable={false}>
            <iframe src={element.url} allowFullScreen title="Embedded video" className="w-full" />
          </div>
          {children}
        </div>
      );
    default:
      return (
        <p className={`element-paragraph ${alignClass}`} {...attributes}>
          {children}
        </p>
      );
  }
};

export default Element;
