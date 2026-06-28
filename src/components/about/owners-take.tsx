import ReadMoreText from "../shared/read-more-text";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
export function OwnersTakeSection() {
    return (
        <Card className="relative mx-auto w-full max-w-sm pt-0">
            <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
            <img
                src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
                alt="Event cover"
                className="relative z-20 aspect-video w-full object-cover brightness-90  dark:brightness-40"
            />
            <CardHeader>
                <CardTitle>Owner’s Take</CardTitle>
                <CardDescription>
                    <ReadMoreText
                        text="At Chaatwala, we believe in the power of food to bring people together. Our journey started with a simple idea: to share the authentic flavors of Indian street food with the world. We are committed to using the freshest ingredients and traditional recipes to create dishes that are not only delicious but also a true representation of our culture and heritage."
                    />
                </CardDescription>
            </CardHeader>
        </Card>
    )
}