import { Card } from "../ui/card";

export default function MapSection() {
    return (
         <Card className="rounded-2xl overflow-hidden">
          <iframe
            src="https://www.google.com/maps?q=Dhaka&output=embed"
            className="w-full h-[300px] border-0 px-2 rounded-md"
            loading="lazy"
          />
        </Card>
    )
}