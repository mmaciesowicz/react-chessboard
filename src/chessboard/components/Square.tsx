import { ReactNode, useEffect, useRef } from "react";
import { useDrop } from "react-dnd";

import { useChessboard } from "../context/chessboard-context";
import { BoardDimensions, BoardOrientation, Coords, Piece, Square as Sq } from "../types";

type SquareProps = {
  children: ReactNode;
  setSquares: React.Dispatch<React.SetStateAction<{ [square in Sq]?: Coords }>>;
  square: Sq;
  squareColor: "white" | "black";
  squareHasPremove: boolean;
};

export function Square({
  square,
  squareColor,
  setSquares,
  squareHasPremove,
  children,
}: SquareProps) {
  const squareRef = useRef<HTMLElement>(null);
  const {
    autoPromoteToQueen,
    boardDimensions,
    boardWidth,
    boardOrientation,
    clearArrows,
    currentPosition,
    currentRightClickDown,
    customBoardStyle,
    customDarkSquareStyle,
    customDropSquareStyle,
    customLightSquareStyle,
    customPremoveDarkSquareStyle,
    customPremoveLightSquareStyle,
    customSquare: CustomSquare,
    customSquareStyles,
    drawNewArrow,
    handleSetPosition,
    handleSparePieceDrop,
    isWaitingForAnimation,
    lastPieceColour,
    lastSquareDraggedOver,
    onArrowDrawEnd,
    onDragOverSquare,
    onMouseOutSquare,
    onMouseOverSquare,
    onPieceDrop,
    onPromotionCheck,
    onRightClickDown,
    onRightClickUp,
    onSquareClick,
    setLastSquareDraggedOver,
    setPromoteFromSquare,
    setPromoteToSquare,
    setShowPromoteDialog,
  } = useChessboard();

  const boardHeight = (boardWidth * boardDimensions.rows) / boardDimensions.columns;

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "piece",
      drop: handleDrop,
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [
      square,
      currentPosition,
      onPieceDrop,
      isWaitingForAnimation,
      lastPieceColour,
    ]
  );

  type BoardPiece = {
    piece: Piece;
    readonly isSpare: false;
    square: Sq;
    id: number;
  };
  type SparePiece = { piece: Piece; readonly isSpare: true; id: number };

  function handleDrop(item: BoardPiece | SparePiece) {
    if (item.isSpare) {
      handleSparePieceDrop(item.piece, square);
      return;
    }
    if (onPromotionCheck(item.square, square, item.piece)) {
      if (autoPromoteToQueen) {
        handleSetPosition(
          item.square,
          square,
          item.piece[0] === "w" ? "wQ" : "bQ"
        );
      } else {
        setPromoteFromSquare(item.square);
        setPromoteToSquare(square);
        setShowPromoteDialog(true);
      }
    } else {
      handleSetPosition(item.square, square, item.piece, true);
    }
  }

  useEffect(() => {
    if (squareRef.current) {
      const { x, y } = squareRef.current.getBoundingClientRect();
      setSquares((oldSquares) => ({ ...oldSquares, [square]: { x, y } }));
    }
  }, [boardWidth, boardHeight, boardOrientation]);

  const defaultSquareStyle = {
    ...borderRadius(square, boardDimensions, boardOrientation, customBoardStyle),
    ...(squareColor === "black"
      ? customDarkSquareStyle
      : customLightSquareStyle),
    ...(squareHasPremove &&
      (squareColor === "black"
        ? customPremoveDarkSquareStyle
        : customPremoveLightSquareStyle)),
    ...(isOver && customDropSquareStyle),
  };

  return (
    <div
      ref={drop}
      style={defaultSquareStyle}
      data-square-color={squareColor}
      data-square={square}
      onTouchMove={(e) => {
        // Handle touch events on tablet and mobile not covered by onMouseOver/onDragEnter
        const touchLocation = e.touches[0];
        const touchElement = document.elementsFromPoint(
          touchLocation.clientX,
          touchLocation.clientY
        );
        const draggedOverSquare = touchElement
          ?.find((el) => el.getAttribute("data-square"))
          ?.getAttribute("data-square") as Sq;
        if (draggedOverSquare && draggedOverSquare !== lastSquareDraggedOver) {
          setLastSquareDraggedOver(draggedOverSquare);
          onDragOverSquare(draggedOverSquare);
        }
      }}
      onMouseOver={(e) => {
        // noop if moving from child of square into square.
        if (e.buttons === 2 && currentRightClickDown) {
          drawNewArrow(currentRightClickDown, square);
        }

        if (
          e.relatedTarget &&
          e.currentTarget.contains(e.relatedTarget as Node)
        ) {
          return;
        }

        onMouseOverSquare(square);
      }}
      onMouseOut={(e) => {
        // noop if moving from square into a child of square.
        if (
          e.relatedTarget &&
          e.currentTarget.contains(e.relatedTarget as Node)
        )
          return;
        onMouseOutSquare(square);
      }}
      onMouseDown={(e) => {
        if (e.button === 2) onRightClickDown(square);
      }}
      onMouseUp={(e) => {
        if (e.button === 2) {
          if (currentRightClickDown)
            onArrowDrawEnd(currentRightClickDown, square);
          onRightClickUp(square);
        }
      }}
      onDragEnter={() => onDragOverSquare(square)}
      onClick={() => {
        const piece = currentPosition[square];
        onSquareClick(square, piece);
        clearArrows();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      {typeof CustomSquare === "string" ? (
        <CustomSquare
          // Type is too complex to properly evaluate, so ignore this line.
          // @ts-ignore
          ref={squareRef as any}
          style={{
            ...size(boardWidth, boardHeight, boardDimensions),
            ...center,
            ...(!squareHasPremove && customSquareStyles?.[square]),
            position: 'relative',
          }}
        >
          {children}
        </CustomSquare>
      ) : (
        <CustomSquare
          ref={squareRef}
          square={square}
          squareColor={squareColor}
          style={{
            ...size(boardWidth, boardHeight, boardDimensions),
            ...center,
            ...(!squareHasPremove && customSquareStyles?.[square]),
          }}
        >
          {children}
        </CustomSquare>
      )}
    </div>
  );
}

const center = {
  display: "flex",
  position: "relative",
};

const size = (
  width: number,
  height: number,
  boardDimensions: BoardDimensions = { rows: 8, columns: 8 }
) => ({
  width: width / boardDimensions.columns,
  height: height / boardDimensions.rows,
});

const borderRadius = (
  square: Sq,
  boardDimensions: BoardDimensions = {rows: 8, columns: 8},
  boardOrientation: BoardOrientation,
  customBoardStyle?: Record<string, string | number>
) => {
  if (!customBoardStyle?.borderRadius) return {};

  if (square === "a1") {
    return boardOrientation === "white"
      ? { borderBottomLeftRadius: customBoardStyle.borderRadius }
      : { borderTopRightRadius: customBoardStyle.borderRadius };
  }
  if (square === `a${boardDimensions.rows}`) {
    return boardOrientation === "white"
      ? { borderTopLeftRadius: customBoardStyle.borderRadius }
      : { borderBottomRightRadius: customBoardStyle.borderRadius };
  }
  if (square === "h1") {
    return boardOrientation === "white"
      ? { borderBottomRightRadius: customBoardStyle.borderRadius }
      : { borderTopLeftRadius: customBoardStyle.borderRadius };
  }
  if (square === `h${boardDimensions.rows}`) {
    return boardOrientation === "white"
      ? { borderTopRightRadius: customBoardStyle.borderRadius }
      : { borderBottomLeftRadius: customBoardStyle.borderRadius };
  }

  return {};
};
