import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { useIOSKeyboardResize } from "@/hooks/use-ios-keyboard-resize";
import { fontsHref } from "@/lib/utils";
import appCss from "@/styles/app.css?url";
import fontsCss from "@/styles/fonts.css?url";

export interface AppRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      {
        title: "Leaf",
        description: "WYSIWYG web app for writing and organizing notes",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: fontsCss },
      {
        rel: "icon",
        href: "/favicons/favicon.ico",
      },
      ...fontsHref.map((href) => ({
        rel: "preload",
        href,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous" as const,
      })),
    ],
  }),
  component: () => (
    <RootDocument>
      <Outlet />
    </RootDocument>
  ),
});

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  // Install iOS keyboard workaround
  useIOSKeyboardResize();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>

      <body className="min-h-dvh font-inter">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange={true}
          enableSystem
        >
          {/* Give the app container a stable id we can resize on iOS */}
          {/** biome-ignore lint/correctness/useUniqueElementIds: needed */}
          <div
            className="relative isolate flex min-h-dvh flex-col bg-background text-neutral-800 text-sm leading-normal antialiased **:outline-transparent **:outline-offset-2 selection:bg-lime-500 selection:text-neutral-950 md:text-[15px] xl:text-base dark:text-neutral-200"
            id="app-root"
          >
            {children}
          </div>

          <Toaster />
        </ThemeProvider>

        <Scripts />
      </body>
    </html>
  );
}
