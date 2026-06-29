import type React from "react";
import Image from "next/image";

export const LogoIcon = (props: React.ComponentProps<"svg">) => (
    <svg fill="currentColor" viewBox="0 -2.5 29 29" {...props}>
        <path d="M 0.09375 23.921875 C 0 23.851562 -0.00390625 23.640625 0.0078125 21.367188 L 0.0234375 18.890625 L 3.324219 18.871094 L 6.628906 18.859375 L 6.664062 18.992188 C 6.683594 19.070312 6.699219 20.191406 6.699219 21.492188 C 6.699219 23.246094 6.683594 23.867188 6.628906 23.921875 C 6.523438 24.027344 0.238281 24.023438 0.09375 23.921875 Z M 0.09375 23.921875 " />
    </svg>
);

export function Logo({ className }: { className?: string }) {
    return (
        <Image
            src="/images/chatwala_logo.png"
            alt="Chaatwala Logo"
            width={120}
            height={32}
            className={className}
        />
    );
}