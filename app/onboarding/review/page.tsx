"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReviewRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main chat since review step has been removed
    router.replace('/')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
