import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
   <div className="flex flex-col justify-center items-center p-4 bg-muted/30 dark:bg-muted">
     <h1 className="text-2xl font-bold text-foreground mb-1">Good afternoon!</h1>
     <p className="text-muted-foreground mb-4">What would you like to eat today?</p>
      <Field orientation="horizontal" className="w-full max-w-md">
        <Input 
          type="search" 
          placeholder="Find dishes..." 
          className="flex-1 rounded-r-none focus:ring-2 focus:ring-primary/50"
        />
        <Button className="rounded-l-none px-6">
          Search
        </Button>
      </Field>
   </div>
  )
}