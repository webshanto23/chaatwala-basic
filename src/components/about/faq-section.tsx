import data from "../../../sitedata.json";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
	return (
		<div className="mx-auto w-full max-w-2xl space-y-7 px-4">
			<div className="space-y-2">
				<h2 className="font-bold text-3xl md:text-4xl text-foreground">
					{data.about.faq.heading}
				</h2>
				<p className="max-w-2xl text-muted-foreground">
					{data.about.faq.description}
				</p>
			</div>
			<Accordion className="rounded-lg border-border bg-card" collapsible type="single">
				{questions.map((item) => (
					<AccordionItem className="px-4 last:border-b-0" key={item.id} value={item.id}>
						<AccordionTrigger className="py-4 hover:no-underline focus-visible:underline focus-visible:ring-0 text-foreground">
							{item.title}
						</AccordionTrigger>
						<AccordionContent className="pb-4! text-muted-foreground">
							{item.content}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
			<p className="text-muted-foreground">
				Can&apos;t find what you&apos;re looking for? Contact our{" "}
				<a className="text-primary hover:underline" href="#">
					customer support team
				</a>
			</p>
		</div>
	);
}

const questions = data.about.faq.questions;
