import { useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';

const useCodeEditor = () => {
  const highlightCode = useCallback(([node, path]: any) => {
    const ranges: any[] = []; //BaseRange[]

    if (node.children && node.children[0] && node.language) {
      const editorCode = node.children[0].text;
      const language = node.language || '';
      const codeTokens = Prism.tokenize(editorCode, Prism.languages[language]);
      let start = 0;
      for (const token of codeTokens) {
        const length = token.length;
        const end = start + length;
        if (typeof token !== 'string' && token.type) {
          ranges.push({
            anchor: { path, offset: start },
            focus: { path, offset: end },
            code: true,
            token: token.type,
          });
        }
        start = end;
      }
    }
    return ranges;
  }, []);

  return {
    highlightCode,
  };
};

export default useCodeEditor;
