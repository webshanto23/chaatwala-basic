import Image from "next/image";
import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function VisionSection() {
    return (
        <Card className="group relative mx-auto w-full overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-white via-secondary/10 to-white shadow-xl shadow-secondary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f"
                    alt="Event cover"
                    width={600}
                    height={340}
                    className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <CardHeader className="relative z-10 px-6 py-6">
                <CardTitle className="text-2xl font-semibold text-foreground">Our Vision</CardTitle>
                <CardDescription className="mt-3 text-sm text-muted-foreground">
                    <ReadMoreText
                        text="Our vision is to become the go-to destination for street food lovers, combining taste, hygiene, and technology to deliver an unforgettable dining experience."
                    />
                </CardDescription>
            </CardHeader>
        </Card>
    )
}