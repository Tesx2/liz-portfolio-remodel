import { Project, Testimonial, ServiceItem } from '../types';

import heroShowreelImg from '../assets/images/liz_hero_showreel_poster_1792226915723.jpg';
import coffeeBrandImg from '../assets/images/safari_coffee_brand_1792226931020.jpg';
import kineticPosterImg from '../assets/images/kinetic_motion_poster_1792226932015.jpg';
import editorialPosterImg from '../assets/images/editorial_print_poster_1792226933988.jpg';
import lizPortraitImg from '../assets/images/liz_kendi_portrait_1792226932929.jpg';

export { lizPortraitImg, heroShowreelImg };

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-01-kahava',
    slug: 'kahava-nairobi-coffee-roastery',
    title: 'Kahava Nairobi — Single Origin Specialty Roastery',
    client: 'Kahava Coffee Co.',
    year: 2026,
    role: 'Brand Identity, Packaging Design & Motion Guidelines',
    category: 'branding',
    summary: 'A luxurious visual system and tactile packaging architecture celebrating Mount Kenya micro-lot harvests.',
    description: `Kahava Coffee Co. sought a modern brand identity that bridges rich Kenyan coffee heritage with avant-garde international specialty packaging. We designed an architectural monogram inspired by the twin peaks of Mount Kenya and geometric coffee blossom geometry. 

The color palette centers on deep imperial matte purple (#1c1221 and #8a307f) paired with hot-stamped gold foil typography. The packaging utilizes compostable kraft pouches with tactile matte soft-touch finish. 

Deliverables included identity guidelines, custom bespoke typography scales, product photography art direction, and a kinetic launch campaign for Nairobi and European export markets.`,
    status: 'published',
    featured: true,
    sortOrder: 1,
    coverAssetId: 'asset-kahava-01',
    assets: [
      {
        id: 'asset-kahava-01',
        type: 'image',
        key: 'media/kahava-nairobi-coffee-roastery/cover/original.jpg',
        url: coffeeBrandImg,
        thumbUrl: coffeeBrandImg,
        width: 1440,
        height: 1080,
        alt: 'Kahava Nairobi premium single-origin coffee packaging with embossed gold foil on deep matte violet bags',
        caption: 'Packaging suite for Nyeri Hill micro-lot whole bean release',
        sortOrder: 1,
      },
      {
        id: 'asset-kahava-02',
        type: 'image',
        key: 'media/kahava-nairobi-coffee-roastery/showcase/original.jpg',
        url: coffeeBrandImg,
        thumbUrl: coffeeBrandImg,
        width: 1440,
        height: 1080,
        alt: 'Close-up of Kahava brand typography and gold insignia',
        caption: 'Embossed insignia inspired by Mount Kenya altitude elevations',
        sortOrder: 2,
      }
    ],
    challenge: 'Reinvent the visual language of East African specialty coffee to compete globally against Nordic and Japanese roasters without losing authentic provenance.',
    solution: 'Engineered a minimalist, tactile identity pairing matte violet substrates with precise geometric sans and gold foil micro-lot elevation coordinates.',
    deliverables: ['Brand Identity System', 'Sustainable Packaging Architecture', 'Social Launch Kinetic Assets', 'Print Spec Book & Guidelines'],
    toolsUsed: ['Adobe Illustrator', 'Cinema 4D', 'Photoshop', 'Figma'],
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z',
  },
  {
    id: 'proj-02-kinetic',
    slug: 'kinetic-visual-arts-festival',
    title: 'Kinetic 2024 — Visual Arts Festival Motion Identity',
    client: 'Nairobi Contemporary Arts Hub',
    year: 2025,
    role: 'Creative Direction, 3D Motion Graphics & Spatial Visuals',
    category: 'motion',
    summary: 'A dynamic 3D kinetic typography system and stage visual engine for East Africa’s premier digital art summit.',
    description: `Kinetic 2024 brought together over 3,000 digital designers, animators, and spatial artists at City Design Hub Nairobi. As lead motion artist and visual identity designer, Liz Kendi formulated a fluid typography and chrome geometry language that reacts in real-time to bass frequencies.

The kinetic typography flows through dimensional portals, punctuated by Liz’s signature violet (#8a307f) and high-energy ultraviolet light trails. The campaign spanned outdoor LED billboards in Westlands, social countdown sequences, festival stage visuals, and dynamic conference pass credentials.`,
    status: 'published',
    featured: true,
    sortOrder: 2,
    coverAssetId: 'asset-kinetic-01',
    assets: [
      {
        id: 'asset-kinetic-01',
        type: 'image',
        key: 'media/kinetic-visual-arts-festival/poster/original.jpg',
        url: kineticPosterImg,
        thumbUrl: kineticPosterImg,
        width: 1080,
        height: 1440,
        alt: 'Kinetic Visual Arts Festival 2024 poster with liquid chrome typography on deep violet fractal background',
        caption: 'Official festival key art and large-format exhibition poster',
        sortOrder: 1,
      },
      {
        id: 'asset-kinetic-02',
        type: 'image',
        key: 'media/kinetic-visual-arts-festival/stage/original.jpg',
        url: heroShowreelImg,
        thumbUrl: heroShowreelImg,
        width: 1920,
        height: 1080,
        alt: 'Sculptural 3D fluid typography looping visuals for main festival stage backdrop',
        caption: 'Stage screen generative visual sequence',
        sortOrder: 2,
      }
    ],
    challenge: 'Create a versatile motion language capable of scaling from a 10-second smartphone story to a 40-meter curved LED festival backdrop.',
    solution: 'Constructed an Octane + After Effects procedural typography pipeline producing responsive render assets at multiple aspect ratios and frame rates.',
    deliverables: ['Key Art & Poster System', '3D Motion Billboard Renders', 'Mainstage Visual Loops', 'Interactive Screen Graphics'],
    toolsUsed: ['Cinema 4D', 'Octane Render', 'After Effects', 'Premiere Pro'],
    createdAt: '2025-09-14T08:00:00Z',
    updatedAt: '2025-10-22T19:00:00Z',
  },
  {
    id: 'proj-03-modernist',
    slug: 'modernist-archive-architectural-exhibition',
    title: 'Modernist Archive — Architectural Typography Exhibition',
    client: 'Zurich Gallery & Goethe-Institut',
    year: 2025,
    role: 'Editorial Graphic Design & Risograph Exhibition Prints',
    category: 'poster',
    summary: 'A curated Swiss-inspired editorial poster exploring post-colonial modernism and architectural grid systems.',
    description: `Commissioned as part of a bilateral architectural exhibition between Zurich and Nairobi, this series dissects the geometry of modernist tropical architecture. Using a disciplined grid system paired with deliberate structural tension, the print contrasts warm archival paper with intense pantone red (#e11d48) and deep royal purple ink.

Produced as limited-edition 3-color risograph prints and exhibited in Zurich and Nairobi, each print features hand-screened textural elements and strict typographic proportions adhering to international typographical standards.`,
    status: 'published',
    featured: true,
    sortOrder: 3,
    coverAssetId: 'asset-modernist-01',
    assets: [
      {
        id: 'asset-modernist-01',
        type: 'image',
        key: 'media/modernist-archive-architectural-exhibition/poster/original.jpg',
        url: editorialPosterImg,
        thumbUrl: editorialPosterImg,
        width: 1080,
        height: 1440,
        alt: 'Modernist Archive exhibition print with architectural grid lines, bold Swiss typography, and pantone red accents',
        caption: 'Archive Series 01: Form, Space & Rationalism — Risograph Print',
        sortOrder: 1,
      }
    ],
    challenge: 'Honor historical Bauhaus and Swiss modernist rigor while infusing warmth and textural soul from East African spatial narratives.',
    solution: 'Employed an asymmetric 12-column architectural wireframe layered with risograph grain, custom typographic ligatures, and dual-language curation notes.',
    deliverables: ['Limited Edition Screenprints', 'Exhibition Catalog Layout', 'Signage & Gallery Spatial Graphics'],
    toolsUsed: ['Adobe InDesign', 'Illustrator', 'Analog Risograph Print'],
    createdAt: '2025-06-04T10:00:00Z',
    updatedAt: '2025-07-18T16:00:00Z',
  },
  {
    id: 'proj-04-showreel',
    slug: 'fluid-energy-motion-reel',
    title: 'Fluid Energy — 3D Sculptural Motion Reel',
    client: 'Self-Initiated / Studio R&D',
    year: 2026,
    role: '3D Simulation, Art Direction, Sound Sync',
    category: 'motion',
    summary: 'Explorations in liquid chrome typography, elastic geometries, and sculptural light ribbons in zero gravity.',
    description: `An experimental laboratory piece testing the boundaries of typographic fluidity. The project investigates how rigid architectural letterforms deform and reassemble when subjected to fluid dynamics and gravitational forces.

Rendered in Octane with custom dispersion glass shaders, the motion reel has garnered critical acclaim on Behance and Instagram, leading to commercial commissions for international music festivals and digital luxury brands.`,
    status: 'published',
    featured: true,
    sortOrder: 4,
    coverAssetId: 'asset-reel-01',
    assets: [
      {
        id: 'asset-reel-01',
        type: 'image',
        key: 'media/fluid-energy-motion-reel/poster/original.jpg',
        url: heroShowreelImg,
        thumbUrl: heroShowreelImg,
        width: 1920,
        height: 1080,
        alt: 'Violet glowing sculptural 3D fluid typography looping in a dark cosmos',
        caption: 'Zero-G typographic fluidity render study',
        sortOrder: 1,
      }
    ],
    challenge: 'Simulate high-viscosity typographic deformation while preserving structural legibility and emotional impact.',
    solution: 'Authored custom procedural deformers and chromatic dispersion materials in Cinema 4D, mapped to experimental sub-bass frequency stems.',
    deliverables: ['60-second 4K Master Motion Reel', 'High-res Behance Case Study Stills', 'Social Micro-clips'],
    toolsUsed: ['Cinema 4D', 'Octane Render', 'After Effects'],
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-02-28T11:00:00Z',
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    quote: 'Liz transformed our brand presence with an identity and motion language that stunned our European retail partners. Her attention to typography and kinetic rhythm is unmatched.',
    clientName: 'Wambui Karanja',
    role: 'Founder & CEO',
    company: 'Kahava Specialty Roasters',
    project: 'Kahava Rebrand & Global Packaging',
    location: 'Nairobi & London'
  },
  {
    id: 'test-2',
    quote: 'The motion graphics Liz created for Kinetic 2024 became the defining aesthetic of the entire summit. Attendees stopped in their tracks in front of the Westlands billboard.',
    clientName: 'David Omondi',
    role: 'Creative Director',
    company: 'Nairobi Contemporary Arts Hub',
    project: 'Kinetic 2024 Stage & Visuals',
    location: 'Nairobi, Kenya'
  },
  {
    id: 'test-3',
    quote: 'Working with Liz is effortless. She understands brand strategy as deeply as she understands frame-by-frame 3D animation. The risograph exhibition prints sold out in three days.',
    clientName: 'Elena Meyer',
    role: 'Senior Curator',
    company: 'Zurich Modern Archive',
    project: 'Architectural Typographic Series',
    location: 'Zurich, Switzerland'
  }
];

export const SERVICES: ServiceItem[] = [
  {
    number: '01',
    title: '3D Motion Graphics & Showreels',
    category: 'Motion Design',
    description: 'Cinematic title sequences, fluid 3D typography, logo animations, and high-retention video showreels built with Cinema 4D, Octane, and After Effects.',
    deliverables: ['Broadcast & Social 4K Renders', 'Transparent Alpha Logo Resolves', 'Stage & Large-Format LED Visuals', 'Lottie / WebM Interactive Assets'],
    timeline: '2–4 Weeks'
  },
  {
    number: '02',
    title: 'Brand Identity & Visual Systems',
    category: 'Brand Architecture',
    description: 'Comprehensive brand marks, geometric typographic systems, color theory, luxury packaging, and digital style guides designed to scale across touchpoints.',
    deliverables: ['Primary & Secondary Brandmarks', 'Complete Typeface & Color Hierarchy', 'Vector Iconography & Patterns', 'Comprehensive Brand Guidelines PDF'],
    timeline: '3–6 Weeks'
  },
  {
    number: '03',
    title: 'Editorial & Poster Design',
    category: 'Print & Spatial',
    description: 'Award-winning large-format exhibition posters, book layouts, music festival key art, and risograph prints combining Swiss grid precision with expressive texture.',
    deliverables: ['Large-Format Print Press Files (CMYK/Pantone)', 'Screenprint / Risograph Layer Separations', 'Digital Billboard Adaptations', 'Exhibition Catalogs'],
    timeline: '1–3 Weeks'
  },
  {
    number: '04',
    title: 'Digital & Campaign Assets',
    category: 'Digital Strategy',
    description: 'Kinetic social media design systems, product launch collateral, interactive web campaign assets, and pitch deck visual overhauls.',
    deliverables: ['Motion Templates for Premiere & After Effects', 'Figma Design System Components', 'High-Converting Ad Sets', 'Micro-Interactions'],
    timeline: '1–2 Weeks'
  }
];
