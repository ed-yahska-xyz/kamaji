import type { FC } from "hono/jsx";
import type { Profile } from "../../data/types.ts";
import { TitlePill } from "./TitlePill.tsx";
import { FloatingHamburger } from "./FloatingHamburger.tsx";
import { NavMenu } from "./NavMenu.tsx";
import { TabBar } from "./TabBar.tsx";
import { BottomSheet } from "./BottomSheet.tsx";
import { navItems, MAX_TABS } from "../../data/nav.ts";

type Props = {
  profile: Profile;
  currentPath?: string;
  pageSubtitle?: string;
};

export const Navigation: FC<Props> = ({ profile, currentPath, pageSubtitle }) => {
  const hasMoreSheet = navItems.length > MAX_TABS;
  return (
    <>
      <TitlePill profile={profile} currentPath={currentPath} pageSubtitle={pageSubtitle} />
      <FloatingHamburger />
      <NavMenu currentPath={currentPath} />
      <TabBar currentPath={currentPath} />
      {hasMoreSheet && <BottomSheet currentPath={currentPath} />}
    </>
  );
};
