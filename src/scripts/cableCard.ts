export interface ClientCable {
  type: string;
  full_name: string;
  categorySlug: string;
  categoryName: string;
  max_rate_mbps: number;
  max_power: number | null;
  pins: number;
  width: number;
  height: number;
  reversible: boolean;
  common_devices: string[];
  confusion_points: string[];
  notes: string;
}

export function formatDataRate(mbps: number): string {
  if (mbps >= 1000) {
    return `${mbps / 1000} Gbps`;
  }
  return `${mbps} Mbps`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightText(text: string, term?: string): string {
  if (!term || !text) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark class="bg-warning/30 text-foreground rounded px-0.5">$1</mark>');
}

function isLegacy(cable: ClientCable): boolean {
  const notesLower = cable.notes?.toLowerCase() || '';
  return (
    notesLower.includes('obsolete') ||
    notesLower.includes('legacy') ||
    notesLower.includes('phased out') ||
    cable.confusion_points.some(
      (p) =>
        p.toLowerCase().includes('obsolete') ||
        p.toLowerCase().includes('deprecated')
    )
  );
}

export interface CreateCardOptions {
  highlightTerm?: string;
}

export function createCableCard(
  cable: ClientCable,
  options?: CreateCardOptions
): string {
  const term = options?.highlightTerm;
  const legacy = isLegacy(cable);

  // Badges
  const badges: string[] = [];
  badges.push(`<span class="badge badge-muted">${escapeHtml(cable.categoryName)}</span>`);
  if (cable.reversible) {
    badges.push(`<span class="badge badge-reversible">Reversible</span>`);
  }
  if (legacy) {
    badges.push(`<span class="badge badge-muted">Legacy</span>`);
  }

  // Common uses tags
  let commonUsesHtml = '';
  if (cable.common_devices && cable.common_devices.length > 0) {
    const tags = cable.common_devices
      .slice(0, 3)
      .map((device) => `<span class="tag text-xs">${escapeHtml(device)}</span>`)
      .join('');
    const overflow =
      cable.common_devices.length > 3
        ? `<span class="tag-muted text-xs">+${cable.common_devices.length - 3} more</span>`
        : '';
    commonUsesHtml = `
      <div class="mb-4">
        <p class="text-xs mb-2">Common Uses</p>
        <div class="flex flex-wrap gap-1">
          ${tags}
          ${overflow}
        </div>
      </div>
    `;
  }

  // Confusion warning
  const confusionWarning =
    cable.confusion_points.length > 0
      ? `<div class="mb-4 alert-warning">
           <p class="text-warning-foreground text-sm">${escapeHtml(cable.confusion_points[0])}</p>
         </div>`
      : '';

  // Power section
  const powerHtml = cable.max_power
    ? `<div>
         <p class="text-xs mb-1">Max Power</p>
         <p class="text-foreground font-medium">${cable.max_power}W</p>
       </div>`
    : '';

  return `
    <div class="group relative card-interactive">
      <a href="/${cable.categorySlug}/${cable.type.toLowerCase().replace(/[^a-z0-9]/g, '-')}" class="block p-6" aria-label="View detailed specifications for ${escapeHtml(cable.type)}">
        <!-- Badges -->
        <div class="absolute top-4 right-4 flex gap-2">
          ${badges.join('\n          ')}
        </div>

        <!-- Header -->
        <div class="mt-6 mb-4">
          <h3 class="text-xl font-semibold text-foreground mb-1">${highlightText(cable.type, term)}</h3>
          <p class="text-sm">${highlightText(cable.full_name, term)}</p>
        </div>

        <!-- Specs Grid -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-xs mb-1">Max Speed</p>
            <p class="text-foreground font-medium">${formatDataRate(cable.max_rate_mbps)}</p>
          </div>
          ${powerHtml}
        </div>

        <!-- Connector Info -->
        <div class="mb-4">
          <p class="text-xs mb-1">Connector</p>
          <p class="text-foreground text-sm">
            ${cable.pins} pins, ${cable.width}×${cable.height}mm
          </p>
        </div>

        <!-- Common Uses -->
        ${commonUsesHtml}

        <!-- Warning -->
        ${confusionWarning}

        <!-- Footer -->
        <div class="flex items-center gap-1 text-sm">
          <span class="group-hover:underline">Learn more</span>
          <span class="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </a>
    </div>
  `;
}
