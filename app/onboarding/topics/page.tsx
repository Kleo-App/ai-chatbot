"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TopicsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to hook page since topics step has been removed
    router.replace('/onboarding/hook')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
