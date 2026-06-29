import Image from "next/image";
import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function HistorySection() {
    return (
        <Card className="relative mx-auto w-full pt-0 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 z-30 aspect-video bg-gradient-to-t from-primary/80 to-transparent" />
            <Image
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
                alt="Event cover"
                width={600}
                height={340}
                className="relative z-20 aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <CardHeader className="relative z-40 text-white">
                <CardTitle className="text-muted-foreground drop-shadow-md">Our History</CardTitle>
                <CardDescription className="text-muted-foreground/90 drop-shadow-md">
                    <ReadMoreText
                        text="Chaatwala was founded in 2010 with a mission to bring the authentic taste of Indian street food to the world. Over the years, we have grown from a small food cart to a beloved brand known for our commitment to quality, flavor, and customer satisfaction."
                    />        
                </CardDescription>
            </CardHeader>
        </Card>
    )
}