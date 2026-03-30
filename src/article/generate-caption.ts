import type { CaptionProfile } from "../config/schema";

export interface GenerateCaptionInput {
  siteId?: string;
  profile: CaptionProfile;
  subject: string;
  rationale: string;
  sourceLabel: string;
  sourceUrl: string;
}

function shorten(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(" ").replace(/[.,;:!?-]+$/, "")}.`;
}

function buildLead(input: GenerateCaptionInput): string {
  return `${input.subject}.`;
}

export function generateCaption(input: GenerateCaptionInput): string {
  const sentence = shorten(buildLead(input), input.profile.maxWords);
  return `*${sentence} ${input.profile.sourcePrefix} [${input.sourceLabel}](${input.sourceUrl}).*`;
}
