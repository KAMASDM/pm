const defaultCategories = [
  // Development Categories
  {
    name: "Planning & Analysis",
    color: "#2196F3",
    description: "Project planning and requirements analysis",
    subcategories: [
      {
        name: "Requirements Gathering",
      },
      {
        name: "Project Planning",
      },
      {
        name: "Market Research",
      },
    ],
  },
  {
    name: "Design & Architecture",
    color: "#2196F3",
    description: "System design and user experience planning",
    subcategories: [
      {
        name: "System Design",
      },
      {
        name: "UI/UX Design",
      },
      {
        name: "Brand Design",
      },
    ],
  },
  {
    name: "Development",
    color: "#2196F3",
    description: "Software development and implementation",
    subcategories: [
      {
        name: "Frontend Development",
      },
      {
        name: "Backend Development",
      },
      {
        name: "API Integration",
      },
    ],
  },
  {
    name: "Testing & Quality Assurance",
    color: "#2196F3",
    description: "Quality assurance and testing processes",
    subcategories: [
      {
        name: "Testing",
      },
      {
        name: "Quality Assurance",
      },
      {
        name: "User Testing",
      },
    ],
  },
  {
    name: "Deployment & Maintenance",
    color: "#2196F3",
    description: "Deployment, monitoring, and ongoing maintenance",
    subcategories: [
      {
        name: "Deployment",
      },
      {
        name: "Maintenance",
      },
      {
        name: "Performance Monitoring",
      },
    ],
  },

  // SEO & Digital Marketing Categories
  {
    name: "SEO (Search Engine Optimization)",
    color: "#4CAF50",
    description: "Optimize website visibility and search engine rankings",
    subcategories: [
      {
        name: "Technical SEO",
      },
      {
        name: "On-Page SEO",
      },
      {
        name: "Off-Page SEO & Link Building",
      },
      {
        name: "Local SEO",
      },
      {
        name: "Keyword Research",
      },
    ],
  },
  {
    name: "Content Marketing",
    color: "#FF9800",
    description: "Create and distribute valuable content to attract audience",
    subcategories: [
      {
        name: "Blog Content",
      },
      {
        name: "Video Content",
      },
      {
        name: "Infographics & Visual Content",
      },
      {
        name: "Content Strategy",
      },
      {
        name: "Content Optimization",
      },
    ],
  },
  {
    name: "Social Media Marketing",
    color: "#E91E63",
    description: "Build and engage audience on social media platforms",
    subcategories: [
      {
        name: "Facebook Marketing",
      },
      {
        name: "Instagram Marketing",
      },
      {
        name: "LinkedIn Marketing",
      },
      {
        name: "Twitter/X Marketing",
      },
      {
        name: "TikTok Marketing",
      },
      {
        name: "Pinterest Marketing",
      },
      {
        name: "YouTube Marketing",
      },
      {
        name: "Community Management",
      },
    ],
  },
  {
    name: "Paid Advertising (PPC)",
    color: "#9C27B0",
    description: "Manage paid advertising campaigns across platforms",
    subcategories: [
      {
        name: "Google Ads",
      },
      {
        name: "Facebook Ads",
      },
      {
        name: "Instagram Ads",
      },
      {
        name: "LinkedIn Ads",
      },
      {
        name: "Display Advertising",
      },
      {
        name: "Retargeting Campaigns",
      },
    ],
  },
  {
    name: "Email Marketing",
    color: "#00BCD4",
    description: "Create and manage email marketing campaigns",
    subcategories: [
      {
        name: "Email Campaign Design",
      },
      {
        name: "List Building & Segmentation",
      },
      {
        name: "Newsletter Creation",
      },
      {
        name: "Drip Campaigns",
      },
      {
        name: "Email Automation",
      },
    ],
  },
  {
    name: "Analytics & Reporting",
    color: "#FF5722",
    description: "Track, measure, and report on marketing performance",
    subcategories: [
      {
        name: "Google Analytics Setup",
      },
      {
        name: "Social Media Analytics",
      },
      {
        name: "SEO Performance Tracking",
      },
      {
        name: "Campaign ROI Analysis",
      },
      {
        name: "Monthly Reporting",
      },
      {
        name: "A/B Testing",
      },
    ],
  },
  {
    name: "Influencer & Affiliate Marketing",
    color: "#FFC107",
    description: "Partner with influencers and affiliates for promotion",
    subcategories: [
      {
        name: "Influencer Outreach",
      },
      {
        name: "Partnership Management",
      },
      {
        name: "Affiliate Program Setup",
      },
      {
        name: "Campaign Collaboration",
      },
    ],
  },
  {
    name: "Conversion Optimization (CRO)",
    color: "#795548",
    description: "Optimize website and campaigns for better conversions",
    subcategories: [
      {
        name: "Landing Page Optimization",
      },
      {
        name: "A/B Testing",
      },
      {
        name: "User Experience Optimization",
      },
      {
        name: "Conversion Funnel Analysis",
      },
    ],
  },
  {
    name: "Brand Management",
    color: "#607D8B",
    description: "Build and maintain brand identity and reputation",
    subcategories: [
      {
        name: "Brand Strategy",
      },
      {
        name: "Reputation Management",
      },
      {
        name: "Brand Guidelines",
      },
      {
        name: "Crisis Management",
      },
    ],
  },
];

export default defaultCategories;