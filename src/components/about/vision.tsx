import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function VisionSection() {
    return (
        <Card className="relative mx-auto w-full max-w-sm pt-0">
            <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
            <img
                src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f"
                alt="Event cover"
                className="relative z-20 aspect-video w-full object-cover brightness-90  dark:brightness-40"
            />
            <CardHeader>
                <CardTitle>Our Vision</CardTitle>
                <CardDescription>
                    <ReadMoreText
                        text="Our vision is to become the go-to destination for street food lovers, combining taste, hygiene, and technology to deliver an unforgettable dining experience."
                    />
                </CardDescription>
            </CardHeader>
        </Card>
    )
}