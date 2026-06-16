import { CSSProperties, forwardRef, PropsWithChildren, Ref, RefObject } from 'react';
import cn from 'classnames';

interface BaseProps {
  className: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
type OrNull<T> = T | null;

const Button = forwardRef(
  (
    {
      className,
      active,
      reversed,
      style,
      ...props
    }: PropsWithChildren<
      {
        active: boolean;
        reversed: boolean;
      } & BaseProps
    >,
    ref: Ref<OrNull<HTMLSpanElement>>,
  ) => {
    const color = reversed
      ? active
        ? '#ffffff'
        : '#aaaaaa'
      : active
        ? '#000000'
        : 'rgba(0, 0, 0, 0.7)';

    return (
      <span
        {...props}
        ref={ref as RefObject<HTMLSpanElement>}
        style={{ color, ...style }}
        className={cn(className, 'cursor-pointer text-xl w-8 h-8 flex items-center justify-left')}
      />
    );
  },
);

// css`color: ${reversed ? (active ? 'white' : '#aaa') : active ? 'black' : '#ccc'};`

export default Button;
