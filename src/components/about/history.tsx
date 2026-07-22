import Image from "next/image";
import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function HistorySection() {
    return (
        <Card className="group relative mx-auto w-full overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-primary/10 to-card shadow-xl shadow-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
                    alt="Event cover"
                    width={600}
                    height={340}
                    className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <CardHeader className="relative z-10 px-6 py-6">
                <CardTitle className="text-2xl font-semibold text-foreground">Our History</CardTitle>
                <CardDescription className="mt-3 text-sm text-muted-foreground">
                    <ReadMoreText
                        text="Chaatwala was founded in 2010 with a mission to bring the authentic taste of Indian street food to the world. Over the years, we have grown from a small food cart to a beloved brand known for our commitment to quality, flavor, and customer satisfaction."
                    />        
                </CardDescription>
            </CardHeader>
        </Card>
    )
}