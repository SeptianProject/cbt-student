'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState, useEffect } from 'react';

function makeQueryClient() {
     return new QueryClient({
          defaultOptions: {
               queries: {
                    staleTime: 60 * 1000,
                    refetchOnWindowFocus: false,
               },
          },
     })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
     if (typeof window === 'undefined') {
          return makeQueryClient()
     } else {
          if (!browserQueryClient) browserQueryClient = makeQueryClient()
          return browserQueryClient
     }
}

export default function Providers({ children }: { children: ReactNode }) {
     const [queryClient] = useState(() => getQueryClient())
     const [mounted, setMounted] = useState(false)

     useEffect(() => {
          setMounted(true)
     }, [])

     if (!mounted) {
          return null
     }

     return (
          <QueryClientProvider client={queryClient}>
               {children}
               {process.env.NODE_ENV === 'development' && (
                    <ReactQueryDevtools initialIsOpen={false} />
               )}
          </QueryClientProvider>
     );
}
