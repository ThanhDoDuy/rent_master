import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check if process memory heap is below 150MB
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      // Check if process memory RSS is below 150MB
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      // Check if disk storage exceeds 70% usage
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.7 }),
    ]);
  }
}
