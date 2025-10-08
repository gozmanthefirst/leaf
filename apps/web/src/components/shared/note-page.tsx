import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  TbAppWindow,
  TbBook,
  TbDotsVertical,
  TbEdit,
  TbFileArrowRight,
  TbFiles,
  TbStar,
  TbTrash,
} from "react-icons/tb";

import { WithState } from "@/components/fallback/with-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { countFolderStats } from "@/lib/utils";
import { $getFolder, folderQueryOptions } from "@/server/folder";

export const NotePageHeader = () => {
  const getFolder = useServerFn($getFolder);

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  return (
    <header className="sticky top-0 isolate z-10 flex h-10 w-full items-center border-muted/80 px-3 lg:px-6">
      <SidebarTrigger className="lg:hidden" />

      <WithState state={folderQuery}>
        {(rf) => {
          if (!rf) return null;
          const stats = countFolderStats(rf);

          if (stats.notes === 0) return null;

          return (
            <div className="ml-auto flex items-center gap-1">
              <Button className="size-7" size={"icon"} variant={"ghost"}>
                <TbBook />
              </Button>
              <NotePageDropdown />
            </div>
          );
        }}
      </WithState>
    </header>
  );
};

export const NotePageDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size={"icon"} variant={"ghost"}>
          <TbDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={"end"} className="w-56" side={"bottom"}>
        <DropdownMenuItem>
          <TbAppWindow className="text-muted-foreground" />
          <span>Open in new window</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <TbFiles className="text-muted-foreground" />
          <span>Make a copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move note to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbStar className="text-muted-foreground" />
          <span>Favorite note</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbEdit className="text-muted-foreground" />
          <span>Rename note</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <TbTrash className="text-muted-foreground" />
          <span>Delete note</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
