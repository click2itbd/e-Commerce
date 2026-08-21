import { IHostingProvider, HostingProvisionRequest, HostingProvisionResult, HostingUsageStats } from './IHostingProvider';

export class CpanelHostingProvider implements IHostingProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiKey: string, apiUrl?: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || 'https://localhost:2087';
  }

  private async whmRequest(action: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.apiUrl}/${action}`);
    url.searchParams.set('api.version', '1');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `whm ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Invalid WHM response: ${rawText}`);
    }

    if (!response.ok || data?.metadata?.result?.message) {
      const message = data?.metadata?.result?.message || `WHM API error: ${response.statusText}`;
      throw new Error(message);
    }

    return data;
  }

  async provisionAccount(request: HostingProvisionRequest): Promise<HostingProvisionResult> {
    const { domain, contactEmail, billingCycle, planCode } = request;
    const username = domain.replace(/\./g, '').substring(0, 16);

    try {
      const result = await this.whmRequest('createacct', {
        username,
        password: this.generatePassword(),
        domain,
        plan: planCode || 'default',
        contactemail: contactEmail,
        billingcycle: billingCycle || 'monthly',
      });

      const accountData = result?.data?.cpanel || {};
      const hostname = new URL(this.apiUrl).hostname;

      return {
        success: true,
        providerAccountId: username,
        cPanelUrl: `https://${hostname}:2083`,
        nameservers: ['ns1.example.com', 'ns2.example.com'],
        error: undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create hosting account',
      };
    }
  }

  async suspendAccount(providerAccountId: string): Promise<void> {
    await this.whmRequest('suspendacct', { user: providerAccountId });
  }

  async unsuspendAccount(providerAccountId: string): Promise<void> {
    await this.whmRequest('unsuspendacct', { user: providerAccountId });
  }

  async terminateAccount(providerAccountId: string): Promise<void> {
    await this.whmRequest('killacct', { user: providerAccountId, preserve_dns: '1' });
  }

  async getUsage(providerAccountId: string): Promise<HostingUsageStats> {
    const result = await this.whmRequest('accountsummary', { user: providerAccountId });
    const data = result?.data || {};
    const plan = data.plan || {};
    const diskUsage = data.disk_usage || {};

    return {
      providerAccountId,
      diskUsageMB: Math.round(diskUsage.used || 0),
      diskLimitMB: plan.disklimit ? this.parseLimit(plan.disklimit) : 10240,
      bandwidthUsageMB: Math.round(diskUsage.bandwidth || 0),
      bandwidthLimitMB: plan.bandwidth ? this.parseLimit(plan.bandwidth) : 102400,
      cpuUsagePercent: data.cpu_usage ? parseFloat(data.cpu_usage) : undefined,
      ramUsageMB: data.mem_usage ? Math.round(data.mem_usage) : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }

  async changePlan(providerAccountId: string, newPlanCode: string): Promise<void> {
    await this.whmRequest('changepackage', { user: providerAccountId, pkg: newPlanCode });
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-12) + 'A1!';
  }

  private parseLimit(value: string): number {
    if (!value) return 0;
    const num = parseFloat(value);
    if (value.toLowerCase().includes('gb')) return num * 1024;
    if (value.toLowerCase().includes('mb')) return num;
    return num;
  }
}
