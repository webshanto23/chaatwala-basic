import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function HistorySection() {
    return (
        <Card className="relative mx-auto w-full max-w-sm pt-0">
            <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
            <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
                alt="Event cover"
                className="relative z-20 aspect-video w-full object-cover brightness-90  dark:brightness-40"
            />
            <CardHeader>
                <CardTitle>Our History</CardTitle>
                <CardDescription>
                    <ReadMoreText
                        text="Chaatwala was founded in 2010 with a mission to bring the authentic taste of Indian street food to the world. Over the years, we have grown from a small food cart to a beloved brand known for our commitment to quality, flavor, and customer satisfaction."
                    />        
                </CardDescription>
            </CardHeader>
        </Card>
    )
}