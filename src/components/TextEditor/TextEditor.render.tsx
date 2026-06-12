import { splitDatasourceID, useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useCallback, useEffect, useState, useRef, MutableRefObject } from 'react';
import { Descendant, Transforms, createEditor, Element as SlateElement, Text, Node as SlateNode } from 'slate';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { ITextEditorProps } from './TextEditor.config';
import { Toolbar, Element, Leaf } from './UI';
import { BsFillInfoCircleFill } from 'react-icons/bs';
import { withHistory } from 'slate-history';
import withEmbeds from './Hooks/withEmbeds';
import useCodeEditor from './Hooks/useCodeEditor';
import withInlines from './Hooks/withInlines';
import handleHotKey from './Utils/Hotkeys';
import isEqual from 'lodash/isEqual';

type TextMarks = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
};

type HtmlTextNode = { text: string } & TextMarks;
type HtmlElementNode = { type: string; children: HtmlNode[];[key: string]: any };
type HtmlNode = HtmlTextNode | HtmlElementNode;

const INLINE_TYPES = new Set(['link']);
const BLOCK_TYPES = new Set([
  'paragraph',
  'heading-one',
  'heading-two',
  'heading-three',
  'block-quote',
  'bulleted-list',
  'numbered-list',
  'list-item',
  'table',
  'table-row',
  'table-cell',
  'code',
  'image',
  'video',
]);

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
] as unknown as Descendant[];

const isTextNode = (node: HtmlNode): node is HtmlTextNode => 'text' in node;
const isElementNode = (node: HtmlNode): node is HtmlElementNode => 'type' in node;

const createParagraph = (children: HtmlNode[]): HtmlElementNode => ({
  type: 'paragraph',
  children: children.length ? children : [{ text: '' }],
});

const normalizeText = (text: string, preserveWhitespace = false) => {
  const cleanedText = text.replace(/\r/g, '');

  if (preserveWhitespace) return cleanedText;

  // preserve line breaks
  return cleanedText
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' '))
    .join('\n');
};

const extractLanguage = (element: HTMLElement) => {
  const className = element.getAttribute('class') || '';
  const match = className.match(/(?:language|lang)-([a-z0-9-]+)/i);
  return match?.[1];
};

const getAlignment = (element: HTMLElement) => {
  const align = (element.getAttribute('align') || element.style.textAlign || '').toLowerCase();
  return ['left', 'center', 'right', 'justify'].includes(align) ? align : undefined;
};

const parseMarks = (element: HTMLElement, marks: TextMarks = {}): TextMarks => {
  const nextMarks = { ...marks };
  const fontWeight = element.style.fontWeight.toLowerCase();
  const textDecoration = element.style.textDecoration.toLowerCase();
  const textDecorationLine = element.style.textDecorationLine.toLowerCase();

  if (['strong', 'b'].includes(element.nodeName.toLowerCase()) || fontWeight === 'bold') {
    nextMarks.bold = true;
  }

  const numericFontWeight = Number(fontWeight);
  if (!Number.isNaN(numericFontWeight) && numericFontWeight >= 600) {
    nextMarks.bold = true;
  }

  if (
    ['em', 'i'].includes(element.nodeName.toLowerCase()) ||
    ['italic', 'oblique'].includes(element.style.fontStyle.toLowerCase())
  ) {
    nextMarks.italic = true;
  }

  if (element.nodeName.toLowerCase() === 'u' || textDecoration.includes('underline')) {
    nextMarks.underline = true;
  }

  if (
    ['s', 'strike', 'del'].includes(element.nodeName.toLowerCase()) ||
    textDecoration.includes('line-through') ||
    textDecorationLine.includes('line-through')
  ) {
    nextMarks.strikethrough = true;
  }

  if (element.nodeName.toLowerCase() === 'code' && element.parentElement?.nodeName.toLowerCase() !== 'pre') {
    nextMarks.code = true;
  }

  if (element.style.color) nextMarks.color = element.style.color;
  if (element.style.backgroundColor) nextMarks.backgroundColor = element.style.backgroundColor;
  if (element.style.fontFamily) nextMarks.fontFamily = element.style.fontFamily;
  if (element.style.fontSize) nextMarks.fontSize = element.style.fontSize;
  if (element.nodeName.toLowerCase() === 'font' && element.getAttribute('color')) {
    nextMarks.color = element.getAttribute('color') || undefined;
  }

  return nextMarks;
};

const deserializeChildren = (
  nodes: ChildNode[] | NodeListOf<ChildNode>,
  marks: TextMarks = {},
  preserveWhitespace = false,
): HtmlNode[] => Array.from(nodes).flatMap((node) => deserializeNode(node, marks, preserveWhitespace));

const toListItems = (children: HtmlNode[]): HtmlElementNode[] => {
  const listItems = children.flatMap((child) => {
    if (isElementNode(child) && child.type === 'list-item') return [child];
    return [{ type: 'list-item', children: [child] }];
  });

  return listItems.length ? listItems : [{ type: 'list-item', children: [{ text: '' }] }];
};

const toTableRows = (children: HtmlNode[]): HtmlElementNode[] => {
  const rows = children.filter(
    (child): child is HtmlElementNode => isElementNode(child) && child.type === 'table-row',
  );

  return rows.length
    ? rows
    : [
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            children: [createParagraph([{ text: '' }])],
          },
        ],
      },
    ];
};

const toTableCells = (children: HtmlNode[]): HtmlElementNode[] => {
  const cells = children.flatMap((child) => {
    if (isElementNode(child) && child.type === 'table-cell') return [child];
    return [{ type: 'table-cell', children: [isTextNode(child) ? createParagraph([child]) : child] }];
  });

  return cells.length
    ? cells
    : [
      {
        type: 'table-cell',
        children: [createParagraph([{ text: '' }])],
      },
    ];
};

function deserializeNode(
  node: ChildNode,
  marks: TextMarks = {},
  preserveWhitespace = false,
): HtmlNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeText(node.textContent || '', preserveWhitespace);
    return text ? [{ text, ...marks }] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node as HTMLElement;
  const nodeName = element.nodeName.toLowerCase();
  const nextMarks = parseMarks(element, marks);
  const children = deserializeChildren(element.childNodes, nextMarks, preserveWhitespace);
  const align = getAlignment(element);

  switch (nodeName) {
    case 'body':
      return children;
    case 'br':
      return [{ text: '\n', ...marks }];
    case 'pre': {
      const codeElement =
        element.querySelector('code') && element.querySelector('code')?.parentElement === element
          ? (element.querySelector('code') as HTMLElement)
          : element;

      return [
        {
          type: 'code',
          language: extractLanguage(codeElement) || extractLanguage(element) || 'markup',
          children: [{ text: codeElement.textContent?.replace(/\r/g, '') || '' }],
        },
      ];
    }
    case 'h1':
      return [{ type: 'heading-one', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    case 'h2':
      return [{ type: 'heading-two', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    case 'h3':
      return [{ type: 'heading-three', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    case 'blockquote':
      return [{ type: 'block-quote', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    case 'ul':
      return [{ type: 'bulleted-list', ...(align ? { align } : {}), children: toListItems(children) }];
    case 'ol':
      return [{ type: 'numbered-list', ...(align ? { align } : {}), children: toListItems(children) }];
    case 'li':
      return [{ type: 'list-item', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    case 'a':
      return [
        {
          type: 'link',
          url: element.getAttribute('href') || '',
          children: children.length ? children : [{ text: element.getAttribute('href') || '' }],
        },
      ];
    case 'img':
      return [
        {
          type: 'image',
          url: element.getAttribute('src') || '',
          children: [{ text: element.getAttribute('alt') || '' }],
        },
      ];
    case 'iframe':
      return [
        {
          type: 'video',
          url: element.getAttribute('src') || '',
          children: [{ text: element.getAttribute('title') || element.getAttribute('src') || '' }],
        },
      ];
    case 'table':
      return [{ type: 'table', children: toTableRows(children) }];
    case 'tbody':
    case 'thead':
    case 'tfoot':
      return children;
    case 'tr':
      return [{ type: 'table-row', children: toTableCells(children) }];
    case 'td':
    case 'th':
      return [{ type: 'table-cell', children: children.length ? children : [createParagraph([{ text: '' }])] }];
    case 'p':
      return [{ type: 'paragraph', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    case 'div':
    case 'section':
    case 'article': {
      const hasBlockChildren = children.some(
        (child) => isElementNode(child) && BLOCK_TYPES.has(child.type) && !INLINE_TYPES.has(child.type),
      );
      if (hasBlockChildren) return children;
      return [{ type: 'paragraph', ...(align ? { align } : {}), children: children.length ? children : [{ text: '' }] }];
    }
    default:
      return children;
  }
}

const normalizeTopLevelNodes = (nodes: HtmlNode[]): Descendant[] => {
  const normalizedNodes: HtmlNode[] = [];
  let inlineBuffer: HtmlNode[] = [];

  const flushInlineBuffer = () => {
    if (!inlineBuffer.length) return;
    normalizedNodes.push(createParagraph(inlineBuffer));
    inlineBuffer = [];
  };

  nodes.forEach((node) => {
    if (isTextNode(node)) {
      inlineBuffer.push(node);
      return;
    }

    if (INLINE_TYPES.has(node.type)) {
      inlineBuffer.push(node);
      return;
    }

    flushInlineBuffer();
    normalizedNodes.push(node);
  });

  flushInlineBuffer();
  return (normalizedNodes.length ? normalizedNodes : initialValue) as Descendant[];
};

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const deserializeHtml = (value: string): Descendant[] => {
  if (!looksLikeHtml(value)) {
    return value.split('\n').map((line) => ({
      type: 'paragraph',
      children: [{ text: line }],
    })) as Descendant[];
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, 'text/html');
  return normalizeTopLevelNodes(deserializeChildren(document.body.childNodes));
};

const parseEditorValue = (value?: string | null): Descendant[] => {
  if (!value) return initialValue;

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? (parsedValue as Descendant[]) : deserializeHtml(value);
  } catch (error) {
    return deserializeHtml(value);
  }
};

const UNSUPPORTED_HTML_BLOCK_TYPES = new Set(['table', 'image', 'video', 'code']);

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML ignores raw newlines; 4D / Write-style fragments use <br/> */
const escapeHtmlWithBr = (text: string): string => {
  if (!text.includes('\n')) return escapeHtml(text);
  return text.split('\n').map(escapeHtml).join('<br/>');
};

const hasAnyTextMark = (leaf: Text): boolean => {
  const l = leaf as unknown as HtmlTextNode;
  return !!(
    l.bold ||
    l.italic ||
    l.underline ||
    l.strikethrough ||
    l.code ||
    l.color ||
    l.backgroundColor ||
    l.fontFamily ||
    l.fontSize
  );
};

const containsUnsupportedHtmlBlock = (nodes: Descendant[]): boolean => {
  const walk = (node: Descendant): boolean => {
    if (Text.isText(node)) return false;
    const el = node as HtmlElementNode;
    if (UNSUPPORTED_HTML_BLOCK_TYPES.has(el.type)) return true;
    return el.children.some(walk);
  };
  return nodes.some(walk);
};

const isPlainParagraphsOnly = (nodes: Descendant[]): boolean => {
  if (!nodes.length) return true;
  for (const node of nodes) {
    if (!SlateElement.isElement(node) || (node as HtmlElementNode).type !== 'paragraph') return false;
    for (const child of node.children) {
      if (Text.isText(child)) {
        if (hasAnyTextMark(child)) return false;
      } else {
        return false;
      }
    }
  }
  return true;
};

const plainTextFromParagraphs = (nodes: Descendant[]): string =>
  nodes.map((n) => SlateNode.string(n)).join('\n');

const serializeTextLeafToHtml = (leaf: Text): string => {
  const l = leaf as unknown as HtmlTextNode;
  const text = escapeHtmlWithBr(l.text);
  const styles: string[] = [];
  if (l.bold) styles.push('font-weight:bold');
  if (l.italic) styles.push('font-style:italic');
  const decorations: string[] = [];
  if (l.underline) decorations.push('underline');
  if (l.strikethrough) decorations.push('line-through');
  if (decorations.length) styles.push(`text-decoration:${decorations.join(' ')}`);
  if (l.code && !l.backgroundColor) styles.push('background-color:rgba(0,0,0,0.06)');
  if (l.color) styles.push(`color:${l.color}`);
  if (l.backgroundColor) styles.push(`background-color:${l.backgroundColor}`);
  if (l.fontFamily) styles.push(`font-family:${l.fontFamily}`);
  else if (l.code) styles.push('font-family:monospace');
  if (l.fontSize) styles.push(`font-size:${l.fontSize}`);

  if (!styles.length) return text;
  return `<span style="${styles.join(';')}">${text}</span>`;
};

const serializeInlinesToHtml = (children: Descendant[]): string =>
  children
    .map((child) => {
      if (Text.isText(child)) return serializeTextLeafToHtml(child);
      if (SlateElement.isElement(child) && (child as HtmlElementNode).type === 'link') {
        const href = escapeHtml((child as { url?: string }).url || '');
        return `<a href="${href}">${serializeInlinesToHtml(child.children)}</a>`;
      }
      return escapeHtmlWithBr(SlateNode.string(child));
    })
    .join('');

const alignAttr = (align?: string) =>
  align && ['left', 'center', 'right', 'justify'].includes(align)
    ? ` style="text-align:${align}"`
    : '';

const serializeBlockToHtml = (node: Descendant): string => {
  if (Text.isText(node)) return serializeTextLeafToHtml(node);
  if (!SlateElement.isElement(node)) return '';

  const el = node as SlateElement & HtmlElementNode;
  const a = alignAttr(el.align);

  switch (el.type) {
    case 'paragraph':
      return `<p${a}>${serializeInlinesToHtml(el.children)}</p>`;
    case 'heading-one':
      return `<h1${a}>${serializeInlinesToHtml(el.children)}</h1>`;
    case 'heading-two':
      return `<h2${a}>${serializeInlinesToHtml(el.children)}</h2>`;
    case 'heading-three':
      return `<h3${a}>${serializeInlinesToHtml(el.children)}</h3>`;
    case 'block-quote':
      return `<blockquote${a}>${el.children.map(serializeBlockToHtml).join('')}</blockquote>`;
    case 'bulleted-list':
      return `<ul${a}>${el.children.map(serializeBlockToHtml).join('')}</ul>`;
    case 'numbered-list':
      return `<ol${a}>${el.children.map(serializeBlockToHtml).join('')}</ol>`;
    case 'list-item':
      return `<li${a}>${el.children.map(serializeBlockToHtml).join('')}</li>`;
    default:
      return `<p${a}>${serializeInlinesToHtml(el.children)}</p>`;
  }
};

const serializeDocumentToHtml = (nodes: Descendant[]): string => {
  // Match 4D-style single-block fragments: root <span>…</span> (no <p>), inline <br/> from line breaks
  if (nodes.length === 1 && SlateElement.isElement(nodes[0])) {
    const el = nodes[0] as HtmlElementNode;
    if (el.type === 'paragraph' && !el.align) {
      return `<span>${serializeInlinesToHtml(el.children)}</span>`;
    }
  }
  return nodes.map(serializeBlockToHtml).join('');
};

const serializeEditorValueForDatasource = (nodes: Descendant[]): string => {
  if (containsUnsupportedHtmlBlock(nodes)) return JSON.stringify(nodes);
  if (isPlainParagraphsOnly(nodes)) return plainTextFromParagraphs(nodes);
  return serializeDocumentToHtml(nodes);
};

const TextEditor: FC<ITextEditorProps> = ({
  datasource,
  readOnly,
  style,
  className,
  classNames = [],
}) => {
  const { connect } = useRenderer();
  const [value, updateValue] = useState<Descendant[] | null>(null);

  const setValue = (newValue: Descendant[]) => {
    // compare contents then update to avoid infinite loop
    if (!isEqual(newValue, value)) {
      editor.children = newValue;
      updateValue(newValue);
    }
  };

  const {
    sources: { datasource: ds },
  } = useSources();

  const { id: datasourceID } = splitDatasourceID(datasource);
  const editorWrapperRef = useRef<HTMLDivElement | null>(
    null,
  ) as MutableRefObject<HTMLDivElement | null>; // Explicitly type as MutableRefObject
  const [editor] = useState(() => withInlines(withReact(withHistory(withEmbeds(createEditor())))));

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  const { highlightCode } = useCodeEditor();

  useEffect(() => {
    if (!ds) return;

    const listener = async (/* event */) => {
      const v = await ds.getValue<string>();
      setValue(parseEditorValue(v));
    };

    listener();

    ds.addListener('changed', listener);

    return () => {
      ds.removeListener('changed', listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorWrapperRef.current && !editorWrapperRef.current.contains(event.target as Node)) {
        Transforms.deselect(editor);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editorWrapperRef]);

  const handleOnChange = (newValue: Descendant[]) => {
    if (ds && !datasourceID.startsWith('$')) {
      //you can only set the value on non iterator ds
      ds.setValue(null, serializeEditorValueForDatasource(newValue));
    }
  };

  const handlePaste = useCallback(
    (event: any) => {
      //used to consider pasted lines as one block
      event.preventDefault();
      const html = event.clipboardData.getData('text/html');
      if (html) {
        Transforms.insertFragment(editor, deserializeHtml(html));
        return;
      }

      const text = event.clipboardData.getData('text/plain');
      const newContent = {
        type: 'paragraph',
        children: [{ text }],
      };
      Transforms.insertNodes(editor, newContent);
    },
    [editor],
  );

  // TODO: dynamic padding
  return (
    <div
      ref={(node) => {
        editorWrapperRef.current = node;
        connect(node);
      }}
      style={style}
      className={cn(className, classNames)}
    >
      {value ? (
        <Slate editor={editor as ReactEditor} initialValue={value} onChange={handleOnChange}>
          {!readOnly && <Toolbar readonly={readOnly} />}
          <Editable
            className="p-2"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            readOnly={readOnly}
            decorate={highlightCode}
            onPaste={handlePaste}
            onKeyDown={(e) => handleHotKey(editor, e)}
          />
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
