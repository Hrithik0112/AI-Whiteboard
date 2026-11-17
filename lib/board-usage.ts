export const BOARD_LIMIT = 3;

export function boardUsage(activeBoards: number) {
  return {
    boardCount: activeBoards,
    boardLimit: BOARD_LIMIT,
    credits: Math.max(0, BOARD_LIMIT - activeBoards),
  };
}
