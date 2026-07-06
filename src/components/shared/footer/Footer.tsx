
import data from "../../../../sitedata.json";
import { Button } from "@/components/ui/button";
import { XIcon } from "../../icons/x-icon";
import { GithubIcon } from "../../icons/github-icon";
import { Logo } from "./logo";
import Image from "next/image";
import Link from "next/link";

const navLinks = data.navigation.footerNavLinks;
const socialLinks = [
    {
        href: "#",
        label: "X",
        icon: <XIcon />,
    },
    {
        href: "#",
        label: "Github",
        icon: <GithubIcon />,
    },
];

export function Footer() {
    return (
        <footer className="w-full border-t border-border/70 bg-gradient-to-t from-card via-card to-background transition-colors duration-200">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">

                {/* Top Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Logo className="h-9 md:h-8" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Chaatwala</p>
                          <p className="text-xs text-muted-foreground">Fresh street food every day</p>
                        </div>
                    </div>

                    {/* Social Icons */}
                    <div className="flex items-center gap-3">
                        {socialLinks.map(({ href, label, icon }) => (
                            <Button asChild key={label} size="icon" variant="secondary" className="hover:bg-muted hover:text-foreground transition-colors">
                                <a aria-label={label} href={href}>
                                    {icon}
                                </a>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="pb-6">
                    <ul className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground md:gap-6 md:justify-center lg:justify-start">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <a className="hover:text-primary transition-colors" href={link.href}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom Bar */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 border-t border-border/70 py-4 text-sm text-muted-foreground">

                    <p className="text-foreground/90">&copy; {new Date().getFullYear()} | Chaatwala</p>

                    <p className="flex items-center gap-1 text-foreground/80">
                        <span>Built by</span>
                        <Link
                            href="https://x.com/#"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-foreground/80 hover:text-primary hover:underline transition-colors"
                        >
                            <Image
                                src="https://images.unsplash.com/photo-1603133872878-684f208fb84b"
                                alt="shaban"
                                width={16}
                                height={16}
                                className="rounded-full"
                            />
                            Fu Infotech Ltd.
                        </Link>
                    </p>
                </div>

            </div>
        </footer>
    );
}
