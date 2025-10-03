import type { User } from "@repo/db";
import { Image } from "@unpic/react";
import {
  TbChevronDown,
  TbFilePlus,
  TbFolderPlus,
  TbLogout,
  TbPaint,
  TbSettings,
} from "react-icons/tb";

import { initialsFromName } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

export const AppSidebar = ({ user }: { user: User }) => {
  const { isMobile } = useSidebar();

  return (
    <Sidebar variant="inset">
      {/* Header */}
      <SidebarHeader className="">
        <div className="flex items-center gap-3 p-2 font-medium text-lg">
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
            <p className="text-muted-foreground text-xs">0 folders. 0 notes.</p>
          </div>
        </div>
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
                      {user.email}
                    </span>
                  </div>
                  <TbChevronDown className="ml-auto size-4" />
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
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <TbPaint className="size-4" />
                    Theme
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <TbSettings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <TbLogout className="size-4" />
                  Log out
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
