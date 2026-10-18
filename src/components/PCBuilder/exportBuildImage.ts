import { Product } from '../../types';
import { CompatibilityEngine } from './CompatibilityEngine';

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'Processor (CPU)',
  'cpu-cooler': 'CPU Cooler',
  motherboard: 'Motherboard',
  ram: 'Memory (RAM)',
  storage: 'Storage (SSD/HDD)',
  'graphics-card': 'Graphics Card (GPU)',
  'power-supply': 'Power Supply (PSU)',
  casing: 'PC Casing',
  monitor: 'Monitor',
  casing_cooler: 'Casing Cooler',
  keyboard: 'Keyboard',
  mouse: 'Mouse',
  speaker: 'Speaker',
  headphone: 'Headphone',
  wifi: 'Wi-Fi Adapter',
  ups: 'UPS',
};

function getReadableCategory(catId: string): string {
  if (CATEGORY_LABELS[catId]) return CATEGORY_LABELS[catId];
  const baseMatch = catId.match(/^(ram|storage)-(\d+)$/);
  if (baseMatch) {
    const typeLabel = baseMatch[1] === 'ram' ? 'Memory (RAM)' : 'Storage (SSD/HDD)';
    return `${typeLabel} #${baseMatch[2]}`;
  }
  return catId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export function exportBuildAsPNG(
  selectedComponents: Record<string, Product>,
  includeAssembly: boolean = false,
  targetBudget: number = 0
): void {
  const entries = Object.entries(selectedComponents).filter(([_, p]) => Boolean(p));
  if (entries.length === 0) return;

  const width = 1080;
  const rowHeight = 64;
  const headerHeight = 210;
  const footerHeight = 190;
  const totalRows = entries.length + (includeAssembly ? 1 : 0);
  const height = Math.max(850, headerHeight + totalRows * (rowHeight + 12) + footerHeight + 40);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background Gradient (Dark Cyber Slate)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e1b4b');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative glow circles
  const glow1 = ctx.createRadialGradient(width - 120, 100, 10, width - 120, 100, 320);
  glow1.addColorStop(0, 'rgba(139, 92, 246, 0.28)');
  glow1.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(120, height - 120, 10, 120, height - 120, 320);
  glow2.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
  glow2.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // 2. Header Section
  const padX = 56;
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillText('⚡ CLICK2IT SMART PC BUILDER', padX, 64);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px Inter, system-ui, sans-serif';
  ctx.fillText('Custom PC Build Specification', padX, 114);

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 18px Inter, system-ui, sans-serif';
  ctx.fillText(`Generated on ${dateStr} • click2itbd.com/pc-build`, padX, 148);

  // Stats Pills on Top Right (AI Score & Wattage)
  const aiScore = CompatibilityEngine.evaluateScore(selectedComponents);
  const wattage = CompatibilityEngine.calculateTotalTDP(selectedComponents);

  // Wattage Badge
  drawRoundedRect(ctx, width - padX - 310, 62, 145, 74, 18);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.fillText('EST. POWER', width - padX - 290, 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px Inter, system-ui, sans-serif';
  ctx.fillText(`${wattage}W`, width - padX - 290, 120);

  // AI Score Badge
  drawRoundedRect(ctx, width - padX - 150, 62, 150, 74, 18);
  ctx.fillStyle = 'rgba(109, 40, 217, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.fillText('AI RATING', width - padX - 130, 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px Inter, system-ui, sans-serif';
  ctx.fillText(`★ ${aiScore.score.toFixed(1)}/10`, width - padX - 130, 120);

  // Divider line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, 180);
  ctx.lineTo(width - padX, 180);
  ctx.stroke();

  // 3. Component Rows
  let currentY = 205;
  let totalPrice = 0;

  entries.forEach(([catId, product]) => {
    const qty = (product as any).builderQuantity || 1;
    const unitPrice = product.price || 0;
    const lineTotal = unitPrice * qty;
    totalPrice += lineTotal;

    drawRoundedRect(ctx, padX, currentY, width - padX * 2, rowHeight, 16);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Category pill
    const catLabel = getReadableCategory(catId).toUpperCase();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText(catLabel, padX + 22, currentY + 25);

    // Product name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    const nameWithQty = qty > 1 ? `${product.name}  [x${qty}]` : product.name;
    const truncatedName = truncateText(ctx, nameWithQty, width - padX * 2 - 240);
    ctx.fillText(truncatedName, padX + 22, currentY + 49);

    // Price on right
    const priceText = `৳${lineTotal.toLocaleString('en-IN')}`;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px Inter, system-ui, sans-serif';
    const priceWidth = ctx.measureText(priceText).width;
    ctx.fillText(priceText, width - padX - 22 - priceWidth, currentY + 40);

    if (qty > 1) {
      const subText = `(৳${unitPrice.toLocaleString('en-IN')} × ${qty})`;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      const subW = ctx.measureText(subText).width;
      ctx.fillText(subText, width - padX - 22 - subW, currentY + 56);
    }

    currentY += rowHeight + 12;
  });

  if (includeAssembly) {
    const assemblyFee = 1500;
    totalPrice += assemblyFee;

    drawRoundedRect(ctx, padX, currentY, width - padX * 2, rowHeight, 16);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText('SERVICE ADD-ON', padX + 22, currentY + 25);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillText('Professional PC Assembly, Cable Management & Stress Test', padX + 22, currentY + 49);

    const priceText = `৳${assemblyFee.toLocaleString('en-IN')}`;
    ctx.fillStyle = '#34d399';
    ctx.font = '900 20px Inter, system-ui, sans-serif';
    const priceWidth = ctx.measureText(priceText).width;
    ctx.fillText(priceText, width - padX - 22 - priceWidth, currentY + 40);

    currentY += rowHeight + 12;
  }

  // 4. Footer Summary Card
  currentY += 12;
  const footerBoxH = 115;
  const footerGrad = ctx.createLinearGradient(padX, currentY, width - padX, currentY + footerBoxH);
  footerGrad.addColorStop(0, '#4f46e5');
  footerGrad.addColorStop(1, '#7c3aed');

  drawRoundedRect(ctx, padX, currentY, width - padX * 2, footerBoxH, 24);
  ctx.fillStyle = footerGrad;
  ctx.fill();

  const compat = CompatibilityEngine.evaluate(selectedComponents);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText(
    compat.isCompatible ? '✓ COMPATIBILITY VERIFIED' : '⚠ CHECK COMPATIBILITY NOTES',
    padX + 28,
    currentY + 45
  );

  ctx.fillStyle = '#ffffff';
  ctx.font = '500 16px Inter, system-ui, sans-serif';
  const budgetNote =
    targetBudget > 0
      ? totalPrice <= targetBudget
        ? `Within Target Budget of ৳${targetBudget.toLocaleString('en-IN')}`
        : `Over Target Budget by ৳${(totalPrice - targetBudget).toLocaleString('en-IN')}`
      : `${entries.length} Components Selected • Ready to Build`;
  ctx.fillText(budgetNote, padX + 28, currentY + 76);

  // Total Price on right of footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  const totalLabel = 'TOTAL ESTIMATED PRICE';
  const totalLabelW = ctx.measureText(totalLabel).width;
  ctx.fillText(totalLabel, width - padX - 28 - totalLabelW, currentY + 40);

  const grandTotalText = `৳${totalPrice.toLocaleString('en-IN')}`;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 40px Inter, system-ui, sans-serif';
  const grandTotalW = ctx.measureText(grandTotalText).width;
  ctx.fillText(grandTotalText, width - padX - 28 - grandTotalW, currentY + 84);

  // Trigger download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `CLICK2IT-PC-Build-${Date.now().toString().slice(-6)}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
