export type NavItem = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

export const navItems: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "code", label: "Code", href: "/code" },
  { id: "notes", label: "Notes", href: "/notes" },
];

export const MAX_TABS = 4;

export function isActive(item: NavItem, currentPath?: string): boolean {
  if (!currentPath) return false;
  if (item.href === "/") return currentPath === "/";
  return currentPath === item.href || currentPath.startsWith(item.href + "/");
}
