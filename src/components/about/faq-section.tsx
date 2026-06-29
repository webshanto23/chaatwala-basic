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
					Frequently Asked Questions
				</h2>
				<p className="max-w-2xl text-muted-foreground">
					Everything you need to know about Chaatwala. Can&apos;t find the answer? 
					Contact our customer support team.
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

const questions = [
	{
		id: "item-1",
		title: "What is Chaatwala?",
		content:
			"Chaatwala is your one-stop destination for authentic Indian street food, bringing the flavors of chaat, biryani, and traditional snacks right to your doorstep.",
	},
	{
		id: "item-2",
		title: "How do I place an order?",
		content:
			"Browse our menu, select your favorite dishes, add them to cart, and checkout. We&apos;ll deliver fresh, hot food within 30 minutes!",
	},
	{
		id: "item-3",
		title: "What are your delivery hours?",
		content:
			"We deliver daily from 11:00 AM to 11:00 PM. Order anytime during these hours for fresh, delicious food.",
	},
	{
		id: "item-4",
		title: "Do you offer vegetarian options?",
		content:
			"Yes! We have a wide variety of vegetarian chaats, snacks, and main dishes. Look for the vegetarian badge on menu items.",
	},
	{
		id: "item-5",
		title: "Can I customize my order?",
		content:
			"Absolutely! You can add special instructions for spice level, ingredients, and preparation during checkout.",
	},
	{
		id: "item-6",
		title: "What payment methods do you accept?",
		content:
			"We accept all major credit/debit cards, mobile payment, and cash on delivery for your convenience.",
	},
	{
		id: "item-7",
		title: "How do I track my order?",
		content:
			"Once your order is confirmed, you can track its status in real-time from your dashboard or the order tracking page.",
	},
];
