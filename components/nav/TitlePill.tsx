import type { FC } from "hono/jsx";
import type { Profile } from "../../data/types.ts";

type Props = {
  profile: Profile;
  currentPath?: string;
  pageSubtitle?: string;
};

const DEFAULT_SUBTITLE = "Engineering with Purpose, Creativity & a Lot of Fun";

export const TitlePill: FC<Props> = ({ profile, currentPath, pageSubtitle }) => {
  const subtitle = pageSubtitle || DEFAULT_SUBTITLE;
  const inner = (
    <>
      <span class="title-pill-name">{profile.name}</span>
      <span class="title-pill-sep" aria-hidden="true">·</span>
      <span class="title-pill-subtitle">{subtitle}</span>
    </>
  );

  if (currentPath === "/") {
    return <div class="title-pill">{inner}</div>;
  }
  return (
    <a class="title-pill" href="/" aria-label={`${profile.name} — home`}>
      {inner}
    </a>
  );
};
