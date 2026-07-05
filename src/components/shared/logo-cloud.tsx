import data from "../../../sitedata.json";
import Image from "next/image";

export function LogoCloud() {
	return (
		<div className="overflow-hidden py-4">
			<div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
				{logos.map((logo) => (
					<Image
						alt={logo.alt}
						className="pointer-events-none h-4 select-none md:h-5 dark:brightness-0 dark:invert"
						height={20}
						key={`logo-${logo.alt}`}
						loading="lazy"
						src={logo.src}
						width={120}
					/>
				))}
			</div>
		</div>
	);
}

const logos = data.shared.brandLogos;
