import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default("healthy"), // healthy, unhealthy, degraded
  instanceCount: integer("instance_count").notNull().default(1),
  load: integer("load").notNull().default(0), // percentage 0-100
  lastHealthCheck: timestamp("last_health_check").defaultNow(),
});

export const circuitBreakers = pgTable("circuit_breakers", {
  id: serial("id").primaryKey(),
  serviceName: text("service_name").notNull(),
  state: text("state").notNull().default("CLOSED"), // CLOSED, OPEN, HALF_OPEN
  failureCount: integer("failure_count").notNull().default(0),
  failureThreshold: integer("failure_threshold").notNull().default(5),
  lastFailure: timestamp("last_failure"),
  timeout: integer("timeout").notNull().default(60000), // milliseconds
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  serviceName: text("service_name").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  responseTime: integer("response_time").notNull().default(0), // milliseconds
  cpuUsage: integer("cpu_usage").notNull().default(0), // percentage
  memoryUsage: integer("memory_usage").notNull().default(0), // percentage
});

export const shards = pgTable("shards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  range: text("range").notNull(), // e.g., "A-H"
  load: integer("load").notNull().default(0), // percentage
  status: text("status").notNull().default("healthy"),
  recordCount: integer("record_count").notNull().default(0),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(), // info, warn, error
  source: text("source").notNull(),
  message: text("message").notNull(),
  metadata: json("metadata"),
});

export const loadTests = pgTable("load_tests", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("stopped"), // running, stopped, completed
  concurrentUsers: integer("concurrent_users").notNull().default(10),
  requestsPerSecond: integer("requests_per_second").notNull().default(1),
  duration: integer("duration").notNull().default(60), // seconds
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  totalRequests: integer("total_requests").notNull().default(0),
  successfulRequests: integer("successful_requests").notNull().default(0),
  failedRequests: integer("failed_requests").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  lastHealthCheck: true,
});

export const insertCircuitBreakerSchema = createInsertSchema(circuitBreakers).omit({
  id: true,
  lastFailure: true,
});

export const insertMetricSchema = createInsertSchema(metrics).omit({
  id: true,
  timestamp: true,
});

export const insertShardSchema = createInsertSchema(shards).omit({
  id: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});

export const insertLoadTestSchema = createInsertSchema(loadTests).omit({
  id: true,
  startTime: true,
  endTime: true,
});

export const updateServiceSchema = insertServiceSchema.partial();
export const updateCircuitBreakerSchema = insertCircuitBreakerSchema.partial().extend({
  lastFailure: z.date().optional(),
});
export const updateLoadTestSchema = insertLoadTestSchema.partial().extend({
  startTime: z.date().optional(),
  endTime: z.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertCircuitBreaker = z.infer<typeof insertCircuitBreakerSchema>;
export type CircuitBreaker = typeof circuitBreakers.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metrics.$inferSelect;
export type InsertShard = z.infer<typeof insertShardSchema>;
export type Shard = typeof shards.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLoadTest = z.infer<typeof insertLoadTestSchema>;
export type LoadTest = typeof loadTests.$inferSelect;
