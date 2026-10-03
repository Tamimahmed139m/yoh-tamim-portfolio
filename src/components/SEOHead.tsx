import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  ogType?: string;
  schemaData?: Record<string, unknown>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  ogType = 'website',
  schemaData,
}) => {
  useEffect(() => {
    // Dynamic Page Title
    const fullTitle = `${title} | NovaArcade`;
    document.title = fullTitle;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // OpenGraph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    let ogTypeMeta = document.querySelector('meta[property="og:type"]');
    if (ogTypeMeta) ogTypeMeta.setAttribute('content', ogType);

    // Schema.org JSON-LD
    let scriptTag = document.querySelector('#seo-json-ld');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('id', 'seo-json-ld');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'NovaArcade',
      applicationCategory: 'GameApplication',
      operatingSystem: 'All',
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };

    scriptTag.textContent = JSON.stringify(schemaData || defaultSchema);
  }, [title, description, ogType, schemaData]);

  return null;
};
