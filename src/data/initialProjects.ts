import { Testimonial, ServiceItem } from '../types';

import heroShowreelImg from '../assets/images/liz_hero_showreel_poster_1792226915723.jpg';
import lizPortraitImg from '../assets/images/liz_kendi_portrait_1792226932929.jpg';

export { lizPortraitImg, heroShowreelImg };

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
