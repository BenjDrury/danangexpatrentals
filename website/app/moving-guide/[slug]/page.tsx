import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GUIDE_ARTICLES,
  getAllGuideSlugs,
  getGuideArticle,
} from "@/app/lib/living-guide";
import { getAreas } from "@/lib/data";
import { GuideArticleContent } from "../GuideArticleContent";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideArticle(slug);
  if (!article) return { title: "Guide not found" };
  return {
    title: `${article.title} | Da Nang Expat Rentals`,
    description: article.description,
  };
}

export default async function LivingGuideArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getGuideArticle(slug);
  if (!article) notFound();

  const related = GUIDE_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 4);
  const platformAreas =
    slug === "neighbourhoods"
      ? (await getAreas()).map((a) => ({
          id: a.id,
          name: a.name,
          vibe: a.vibe,
        }))
      : undefined;

  return (
    <div className="min-h-screen bg-foam">
      <GuideArticleContent
        article={article}
        related={related}
        platformAreas={platformAreas}
      />
    </div>
  );
}
