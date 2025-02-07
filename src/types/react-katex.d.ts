declare module 'react-katex' {
  import { FC } from 'react';

  interface KaTeXProps {
    children: string;
    className?: string;
  }

  export const InlineMath: FC<KaTeXProps>;
  export const BlockMath: FC<KaTeXProps>;
}
