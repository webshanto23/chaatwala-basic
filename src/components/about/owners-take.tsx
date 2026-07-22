import Image from "next/image";
import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function OwnersTakeSection() {
    return (
        <Card className="group relative mx-auto w-full overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-accent/10 to-card shadow-xl shadow-accent/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
                    alt="Event cover"
                    width={600}
                    height={340}
                    className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <CardHeader className="relative z-10 px-6 py-6">
                <CardTitle className="text-2xl font-semibold text-foreground">Owner&apos;s Take</CardTitle>
                <CardDescription className="mt-3 text-sm text-muted-foreground">
                    <ReadMoreText
                        text="At Chaatwala, we believe in the power of food to bring people together. Our journey started with a simple idea: to share the authentic flavors of Indian street food with the world. We are committed to using the freshest ingredients and traditional recipes to create dishes that are not only delicious but also a true representation of our culture and heritage."
                    />
                </CardDescription>
            </CardHeader>
        </Card>
    )
}