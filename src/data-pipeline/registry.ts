/**
 * MandiMitra Data Pipeline: Regional APMC Market Registry
 * Geographic coordinates and canonical metadata for target regional mandis.
 * 
 * OWNER: Amay (Team Lead)
 */

import { Market } from '../contracts/domain';

export const MAHARASHTRA_MANDIS: Market[] = [
  {
    id: 'lasalgaon',
    name: 'Lasalgaon APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.1472,
    lon: 74.2251
  },
  {
    id: 'pimpalgaon',
    name: 'Pimpalgaon Baswant APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.1706,
    lon: 73.9856
  },
  {
    id: 'yeola',
    name: 'Yeola APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.0422,
    lon: 74.4883
  },
  {
    id: 'nashik',
    name: 'Nashik APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 19.9975,
    lon: 73.7898
  },
  {
    id: 'pune',
    name: 'Pune APMC (Gultekdi)',
    state: 'Maharashtra',
    district: 'Pune',
    lat: 18.5204,
    lon: 73.8567
  }
];

export function findMarketById(id: string): Market | undefined {
  return MAHARASHTRA_MANDIS.find(m => m.id === id);
}

export function getAllMarkets(): Market[] {
  return [...MAHARASHTRA_MANDIS];
}
