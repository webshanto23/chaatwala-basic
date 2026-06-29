import Image from "next/image";
import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function VisionSection() {
    return (
        <Card className="relative mx-auto w-full pt-0 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 z-30 aspect-video bg-gradient-to-t from-secondary/80 to-transparent" />
            <Image
                src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f"
                alt="Event cover"
                width={600}
                height={340}
                className="relative z-20 aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <CardHeader className="relative z-40 text-white">
                <CardTitle className="text-muted-foreground  drop-shadow-md">Our Vision</CardTitle>
                <CardDescription className="text-muted-foreground/90">
                    <ReadMoreText
                        text="Our vision is to become the go-to destination for street food lovers, combining taste, hygiene, and technology to deliver an unforgettable dining experience."
                    />
                </CardDescription>
            </CardHeader>
        </Card>
    )
}