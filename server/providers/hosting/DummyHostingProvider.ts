import { IHostingProvider, HostingProvisionRequest, HostingProvisionResult, HostingUsageStats } from './IHostingProvider';

export class DummyHostingProvider implements IHostingProvider {
  private planLimits: Record<string, { diskMB: number; bandwidthMB: number }> = {
    'basic': { diskMB: 10240, bandwidthMB: 102400 },
    'starter': { diskMB: 5120, bandwidthMB: 51200 },
    'business': { diskMB: 51200, bandwidthMB: 512000 },
    'enterprise': { diskMB: 102400, bandwidthMB: 1024000 },
  };

  private randomDelay(min = 500, max = 1200): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateFakeIp(): string {
    return `103.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private getPlanDefault(planCode: string): { diskMB: number; bandwidthMB: number } {
    return this.planLimits[planCode.toLowerCase()] || { diskMB: 10240, bandwidthMB: 102400 };
  }

  async provisionAccount(request: HostingProvisionRequest): Promise<HostingProvisionResult> {
    console.log('[DummyHostingProvider] provisionAccount called with:', request);
    await this.randomDelay(1000, 2000);

    const success = Math.random() < 0.9;

    if (success) {
      const username = request.username || request.domain.split('.')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8);
      const providerAccountId = `dummy-hosting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      return {
        success: true,
        providerAccountId,
        cPanelUrl: `https://${request.domain}:2083`,
        nameservers: ['ns1.click2itbd.com', 'ns2.click2itbd.com'],
      };
    } else {
      return {
        success: false,
        error: 'Provisioning failed due to simulated random error',
      };
    }
  }

  async suspendAccount(providerAccountId: string): Promise<void> {
    console.log(`[DummyHostingProvider] suspendAccount called with: ${providerAccountId}`);
    await this.randomDelay(300, 800);
  }

  async unsuspendAccount(providerAccountId: string): Promise<void> {
    console.log(`[DummyHostingProvider] unsuspendAccount called with: ${providerAccountId}`);
    await this.randomDelay(300, 800);
  }

  async terminateAccount(providerAccountId: string): Promise<void> {
    console.log(`[DummyHostingProvider] terminateAccount called with: ${providerAccountId}`);
    await this.randomDelay(500, 1000);
  }

  async getUsage(providerAccountId: string): Promise<HostingUsageStats> {
    console.log(`[DummyHostingProvider] getUsage called with: ${providerAccountId}`);
    await this.randomDelay(200, 500);

    const planDefault = this.getPlanDefault('basic');
    const diskUsageMB = Math.floor(Math.random() * planDefault.diskMB * 0.8);
    const bandwidthUsageMB = Math.floor(Math.random() * planDefault.bandwidthMB * 0.8);

    return {
      providerAccountId,
      diskUsageMB,
      diskLimitMB: planDefault.diskMB,
      bandwidthUsageMB,
      bandwidthLimitMB: planDefault.bandwidthMB,
      cpuUsagePercent: Math.floor(Math.random() * 80),
      ramUsageMB: Math.floor(Math.random() * 4096),
      lastUpdated: new Date().toISOString(),
    };
  }

  async changePlan(providerAccountId: string, newPlanCode: string): Promise<void> {
    console.log(`[DummyHostingProvider] changePlan called with: ${providerAccountId} -> ${newPlanCode}`);
    await this.randomDelay(600, 1200);
  }
}
