import {
  type Icon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { type Theme, useTheme } from "@/components/theme/provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const themes: { name: Theme; icon: Icon }[] = [
    {
      name: "light",
      icon: SunIcon,
    },
    {
      name: "dark",
      icon: MoonIcon,
    },
    {
      name: "system",
      icon: MonitorIcon,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon" variant="ghost">
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {themes.map(({ name, icon: Icon }) => (
          <DropdownMenuItem
            className={theme === name ? "bg-primary/20" : ""}
            key={name}
            onClick={() => setTheme(name)}
          >
            <Icon />
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
