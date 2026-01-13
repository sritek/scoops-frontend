/**
 * Application configuration
 * Environment variables and constants
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
    timeout: 30000,
  },

  // App Settings
  app: {
    name: "Scoops",
    description: "School/Coaching Operations SaaS",
    version: "1.0.0",
  },

  // Pagination Defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

export type Config = typeof config;
