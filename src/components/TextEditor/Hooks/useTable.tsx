import { Editor, Path, Transforms, Node } from 'slate';
import has from 'lodash/has';
const useTable = () => {
  //detecting the positions/Path of the current row/cell
  const getRowPosition = (editor: Editor): Path | null => {
    const { selection } = editor;
    if (!selection) return null;

    const [match] = Editor.nodes(editor, {
      match: (n) => (n as any).type === 'table-row',
    });

    return match ? match[1] : null;
  };

  const getCellPosition = (editor: Editor): Path | null => {
    const { selection } = editor;
    if (!selection) return null;
    const [match] = Editor.nodes(editor, {
      match: (n) => (n as any).type === 'table-cell',
    });
    return match ? match[1] : null;
  };

  //inserting/removing rows/cells
  const insertRow = (editor: Editor, position: string, table: any) => {
    //below or above
    const rowPath = getRowPosition(editor);
    let insertPath: Path;
    if (rowPath) {
      const newRow = {
        type: 'table-row',
        children: table[0].children[0].children.map(() => ({
          type: 'table-cell',
          children: [{ text: '' }],
        })),
      };
      if (position === 'above') {
        insertPath = rowPath;
      } else {
        insertPath = Path.next(rowPath);
      }
      Transforms.insertNodes(editor, newRow, { at: insertPath });
    }
  };

  const insertCell = (editor: Editor, position: string, table: any) => {
    //left or right
    const cellPath = getCellPosition(editor);
    if (cellPath) {
      const rowPath = Path.parent(cellPath);
      const tablePath = Path.parent(rowPath);

      table[0].children.forEach((_row: any, rowIndex: any) => {
        let cellPosition: number;
        if (position === 'left') {
          cellPosition = cellPath[cellPath.length - 1];
        } else {
          cellPosition = cellPath[cellPath.length - 1] + 1;
        }
        const rowInsertPath = [...tablePath, rowIndex, cellPosition];
        const newCell = {
          type: 'table-cell',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, newCell, { at: rowInsertPath });
      });
    }
  };

  const deleteRow = (editor: Editor) => {
    const rowPath = getRowPosition(editor);
    if (rowPath) {
      Transforms.removeNodes(editor, { at: rowPath });
      const cellPath = Path.parent(rowPath);
      const rowNode: Node = Node.get(editor, cellPath);
      if (rowNode && has((rowNode as any).children[0], 'text')) {
        Transforms.removeNodes(editor, { at: cellPath });
      }
    }
  };

  const deleteCell = (editor: Editor) => {
    const cellPath = getCellPosition(editor);
    if (cellPath) {
      Transforms.removeNodes(editor, { at: cellPath });
      const rowPath = Path.parent(cellPath);
      const rowNode: Node = Node.get(editor, rowPath);
      if (rowNode && has((rowNode as any).children[0], 'text')) {
        Transforms.removeNodes(editor, { at: rowPath });
      }
    }
  };

  const deleteTable = (editor: Editor, table: any) => {
    if (editor && table) {
      Transforms.removeNodes(editor, {
        at: table[1],
      });
    }
  };

  return {
    deleteRow,
    deleteCell,
    deleteTable,
    insertCell,
    insertRow,
  };
};

export default useTable;
