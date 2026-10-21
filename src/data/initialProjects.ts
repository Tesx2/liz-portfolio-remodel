import { Testimonial, ServiceItem, AboutContent } from '../types';

import heroShowreelImg from '../assets/images/liz_hero_showreel_poster_1792226915723.jpg';
import lizPortraitImg from '../assets/images/liz_kendi_portrait_1792226932929.jpg';

export { lizPortraitImg, heroShowreelImg };

export const INITIAL_ABOUT: AboutContent = {
  title: 'About me',
  roleTitle: 'Graphic designer and animator',
  location: 'Nairobi, KE',
  bioParagraphs: [
    'I am a graphic designer and animator based in Nairobi, Kenya, with 2 years of experience.',
    'I hold a Diploma in Animation and Graphic Design from Kenya Institute of Mass Communication (2021 to 2024), and completed a graphic design internship at Kenneth Lamu Marketing Communication from May to July 2023.',
    'I speak English and Kiswahili. When I am not animating or designing, I enjoy drawing, singing, travelling, and reading novels.',
  ],
  cvDownloadUrl: '/liz-kendi-cv.pdf',
  tools: [
    { name: 'Adobe After Effects', category: 'Animation & Motion' },
    { name: 'Adobe Photoshop', category: 'Design & Texturing' },
    { name: 'Adobe Illustrator', category: 'Vector & Identity' },
    { name: 'Premiere Pro', category: 'Video Editing' },
    { name: 'Adobe Animate', category: '2D Animation' },
    { name: 'Maya', category: '3D Animation' },
    { name: '3ds Max', category: '3D Modeling' },
  ],
  milestones: [
    { year: '2021 – 2024', title: 'Diploma in Animation and Graphic Design', place: 'Kenya Institute of Mass Communication' },
    { year: 'May – Jul 2023', title: 'Graphic Design Internship', place: 'Kenneth Lamu Marketing Communication' },
  ],
};

// TODO: Confirm testimonials with Liz before publishing live
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    quote: 'Liz transformed our brand presence with an identity and motion language that stunned our retail partners. Her attention to typography and rhythm is unmatched.',
    clientName: 'Wambui Karanja',
    role: 'Founder',
    company: 'Kahava Specialty Roasters',
    project: 'Kahava Rebrand',
    location: 'Nairobi'
  },
  {
    id: 'test-2',
    quote: 'The motion graphics Liz created for Kinetic 2024 became the defining aesthetic of the entire summit.',
    clientName: 'David Omondi',
    role: 'Creative Director',
    company: 'Nairobi Contemporary Arts Hub',
    project: 'Kinetic 2024 Visuals',
    location: 'Nairobi, Kenya'
  },
  {
    id: 'test-3',
    quote: 'Working with Liz is effortless. She understands brand design as deeply as she understands 3D animation.',
    clientName: 'Elena Meyer',
    role: 'Curator',
    company: 'Modern Archive',
    project: 'Typographic Series',
    location: 'Nairobi'
  }
];

export const SERVICES: ServiceItem[] = [
  {
    number: '01',
    title: 'Brand identity',
    category: 'Branding',
    description: 'Logos, color palettes, and visual systems designed to represent your business clearly across all media.',
    deliverables: ['Logo suites', 'Typography & color guides', 'Brand guidelines'],
    timeline: '2–4 Weeks'
  },
  {
    number: '02',
    title: 'Illustration',
    category: 'Art',
    description: 'Custom vector artwork, digital illustrations, and creative assets for print and digital use.',
    deliverables: ['Vector illustrations', 'Editorial artwork', 'Digital assets'],
    timeline: '1–2 Weeks'
  },
  {
    number: '03',
    title: '2D/3D animation',
    category: 'Motion',
    description: 'Animated graphics, promotional videos, and 3D scenes created in After Effects, Maya, and 3ds Max.',
    deliverables: ['Motion graphics', '2D/3D animations', 'Video sequences'],
    timeline: '2–4 Weeks'
  }
];
