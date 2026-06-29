
import { Button } from "@/components/ui/button";
import { XIcon } from "../../icons/x-icon";
import { GithubIcon } from "../../icons/github-icon";
import { Logo } from "./logo";

const navLinks = [
    { href: "#", label: "Features" },
    { href: "#", label: "Blog" },
    { href: "#", label: "About" },
    { href: "#", label: "Contact" },
    { href: "#", label: "Licence" },
    { href: "#", label: "Privacy" },
];

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
        <footer className="w-full border-t bg-card dark:bg-card transition-colors duration-200">
            {/* Inner Container */}
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">

                {/* Top Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Logo className="h-7 md:h-6" />
                    </div>

                    {/* Social Icons */}
                    <div className="flex items-center gap-2">
                        {socialLinks.map(({ href, label, icon }) => (
                            <Button asChild key={label} size="icon" variant="ghost" className="hover:text-primary transition-colors">
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
                <div className="flex flex-col sm:flex-row justify-between gap-3 border-t py-4 text-sm text-muted-foreground">

                    <p>&copy; {new Date().getFullYear()} | Chaatwala</p>

                    <p className="flex items-center gap-1">
                        <span>Built by</span>
                        <a
                            href="https://x.com/shabanhr"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-foreground/80 hover:text-primary hover:underline transition-colors"
                        >
                            <img
                                src="https://github.com/shabanhr.png"
                                alt="shaban"
                                className="size-4 rounded-full"
                            />
                            Fu Infotech Ltd.
                        </a>
                    </p>
                </div>

            </div>
        </footer>
    );
}
