import { IdeaPageClient, type Idea } from "./IdeaPageClient";
import { notFound } from "next/navigation";

export type RawIdea = Idea & {
  description_more?: string | string[];
  img_src?: string;
  imgs_src?: string[];
  creator_address?: string;
  creator_idea?: string;
};

async function fetchIdeaById(id: string): Promise<Idea | null> {
  try {
    const response = await fetch(`/api/v1/ideas/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const idea = (payload?.idea ?? payload) as RawIdea | undefined;

    if (!idea) {
      return null;
    }

    const normalized: Idea = {
      ...idea,
      descriptionMore: idea.descriptionMore ?? idea.description_more,
      imgSrc: idea.imgSrc ?? idea.img_src,
      imgsSrc: idea.imgsSrc ?? idea.imgs_src,
      creatorAddress: idea.creatorAddress ?? idea.creator_address,
      creatorIdea: idea.creatorIdea ?? idea.creator_idea,
      idea_cid: idea.idea_cid,
    };

    return normalized;
  } catch (error) {
    console.error("Failed to fetch idea", error);
    return null;
  }
}

export default async function IdeaPage({
  params,
}: {
  params: { id: string };
}) {
  const idea = await fetchIdeaById(params.id);

  if (!idea) {
    notFound();
  }

  return <IdeaPageClient idea={idea} />;
}
