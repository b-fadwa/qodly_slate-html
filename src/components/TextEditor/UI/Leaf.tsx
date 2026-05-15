import { FC } from 'react';
import cn from 'classnames';
interface Leaf {
  attributes: any;
  children: any;
  leaf: any;
}

const Leaf: FC<Leaf> = ({ attributes, children, leaf }) => {
  let style = {};

  const leafClasses = cn({
    'font-bold': leaf.bold,
    'font-mono': leaf.code,
    italic: leaf.italic,
    underline: leaf.underline,
    'line-through': leaf.strikethrough,
  });

  if (leaf.code) {
    children = (
      <span {...attributes} className={`token ${leaf.token}`}>
        {children}
      </span>
    );
  }

  if (leaf.color) {
    style = { ...style, color: leaf.color };
  }

  if (leaf.backgroundColor) {
    style = { ...style, backgroundColor: leaf.backgroundColor };
  }

  if (leaf.fontFamily) {
    style = { ...style, fontFamily: leaf.fontFamily };
  }

  if (leaf.fontSize) {
    style = { ...style, fontSize: leaf.fontSize };
  }

  const title = typeof children === 'string' ? children : undefined;

  return (
    <span {...attributes} title={title} className={leafClasses} style={style}>
      {children}
    </span>
  );
};

export default Leaf;
