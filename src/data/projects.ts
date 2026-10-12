// =============================================================================
// ASSET MANIFEST — Aurea Biazon Portfolio
// =============================================================================
// Every temporary stock asset is catalogued here so you can replace any image
// or video with Aurea's approved media without touching component layout.
//
// 👉 TO REPLACE AN ASSET: Change the `image` or `video` URL and update
//    `poster`, `alt`, `isPlaceholder`, and `source` fields accordingly.
// =============================================================================

export interface ProjectAsset {
  id: string;
  section: "work" | "about" | "contact";
  title: string;
  category: string;
  description: string;
  image: string;
  video?: string;
  poster?: string;
  alt: string;
  isPlaceholder: boolean;
  source: string;
  license: string;
}

export interface WorkProject {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  image: string;
  video?: string;
  poster?: string;
  alt: string;
  isPlaceholder: boolean;
  source: string;
}

// =============================================================================
// SELECTED WORK — 6 Curated Projects
// =============================================================================
// These are temporary concept titles and descriptions, NOT actual Aurea project
// credits. Keep them editable and do not imply they represent completed client
// campaigns.
// =============================================================================
export const workProjects: WorkProject[] = [
  {
    id: "work-01",
    number: "01",
    title: "The Beauty Ritual",
    category: "Beauty & Self-Care",
    description:
      "A closer look at the little rituals that make everyday moments feel special.",
    image:
      "https://images.pexels.com/photos/3762466/pexels-photo-3762466.jpeg?auto=compress&cs=tinysrgb&w=800",
    video: "/ringview/1.mp4",
    poster: "/ringview/1-poster.jpg",
    alt: "Woman applying skincare in natural light",
    isPlaceholder: true,
    source: "Pexels / Andrea Piacquadio",
  },
  {
    id: "work-02",
    number: "02",
    title: "Details That Matter",
    category: "Skincare & Product",
    description:
      "Texture, light, and thoughtful product storytelling, captured up close.",
    image:
      "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=800",
    video: "/ringview/3.mp4",
    poster: "/ringview/3-poster.jpg",
    alt: "Skincare products arranged with warm lighting",
    isPlaceholder: true,
    source: "Pexels / Karolina Kaboompics",
  },
  {
    id: "work-03",
    number: "03",
    title: "A Taste of Something Good",
    category: "Food & Beverage",
    description:
      "The colors, textures, and moments that make food impossible to scroll past.",
    image:
      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800",
    video: "/ringview/5.mp4",
    poster: "/ringview/5-poster.jpg",
    alt: "Artisan coffee preparation with latte art",
    isPlaceholder: true,
    source: "Pexels / Chevanon Photography",
  },
  {
    id: "work-04",
    number: "04",
    title: "The Everyday Edit",
    category: "Lifestyle",
    description:
      "Relatable lifestyle moments with an effortless, personal feel.",
    image:
      "https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=800",
    video: "/ringview/7.mp4",
    poster: "/ringview/7-poster.jpg",
    alt: "Woman in warm interior enjoying everyday routine",
    isPlaceholder: true,
    source: "Pexels / Andrea Piacquadio",
  },
  {
    id: "work-05",
    number: "05",
    title: "Naturally You",
    category: "Beauty · Lifestyle",
    description:
      "Authentic beauty storytelling with personality at the center.",
    image:
      "https://images.pexels.com/photos/3373716/pexels-photo-3373716.jpeg?auto=compress&cs=tinysrgb&w=800",
    video: "/ringview/1.mp4",
    poster: "/ringview/1-poster.jpg",
    alt: "Creator demonstrating beauty product application",
    isPlaceholder: true,
    source: "Pexels / Cottonbro Studio",
  },
  {
    id: "work-06",
    number: "06",
    title: "The Still Collection",
    category: "Photography",
    description:
      "Thoughtfully composed imagery where light, texture, and detail tell the story.",
    image:
      "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Editorial still-life with skincare products and botanicals",
    isPlaceholder: true,
    source: "Pexels / Monstera Production",
  },
];

// =============================================================================
// ABOUT SECTION — Editorial Portrait Assets
// =============================================================================
export const aboutAssets = {
  primary: {
    image:
      "https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Editorial portrait of a creative professional in natural light",
    isPlaceholder: true,
    source: "Pexels / Andrea Piacquadio",
  },
  secondary: {
    image:
      "https://images.pexels.com/photos/3584996/pexels-photo-3584996.jpeg?auto=compress&cs=tinysrgb&w=600",
    alt: "Creative workspace with camera and styling tools",
    isPlaceholder: true,
    source: "Pexels / George Milton",
  },
};

// =============================================================================
// SERVICES DATA
// =============================================================================
export const services = [
  {
    id: "svc-01",
    number: "01",
    title: "UGC Video Creation",
    description:
      "Natural, engaging short-form videos designed to showcase products and experiences through authentic storytelling.",
    formats: [
      "Product demonstrations",
      "Beauty and self-care routines",
      "Lifestyle content",
      "Food and beverage content",
      "Short-form social videos",
    ],
  },
  {
    id: "svc-02",
    number: "02",
    title: "Product & Lifestyle Photography",
    description:
      "Thoughtfully composed imagery that brings attention to the textures, details, and personality of a product or experience.",
    formats: [
      "Product photography",
      "Lifestyle imagery",
      "Beauty and self-care photography",
      "Food photography",
    ],
  },
  {
    id: "svc-03",
    number: "03",
    title: "Creative Content Packages",
    description:
      "A considered mix of visual assets for brands looking to tell a more complete story across their digital presence.",
    formats: [
      "Short-form videos",
      "Product photographs",
      "Multiple creative concepts",
    ],
  },
];
