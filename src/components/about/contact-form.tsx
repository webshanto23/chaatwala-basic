import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
	return (
		<form className="w-full space-y-4">
			<FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Field>
					<FieldLabel htmlFor="first-name">First name</FieldLabel>
					<Input autoComplete="off" id="first-name" placeholder="John" className="focus:ring-2 focus:ring-primary/50" />
				</Field>
				<Field>
					<FieldLabel htmlFor="last-name">Last name</FieldLabel>
					<Input autoComplete="off" id="last-name" placeholder="Doe" className="focus:ring-2 focus:ring-primary/50" />
				</Field>
			</FieldGroup>
			<Field>
				<FieldLabel htmlFor="email">Email</FieldLabel>
				<Input
					autoComplete="off"
					id="email"
					placeholder="johndoe@example.com"
					type="email"
					className="focus:ring-2 focus:ring-primary/50"
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="phone">Phone</FieldLabel>
				<Input
					autoComplete="off"
					id="phone"
					placeholder="+1 (555) 123-4567"
					type="tel"
					className="focus:ring-2 focus:ring-primary/50"
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="message">Message</FieldLabel>
				<Textarea
					autoComplete="off"
					id="message"
					placeholder="Your message"
					className="resize-none focus:ring-2 focus:ring-primary/50"
				/>
			</Field>
			<Button className="w-full" type="button">
				Submit
			</Button>
		</form>
	);
}