import type { User } from "@repo/db";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Image } from "@unpic/react";
import { useTheme } from "next-themes";
import {
  TbDeviceDesktop,
  TbDotsVertical,
  TbFilePlus,
  TbFolderPlus,
  TbLogout,
  TbMoon,
  TbPaint,
  TbSettings,
  TbSun,
} from "react-icons/tb";
import { toast } from "sonner";

import { apiErrorHandler } from "@/lib/handle-api-error";
import { queryKeys } from "@/lib/query";
import type { Theme } from "@/lib/types";
import { initialsFromName, maskEmail } from "@/lib/utils";
import { $signOut } from "@/server/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { cancelToastEl } from "../ui/toaster";

export const AppSidebar = ({ user }: { user: User }) => {
  const mainRoute = getRouteApi("/_main");
  const { queryClient } = mainRoute.useRouteContext();
  const signOut = useServerFn($signOut);
  const navigate = useNavigate();

  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  const signOutUser = async () => {
    toast.promise(signOut, {
      loading: "Signing out...",
      success: (response) => {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.user],
        });
        navigate({ to: "/auth/sign-in" });

        return response.details;
      },
      error: (error) => {
        const apiError = apiErrorHandler(error, {
          defaultMessage: "Failed to sign out. Please try again.",
        });
        return apiError.details;
      },
      ...cancelToastEl,
    });
  };

  return (
    <Sidebar variant="inset">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto rounded-2xl"
              size={"lg"}
            >
              <div className="flex items-center gap-3 font-medium text-lg">
                <div className="size-10">
                  <Image
                    alt="App Logo"
                    background="auto"
                    layout="fullWidth"
                    priority
                    src={"/logos/app-logo.png"}
                  />
                </div>
                <div>
                  <h3 className="font-roboto font-semibold text-xl">Leaf</h3>
                  <p className="text-muted-foreground text-xs">
                    0 folders. 0 notes.
                  </p>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size={"default"}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="h-auto data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  size="lg"
                >
                  <Avatar className="size-10 rounded-lg">
                    <AvatarImage
                      alt={user.name}
                      src={user.image || undefined}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initialsFromName(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-muted-foreground text-xs">
                      {maskEmail(user.email)}
                    </span>
                  </div>
                  <TbDotsVertical className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-10 rounded-lg">
                      <AvatarImage
                        alt={user.name}
                        src={user.image || undefined}
                      />
                      <AvatarFallback className="rounded-lg">
                        {initialsFromName(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {maskEmail(user.email)}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <TbPaint className="size-4" />
                      <span>Theme</span>
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent className="min-w-0">
                      {uiThemes.map((uiTheme) => (
                        <DropdownMenuCheckboxItem
                          checked={uiTheme.value === theme}
                          key={uiTheme.value}
                          onSelect={() => setTheme(uiTheme.value as Theme)}
                        >
                          <uiTheme.icon />
                          <span className="max-[480px]:hidden">
                            {uiTheme.label}
                          </span>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem disabled>
                    <TbSettings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOutUser} variant="destructive">
                  <TbLogout className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

// Menu items.
const items = [
  {
    title: "Create new folder",
    url: "#",
    icon: TbFolderPlus,
  },
  {
    title: "Create new note",
    url: "#",
    icon: TbFilePlus,
  },
];

const uiThemes = [
  {
    value: "system",
    label: "System",
    icon: TbDeviceDesktop,
  },
  {
    value: "light",
    label: "Light",
    icon: TbSun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: TbMoon,
  },
];
