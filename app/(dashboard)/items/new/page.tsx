import { redirect } from "next/navigation"

// Redirect /items/new to /items since we now use a modal for creating items
export default function NewItemPage() {
    redirect("/items")
}
