import * as LucideIcons from "lucide-react";
import { Link as LinkIcon } from "lucide-react";

export const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
  if (!name) {
    return <LinkIcon className={className} />;
  }
  // Convert standard names to Lucide component names (e.g., github -> Github)
  const formattedName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const IconComponent = (LucideIcons as any)[formattedName];

  if (!IconComponent) {
    return <LinkIcon className={className} />;
  }

  return <IconComponent className={className} />;
};
