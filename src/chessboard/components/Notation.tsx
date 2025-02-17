import { useChessboard } from "../context/chessboard-context";

type NotationProps = {
  row: number;
  col: number;
};

export function Notation({ row, col }: NotationProps) {
  const {
    boardDimensions,
    boardOrientation,
    boardWidth,
    customDarkSquareStyle,
    customLightSquareStyle,
    customNotationStyle,
  } = useChessboard();

  const dynamicColumns = Array.from(
    { length: boardDimensions.columns },
    (_, i) => String.fromCharCode(97 + i) // 97 is 'a'
  );
  const squareWidth = boardWidth / boardDimensions.columns;

  const whiteColor = customLightSquareStyle.backgroundColor;
  const blackColor = customDarkSquareStyle.backgroundColor;

  const isRow = col === 0;
  const isColumn = row === (boardDimensions.rows - 1);
  const isBottomLeftSquare = isRow && isColumn;

  function getRow() {
    return boardOrientation === "white" ? boardDimensions.rows - row : row + 1;
  }

  function getColumn() {
    return boardOrientation === "black" ? dynamicColumns[(boardDimensions.columns - 1) - col] : dynamicColumns[col];
  }

  function renderBottomLeft() {
    return (
      <>
        <div
          style={{
            userSelect: "none",
            zIndex: 3,
            position: "absolute",
            ...{ color: ((boardOrientation === "white") ? whiteColor : ((boardDimensions.rows % 2 === 0) === (boardDimensions.columns % 2 === 0)) ? whiteColor : blackColor) },
            ...numericStyle(squareWidth, customNotationStyle),
          }}
        >
          {getRow()}
        </div>
        <div
          style={{
            userSelect: "none",
            zIndex: 3,
            position: "absolute",
            ...{ color: ((boardOrientation === "white") ? whiteColor : ((boardDimensions.rows % 2 === 0) === (boardDimensions.columns % 2 === 0)) ? whiteColor : blackColor) },
            ...alphaStyle(squareWidth, customNotationStyle),
          }}
        >
          {getColumn()}
        </div>
      </>
    );
  }

  function renderLetters() {
    return (
      <div
        style={{
          userSelect: "none",
          zIndex: 3,
          position: "absolute",
          ...{ color: boardOrientation === "white" ? ((col % 2 === 0) ? whiteColor : blackColor) : ((col % 2 !== 0) === (boardDimensions.rows % 2 === 0) === (boardDimensions.columns % 2 === 0) ? blackColor : whiteColor) },
          ...alphaStyle(squareWidth, customNotationStyle),
        }}
      >
        {getColumn()}
      </div>
    );
  }

  function renderNumbers() {
    return (
      <div
        style={{
          userSelect: "none",
          zIndex: 3,
          position: "absolute",
          ...({ color: boardOrientation === "white" ? ((row % 2 === 0) === (boardDimensions.rows % 2 !== 0) ? whiteColor : blackColor) : ((row % 2 === 0) === (boardDimensions.columns % 2 !== 0) ? whiteColor : blackColor) }),
          ...numericStyle(squareWidth, customNotationStyle),
        }}
      >
        {getRow()}
      </div>
    );
  }

  if (isBottomLeftSquare) {
    return renderBottomLeft();
  }

  if (isColumn) {
    return renderLetters();
  }

  if (isRow) {
    return renderNumbers();
  }

  return null;
}

const alphaStyle = (width: number, customNotationStyle?: Record<string, string | number>) => ({
  right: width / 48,
  bottom: 0,
  fontSize: width / 6.2,
  ...customNotationStyle
});

const numericStyle = (width: number, customNotationStyle?: Record<string, string | number>) => ({
  top: 0,
  left: width / 48,
  fontSize: width / 6.2,
  ...customNotationStyle
});
