import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
   <div className="flex flex-col justify-center items-center p-4 bg-gray-100">
    <h1 className="text-2xl font-bold text-gray-800">Good afternoon!</h1>
    <p className="text-gray-600">What would you like to eat today?</p>
     <Field orientation="horizontal">
      <Input type="search" placeholder="Find dishes..." />
      <Button>Search</Button>
    </Field>
   </div>
  )
}