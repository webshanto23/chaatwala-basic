import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type ProductTag = "spicy" | "popular" | "new";

type ProductCardContentProps = {
  image: string;
  name: string;
  price: number | string;
  detail?: string;
  rating?: number;
  tag?: ProductTag;
  customBadge?: string;
  href?: string;
};

export function ProductCardContent({
  image,
  name,
  price,
  detail,
  rating,
  tag,
  customBadge,
  href,
}: ProductCardContentProps) {
  const imageBlock = (
    <div className="relative overflow-hidden rounded-[2rem] bg-muted/30">
      <div className="aspect-square w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          width={224}
          height={224}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      {tag && (
        <Badge
          variant={tag}
          className="absolute top-3 right-3 rounded-full px-4 py-2 text-xs shadow-lg"
        >
          {tag === "spicy"
            ? "Spicy"
            : tag === "popular"
              ? "Popular"
              : "New"}
        </Badge>
      )}

      {customBadge ? (
        <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
          {customBadge}
        </div>
      ) : rating !== undefined ? (
        <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
          ⭐ {rating}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {href ? (
        <Link href={href} className="block">
          {imageBlock}
        </Link>
      ) : (
        imageBlock
      )}

      <div className="space-y-3 p-5">
        {detail ? (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground line-clamp-1">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        ) : (
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {name}
          </h3>
        )}

        <p className="text-lg font-bold text-primary">৳{price}</p>
      </div>
    </>
  );
}
