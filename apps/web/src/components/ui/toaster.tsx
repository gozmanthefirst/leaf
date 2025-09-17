import { TbX } from "react-icons/tb";
import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/themes";

const Toaster = () => {
  const { theme } = useTheme();

  return (
    <Sonner
      position="top-right"
      richColors
      theme={theme as "light" | "dark" | "system"}
      toastOptions={{
        classNames: {
          toast: "!rounded-xl large-width",
          title: "md:!text-[13px]/[16px] !font-semibold !mr-3",
          description: "",
          actionButton: "",
          cancelButton:
            "!absolute !top-1.5 !right-1.5 !bg-transparent !p-0 !size-5 !flex !items-center !justify-center !opacity-80 lg:!opacity-50 lg:hover:!opacity-80 lg:hover:!bg-neutral-100/20 dark:!bg-transparent dark:lg:hover:!bg-neutral-900/20 !transition",
          closeButton: "",
        },
      }}
      visibleToasts={4}
    />
  );
};

const cancelToastEl = {
  cancel: {
    label: <TbX className="size-3.5" strokeWidth={3} />,
    onClick: () => {},
  },
};

export { cancelToastEl, Toaster };
