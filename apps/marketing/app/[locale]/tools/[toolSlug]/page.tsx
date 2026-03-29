import { getToolBySlug, TOOLS } from "@tools/tools-config";
import { ToolPageClient } from "./client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ toolSlug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; toolSlug: string }>;
}): Promise<Metadata> {
  const { locale, toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);
  if (!tool) return {};

  const isEs = locale === "es";
  return {
    title: isEs ? tool.nameEs : tool.name,
    description: isEs ? tool.descriptionEs : tool.description,
    keywords: tool.seoKeywords,
  };
}

function buildJsonLd(tool: NonNullable<ReturnType<typeof getToolBySlug>>, locale: string) {
  const isEs = locale === "es";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: isEs ? tool.nameEs : tool.name,
    description: isEs ? tool.descriptionEs : tool.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Auditora.ai",
      url: "https://auditora.ai",
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; toolSlug: string }>;
}) {
  const { locale, toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);

  if (!tool) {
    notFound();
  }

  const jsonLd = buildJsonLd(tool, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolPageClient tool={tool} locale={locale} />
    </>
  );
}
