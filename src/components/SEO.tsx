import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/seo-config";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noindex?: boolean;
  structuredData?: object | object[];
}

const SEO = ({
  title = "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ - Scheduling Made Simple",
  description = siteConfig.description,
  keywords = "scheduling app, appointment booking, calendar scheduling",
  canonical,
  ogImage = siteConfig.ogImages.home,
  ogType = "website",
  noindex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title.includes("Bᴏᴏᴋᴍᴇ.ʙᴇᴛ") ? title : `${title} | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ`;
  const canonicalUrl = canonical || (typeof window !== "undefined" ? window.location.href : siteConfig.url);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={siteConfig.author} />
      
      {/* Robots */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"} />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content={siteConfig.twitterHandle} />
      <meta name="twitter:creator" content={siteConfig.twitterHandle} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData])}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
