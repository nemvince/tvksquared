import { GithubLogoIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/client/components/ui/button";
import { Separator } from "@/client/components/ui/separator";

export const Footer = () => {
  return (
    <footer className="flex items-center space-x-2 p-4 text-xs">
      <Button render={<Link to="/">Home</Link>} size="lg" variant="link" />
      <Separator orientation="vertical" />
      <Button
        render={
          <a
            href="https://github.com/nemvince/tvksquared"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubLogoIcon />
            Source
          </a>
        }
        size="lg"
        variant="link"
      />
    </footer>
  );
};
