import { useState, useMemo } from "react";
import { useChessboard } from "../context/chessboard-context";
import { Coords, Piece as Pc, Square as Sq } from "../types";
import { Notation } from "./Notation";
import { Piece } from "./Piece";
import { Square } from "./Square";

// this type shows the exact route of each premoved piece
type PremovesHistory = {
  piece: Pc;
  premovesRoute: { sourceSq: Sq; targetSq: Sq; index: number }[];
}[];

export function Squares() {
  const [squares, setSquares] = useState<{ [square in Sq]?: Coords }>({});

  const {
    arePremovesAllowed,
    boardDimensions,
    boardOrientation,
    boardWidth,
    currentPosition,
    id,
    premoves,
    showBoardNotation,
  } = useChessboard();

  const dynamicColumns = Array.from(
    { length: boardDimensions.columns },
    (_, i) => String.fromCharCode(97 + i) // 97 is 'a'
  );

  const premovesHistory: PremovesHistory = useMemo(() => {
    const result: PremovesHistory = [];
    // if premoves aren't allowed, don't waste time on calculations
    if (!arePremovesAllowed) return [];

    premoves.forEach((premove, index) => {
      const { sourceSq, targetSq, piece } = premove;

      // determine if the premove is made by an already premoved piece
      const relatedPremovedPiece = result.find(
        (p) =>
          p.piece === piece && p.premovesRoute.at(-1)?.targetSq === sourceSq
      );

      // if premove has been made by already premoved piece then write the move to its `premovesRoute` field to be able find its final destination later
      if (relatedPremovedPiece) {
        relatedPremovedPiece.premovesRoute.push({ sourceSq, targetSq, index });
      }
      // if premove has been made by standard piece create new object in `premovesHistory` where we will keep its own premoves
      else {
        result.push({
          piece,
          // index is useful for scenarios where two or more pieces are targeting the same square
          premovesRoute: [{ sourceSq, targetSq, index }],
        });
      }
    });

    return result;
  }, [premoves]);

  return (
    <div data-boardid={id}>
      {[...Array(boardDimensions.rows)].map((_, r) => {
        return (
          <div
            key={r.toString()}
            style={{
              display: "flex",
              flexWrap: "nowrap",
              width: boardWidth,
            }}
          >
            {[...Array(boardDimensions.columns)].map((_, c) => {
              const square =
                boardOrientation === "black"
                  ? ((dynamicColumns[boardDimensions.columns - 1 - c] + (r + 1)) as Sq)
                  : ((dynamicColumns[c] + (boardDimensions.rows - r)) as Sq);          
              
              const squareColor = (r + c) % 2 === 0 === (boardOrientation === "white" ? boardDimensions.rows % 2 !== 0 : boardDimensions.columns % 2 !== 0) ? "black" : "white";
              const squareHasPremove = premoves.some(
                (p) => p.sourceSq === square || p.targetSq === square
              );
              const squareHasPremoveTarget = premovesHistory
                .filter(({ premovesRoute }) => premovesRoute.at(-1)?.targetSq === square)
                .sort(
                  (a, b) =>
                    b.premovesRoute.at(-1)?.index! - a.premovesRoute.at(-1)?.index!
                )
                .at(0);

              return (
                <Square
                  key={`${c}${r}`}
                  square={square}
                  squareColor={squareColor}
                  setSquares={setSquares}
                  squareHasPremove={!!squareHasPremove}
                >
                  {!squareHasPremove && currentPosition[square] && (
                    <Piece
                      piece={currentPosition[square] as Pc}
                      square={square}
                      squares={squares}
                    />
                  )}
                  {squareHasPremoveTarget && (
                    <Piece
                      isPremovedPiece={true}
                      piece={squareHasPremoveTarget.piece}
                      square={square}
                      squares={squares}
                    />
                  )}
                  {showBoardNotation && <Notation row={r} col={c} />}
                </Square>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
