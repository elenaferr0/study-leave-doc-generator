import { DocumentBuild } from "../components/document-build"

// Add loader function to handle GET requests
export function loader() {
  return null // or return any data you need for this route
}

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Study leave document generator</h1>
      <DocumentBuild />
    </div>
  )
}