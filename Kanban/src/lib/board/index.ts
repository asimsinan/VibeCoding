/**
 * Board module exports
 * Centralized exports for board functionality
 */

// Types
export type {
  Board,
  Column,
  CreateBoardData,
  UpdateBoardData,
  CreateColumnData,
  UpdateColumnData,
  BoardResponse,
  ColumnResponse,
} from './types';

// Services
export { BoardService } from './services/boardService';

// Hooks
export { useBoard } from './hooks/useBoard';
export type { UseBoardReturn } from './hooks/useBoard';

// Components
export { BoardView } from './components/BoardView';
export { CreateBoardForm } from './components/CreateBoardForm';
export { ColumnHeader } from './components/ColumnHeader';
