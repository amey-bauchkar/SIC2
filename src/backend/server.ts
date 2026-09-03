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
  getBacktestController,
  stressTestController,
  bhedVivekAnalyzeController
} from './controllers';
import { config } from '../config';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

import { 
  getFarmerPools, 
  insertFarmerPool, 
  insertPriceAlert, 
  getPriceAlerts 
} from './supabase';

// API Routes
app.get('/api/markets/nearby', getNearbyMarketsController);
app.get('/api/prices/live', getLivePriceController);
app.post('/api/evaluate', evaluateController);
app.post('/api/evaluate/stress-test', stressTestController);
app.post('/api/bhed-vivek/analyze', bhedVivekAnalyzeController);
app.get('/api/backtest', getBacktestController);

// Supabase Cloud Routes (SajhaBazaar Farmer Pooling & Price Alerts)
app.get('/api/pools', async (_req, res) => {
  const result = await getFarmerPools();
  res.json(result);
});

app.post('/api/pools/join', async (req, res) => {
  const result = await insertFarmerPool(req.body);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.status(201).json(result);
});

app.post('/api/alerts/subscribe', async (req, res) => {
  const result = await insertPriceAlert(req.body);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.status(201).json(result);
});

app.get('/api/alerts', async (_req, res) => {
  const alerts = await getPriceAlerts();
  res.json({ alerts });
});

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
