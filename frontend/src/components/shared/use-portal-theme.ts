'use client'

import { useEffect } from 'react'

/**
 * Radix dialogs/dropdowns render in a portal attached to <body>, i.e. outside the
 * portal wrapper element. Mirror the theme class on <body> so they match the portal.
 */
export function usePortalTheme(themeClass: string | null) {
  useEffect(() => {
    if (!themeClass) return
    document.body.classList.add(themeClass)
    return () => document.body.classList.remove(themeClass)
  }, [themeClass])
}
