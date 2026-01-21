import fs from 'fs';
import path from 'path';

export interface ProtocolSpec {
  version: string;
  data_rate: string;
  data_rate_mbps: number; // For search/filtering
  power_delivery?: string;
  video_support?: string[];
  features: string[];
  cable_requirements?: string;
  max_length?: string;
}

export interface ConnectorSpec {
  pins: number;
  rows?: number;
  pitch?: number; // mm
  width: number;
  height: number;
  depth?: number;
  reversible: boolean;
  shape: string; // "rectangular", "circular", "trapezoidal"
  unit: string;
}

export interface ElectricalSpec {
  voltage_max?: number;
  current_max?: number;
  power_max?: number; // Watts
  impedance?: string;
}

export interface CompatibilitySpec {
  backwards: string[];
  forwards: string[];
  adapters_to: string[];
  adapters_from: string[];
}

export interface Source {
  name: string;
  url?: string;
  access_date?: string;
  notes?: string;
}

export interface CableSpec {
  type: string;
  full_name: string;
  standard_body: string;
  common_names: string[];
  protocols: Record<string, ProtocolSpec>;
  connector: ConnectorSpec;
  electrical: ElectricalSpec;
  compatibility: CompatibilitySpec;
  common_devices: string[];
  confusion_points: string[];
  buying_guide: string;
  notes: string;
  sources?: Source[];
  last_updated: string;
}

export interface CableCategory {
  name: string;
  slug: string;
  description: string;
  cables: CableSpec[];
}

const DATA_DIR = path.join(process.cwd(), 'data');

export function loadCableData(category: string, type: string): CableSpec | null {
  try {
    const filePath = path.join(DATA_DIR, category, `${type}.json`);
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(`Error loading cable data for ${category}/${type}:`, error);
    return null;
  }
}

export function loadCategoryData(category: string): CableSpec[] {
  try {
    const categoryDir = path.join(DATA_DIR, category);
    const files = fs.readdirSync(categoryDir).filter(file => file.endsWith('.json'));

    return files.map(file => {
      const filePath = path.join(categoryDir, file);
      const jsonData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(jsonData);
    }).sort((a, b) => a.type.localeCompare(b.type));
  } catch (error) {
    console.error(`Error loading category data for ${category}:`, error);
    return [];
  }
}

export function getAllCategories(): CableCategory[] {
  const categories = [
    {
      name: 'USB',
      slug: 'usb',
      description: 'USB-A, USB-B, USB-C, Mini, and Micro variants. The most confusing connector family.'
    },
    {
      name: 'Video',
      slug: 'video',
      description: 'HDMI, DisplayPort, DVI, VGA, and Thunderbolt video connections.'
    },
    {
      name: 'Audio',
      slug: 'audio',
      description: '3.5mm, 6.35mm, XLR, RCA, and optical audio connectors.'
    },
    {
      name: 'Power',
      slug: 'power',
      description: 'Barrel jacks, IEC, NEMA, and regional power plugs.'
    }
  ];

  return categories.map(category => ({
    ...category,
    cables: loadCategoryData(category.slug)
  }));
}

export function getMaxDataRate(cable: CableSpec): number {
  const rates = Object.values(cable.protocols).map(p => p.data_rate_mbps);
  return Math.max(...rates, 0);
}

export function getMaxPower(cable: CableSpec): number | undefined {
  return cable.electrical.power_max;
}

export function getCableBySlug(slug: string): { cable: CableSpec; category: string } | null {
  const allCategories = getAllCategories();
  for (const cat of allCategories) {
    for (const cable of cat.cables) {
      const cableSlug = cable.type.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (cableSlug === slug) {
        return { cable, category: cat.slug };
      }
    }
  }
  return null;
}

export function getNormalizedPowerWatts(cable: CableSpec): number | null {
  // First check electrical.power_max
  if (cable.electrical.power_max) {
    return cable.electrical.power_max;
  }

  // Parse power from protocol power_delivery strings
  let maxPower = 0;
  for (const protocol of Object.values(cable.protocols)) {
    if (protocol.power_delivery) {
      // Match patterns like "240W", "100W", "(4000W max)", "(625W max)"
      const wattMatch = protocol.power_delivery.match(/(\d+)\s*W/i);
      if (wattMatch) {
        const watts = parseInt(wattMatch[1], 10);
        if (watts > maxPower) maxPower = watts;
      }
    }
  }

  return maxPower > 0 ? maxPower : null;
}

export function getVideoCapabilities(cable: CableSpec): string[] {
  const capabilities = new Set<string>();

  for (const protocol of Object.values(cable.protocols)) {
    if (protocol.video_support) {
      for (const video of protocol.video_support) {
        capabilities.add(video);
      }
    }
    // Check features for video-related entries
    for (const feature of protocol.features) {
      if (feature.toLowerCase().includes('displayport') ||
          feature.toLowerCase().includes('hdmi') ||
          feature.toLowerCase().includes('4k') ||
          feature.toLowerCase().includes('8k')) {
        capabilities.add(feature);
      }
    }
  }

  return Array.from(capabilities);
}

export function hasVideoSupport(cable: CableSpec): boolean {
  return getVideoCapabilities(cable).length > 0;
}

export function searchCables(query: string): CableSpec[] {
  const allCategories = getAllCategories();
  const allCables = allCategories.flatMap(cat => cat.cables);

  const searchTerm = query.toLowerCase();

  // Check for data rate pattern (e.g., "40 Gbps", "480 Mbps", "10Gbps")
  const dataRateMatch = query.match(/(\d+\.?\d*)\s*(gbps|mbps|gb\/s|mb\/s)/i);
  let targetRateMbps: number | null = null;
  if (dataRateMatch) {
    const value = parseFloat(dataRateMatch[1]);
    const unit = dataRateMatch[2].toLowerCase();
    targetRateMbps = unit.startsWith('g') ? value * 1000 : value;
  }

  // Check for power pattern (e.g., "100W", "240 W")
  const powerMatch = query.match(/(\d+\.?\d*)\s*w/i);
  const targetPower = powerMatch ? parseFloat(powerMatch[1]) : null;

  return allCables.filter(cable => {
    // Standard text matching
    const textMatch = (
      cable.type.toLowerCase().includes(searchTerm) ||
      cable.full_name.toLowerCase().includes(searchTerm) ||
      cable.common_names.some(name => name.toLowerCase().includes(searchTerm)) ||
      cable.common_devices.some(device => device.toLowerCase().includes(searchTerm)) ||
      Object.keys(cable.protocols).some(proto => proto.toLowerCase().includes(searchTerm)) ||
      Object.values(cable.protocols).some(spec =>
        spec.version.toLowerCase().includes(searchTerm) ||
        spec.features.some(f => f.toLowerCase().includes(searchTerm))
      )
    );

    // Data rate matching
    const rateMatch = targetRateMbps ? Object.values(cable.protocols).some(proto =>
      proto.data_rate_mbps >= targetRateMbps!
    ) : false;

    // Power matching
    const powerMatchResult = targetPower ? (
      cable.electrical.power_max && cable.electrical.power_max >= targetPower
    ) : false;

    return textMatch || rateMatch || powerMatchResult;
  });
}
