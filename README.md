# cables.guide

A comprehensive database of cable and connector specifications. Demystifying USB-C, Thunderbolt, HDMI, and other connectors where the same physical shape can mean wildly different capabilities.

## The Problem

USB-C is a nightmare. The same physical connector can be:
- USB 2.0 (480 Mbps) or USB4 (40 Gbps)
- 5W charging or 240W Power Delivery
- Video-capable (DisplayPort/HDMI Alt Mode) or data-only
- Thunderbolt 3/4 or just USB
- And the cable looks identical in all cases

This site exists to help people understand what their cables and ports actually support.

## Tech Stack

- **Astro 5** - Static site generation
- **Tailwind CSS 4** - Styling via Vite plugin
- **TypeScript** - Type-safe data handling
- **JSON** - Version-controlled data files
- **Netlify** - Hosting

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # Production build
npm run preview  # Preview production build
```

## Data Structure

```
/data/
├── usb/        # USB-A, USB-B, USB-C, Mini, Micro
├── video/      # HDMI, DisplayPort, DVI, VGA
├── audio/      # 3.5mm, 6.35mm, XLR, RCA, optical
├── power/      # Barrel jacks, IEC, NEMA
└── legacy/     # Serial, parallel, PS/2, FireWire
```

Each connector entry includes:
- Protocol variants with data rates, power delivery, features
- Connector dimensions and pin counts
- Electrical specifications
- Compatibility and adapter options
- **Confusion points** - what's confusing about this connector
- Buying guide

## Contributing

Add new connectors by creating JSON files following the schema in `src/utils/cableData.ts`. Key requirements:

1. Use authoritative sources (USB-IF, HDMI Forum, manufacturer specs)
2. Include all protocol variants
3. Document confusion points explicitly
4. Note cable certification requirements

## License

[MIT](LICENSE)
