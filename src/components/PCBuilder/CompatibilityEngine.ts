import { Product } from '../../types';

export interface CompatibilityReport {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
}

export class CompatibilityEngine {
  
  /**
   * Evaluates the selected components and returns a comprehensive compatibility report.
   */
  static evaluate(selectedProducts: Record<string, Product>): CompatibilityReport {
    const report: CompatibilityReport = {
      isCompatible: true,
      errors: [],
      warnings: []
    };

    const cpu = selectedProducts['cpu'];
    const mobo = selectedProducts['motherboard'];
    const ram = selectedProducts['ram'];
    const casing = selectedProducts['casing'];
    const gpu = selectedProducts['graphics-card'];
    const cooler = selectedProducts['cpu-cooler'];
    const psu = selectedProducts['power-supply'];
    
    // 1. CPU & Motherboard Socket Check
    if (cpu && mobo) {
      if (cpu.socketType && mobo.socketType && cpu.socketType !== mobo.socketType) {
        report.errors.push(`Socket mismatch: ${cpu.name} uses ${cpu.socketType} but motherboard supports ${mobo.socketType}.`);
      }
    }

    // 2. RAM & Motherboard Check
    if (ram && mobo) {
      if (ram.ramType && mobo.ramType && ram.ramType !== mobo.ramType) {
        report.errors.push(`RAM mismatch: ${ram.name} is ${ram.ramType}, but motherboard requires ${mobo.ramType}.`);
      }
    }

    // 3. Physical Dimensions: Motherboard & Casing
    if (mobo && casing) {
      if (mobo.formFactor && casing.formFactor) {
        const boardSize = this.getFormFactorSize(mobo.formFactor);
        const caseSize = this.getFormFactorSize(casing.formFactor);
        if (boardSize > caseSize) {
          report.errors.push(`Form Factor mismatch: Casing does not support ${mobo.formFactor} motherboards.`);
        }
      }
    }

    // 4. Physical Dimensions: GPU & Casing
    if (gpu && casing) {
      if (gpu.length && casing.length) {
        if (gpu.length > casing.length) {
          report.errors.push(`GPU Clearance: Graphics card (${gpu.length}mm) is too long for the casing (max ${casing.length}mm).`);
        } else if (casing.length - gpu.length < 15) {
          report.warnings.push(`GPU clearance is very tight. Graphics card is ${gpu.length}mm and casing max is ${casing.length}mm.`);
        }
      }
    }

    // 5. Physical Dimensions: Cooler & Casing
    if (cooler && casing) {
      if (cooler.height && casing.height) {
        if (cooler.height > casing.height) {
          report.errors.push(`Cooler Height: CPU Cooler (${cooler.height}mm) is too tall for the casing (max ${casing.height}mm).`);
        }
      }
    }

    // 6. Power Supply Check
    if (psu) {
      const totalTdp = this.calculateTotalTDP(selectedProducts);
      const recommendedWattage = totalTdp * 1.2; // 20% headroom
      const psuWattage = this.extractWattage(psu.name) || psu.tdp || 0; // Use TDP or regex for Wattage

      if (psuWattage > 0) {
        if (psuWattage < totalTdp) {
          report.errors.push(`Power Supply is too weak. System requires at least ${totalTdp}W, but PSU is ${psuWattage}W.`);
        } else if (psuWattage < recommendedWattage) {
          report.warnings.push(`Power Supply is sufficient, but ${recommendedWattage}W or higher is recommended for safety and future upgrades.`);
        }
      }
    }
    
    // 7. CPU & GPU Bottleneck Check
    if (cpu && gpu) {
      const cpuTier = this.getTier(cpu.name);
      const gpuTier = this.getTier(gpu.name);
      
      if (Math.abs(cpuTier - gpuTier) >= 2) {
        if (cpuTier < gpuTier) {
          report.warnings.push(`Bottleneck Warning: Your CPU (${cpu.name}) might bottleneck your high-end GPU (${gpu.name}). Consider a faster CPU.`);
        } else {
          report.warnings.push(`Bottleneck Warning: Your GPU (${gpu.name}) might bottleneck your high-end CPU (${cpu.name}) in gaming workloads.`);
        }
      }
    }

    if (report.errors.length > 0) {
      report.isCompatible = false;
    }

    return report;
  }

  private static getTier(name: string): number {
    const n = name.toLowerCase();
    // High-end (Tier 3)
    if (n.includes('i9') || n.includes('ryzen 9') || n.includes('4090') || n.includes('4080') || n.includes('7900')) return 3;
    // Mid-range (Tier 2)
    if (n.includes('i7') || n.includes('ryzen 7') || n.includes('4070') || n.includes('3080') || n.includes('7800') || n.includes('7700')) return 2;
    // Entry-level (Tier 1)
    return 1;
  }

  static calculateTotalTDP(selectedProducts: Record<string, Product>): number {
    let total = 0;
    // Base system TDP (fans, SSDs, etc)
    total += 50; 

    Object.values(selectedProducts).forEach(product => {
      if (!product) return;
      if (product.tdp) {
        total += product.tdp;
      } else {
        // Fallbacks based on category if TDP is not explicitly provided
        switch(product.category.toLowerCase()) {
          case 'cpu': total += 65; break; // average 65W
          case 'graphics card':
          case 'gpu': total += 200; break; // average 200W
          case 'motherboard': total += 30; break;
          case 'ram': total += 10; break;
          case 'storage': total += 10; break;
        }
      }
    });

    return total;
  }

  private static extractWattage(name: string): number | null {
    const match = name.match(/(\d{3,4})\s*w/i);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Helper to rank form factors to determine fit.
   * e.g., ATX (3) will not fit in Mini-ITX (1) case.
   */
  private static getFormFactorSize(formFactor: string): number {
    const ff = formFactor.toLowerCase();
    if (ff.includes('e-atx')) return 4;
    if (ff.includes('atx')) return 3;
    if (ff.includes('micro') || ff.includes('m-atx')) return 2;
    if (ff.includes('mini') || ff.includes('itx')) return 1;
    return 3; // Default to ATX size
  }
}
