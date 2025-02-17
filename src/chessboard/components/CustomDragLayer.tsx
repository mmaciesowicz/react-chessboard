import { ReactNode, useCallback } from "react";
import { useDragLayer, XYCoord } from "react-dnd";

import { useChessboard } from "../context/chessboard-context";
import { CustomPieceFn, Piece, Square } from "../types";

export type CustomDragLayerProps = {
  boardContainer: { left: number; top: number };
};

export function CustomDragLayer({ boardContainer }: CustomDragLayerProps) {
  const {
    boardWidth,
    boardDimensions,
    chessPieces,
    id,
    snapToCursor,
    allowDragOutsideBoard,
  } = useChessboard();

  const boardHeight = (boardWidth * boardDimensions.rows) / boardDimensions.columns;
  const squareWidth = boardWidth / boardDimensions.columns;

  const collectedProps = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    clientOffset: monitor.getClientOffset(),
    sourceClientOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  const {
    isDragging,
    item,
    clientOffset,
    sourceClientOffset,
  }: {
    item: { piece: Piece; square: Square; id: number };
    clientOffset: XYCoord | null;
    sourceClientOffset: XYCoord | null;
    isDragging: boolean;
  } = collectedProps;

  const getItemStyle = useCallback(
    (clientOffset: XYCoord | null, sourceClientOffset: XYCoord | null) => {
      if (!clientOffset || !sourceClientOffset) return { display: "none" };

      let { x, y } = snapToCursor ? clientOffset : sourceClientOffset;
      const halfSquareWidth = squareWidth / 2;

      if (snapToCursor) {
        x -= halfSquareWidth;
        y -= halfSquareWidth;
      }

      if (!allowDragOutsideBoard) {
        const { left, top } = boardContainer;

        const maxLeft = left - halfSquareWidth;
        const maxTop = top - halfSquareWidth;
        const maxRight = left + boardWidth - halfSquareWidth;
        const maxBottom = top + boardHeight - halfSquareWidth;

        x = Math.max(maxLeft, Math.min(x, maxRight));
        y = Math.max(maxTop, Math.min(y, maxBottom));
      }

      const transform = `translate(${x}px, ${y}px)`;

      return {
        transform,
        WebkitTransform: transform,
        touchAction: "none",
      };
    },
    [squareWidth, boardWidth, boardHeight, allowDragOutsideBoard, snapToCursor, boardContainer]
  );

  return isDragging && item.id === id ? (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 10,
        left: 0,
        top: 0,
      }}
    >
      <div style={getItemStyle(clientOffset, sourceClientOffset)}>
        {typeof chessPieces[item.piece] === "function" ? (
          (chessPieces[item.piece] as CustomPieceFn)({
            squareWidth,
            isDragging: true,
          })
        ) : (
          <svg viewBox={"1 1 43 43"} width={squareWidth} height={squareWidth}>
            <g>{chessPieces[item.piece] as ReactNode}</g>
          </svg>
        )}
      </div>
    </div>
  ) : null;
}
