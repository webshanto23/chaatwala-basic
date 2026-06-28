import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
	return (
		<form className="w-full">
			<FieldGroup>
				<div className="grid grid-cols-2 gap-4">
					<Field>
						<FieldLabel htmlFor="first-name">First name</FieldLabel>
						<Input autoComplete="off" id="first-name" placeholder="John" />
					</Field>
					<Field>
						<FieldLabel htmlFor="last-name">Last name</FieldLabel>
						<Input autoComplete="off" id="last-name" placeholder="Doe" />
					</Field>
				</div>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						autoComplete="off"
						id="email"
						placeholder="johndoe@example.com"
						type="email"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="phone">Phone</FieldLabel>
					<Input
						autoComplete="off"
						id="phone"
						placeholder="+1 (555) 123-4567"
						type="tel"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="message">Message</FieldLabel>
					<Textarea
						autoComplete="off"
						id="message"
						placeholder="Your message"
					/>
				</Field>
			</FieldGroup>
			<Button className="mt-8 w-full" type="button">
				Submit
			</Button>
		</form>
	);
}