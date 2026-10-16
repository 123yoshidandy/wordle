/**
 * API Gateway（WebSocket）から呼ばれる Lambda の入口
 * 部屋の処理は netplay-kit の共通部品が行い、対戦の中身はゲームの定義（game-definition.js）で決める
 */

import { createHandler } from '../netplay/handler.js';
import game from './game-definition.js';

export const handler = createHandler(game);
