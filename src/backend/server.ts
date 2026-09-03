/**
 * MandiMitra Backend HTTP Server
 * Express application mounting controllers and static routing.
 * 
 * OWNER: Amay (Team Lead)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  getNearbyMarketsController, 
  getLivePriceController, 
  evaluateController, 
  getBacktestController 
} from './controllers';
import { config } from '../config';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/markets/nearby', getNearbyMarketsController);
app.get('/api/prices/live', getLivePriceController);
app.post('/api/evaluate', evaluateController);
app.get('/api/backtest', getBacktestController);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'MandiMitra',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = config.port;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[MandiMitra Backend] Server listening on http://localhost:${PORT}`);
    console.log(`[MandiMitra Backend] Mode: ${config.env} | Model: ${config.enableV1Gbm ? 'v1-gbm' : 'v0-heuristic'}`);
  });
}

export default app;
