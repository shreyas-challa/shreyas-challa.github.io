import React from "react";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconHome,
  IconPencil,
  IconUser,
} from "@tabler/icons-react";

export const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#/",
    },
    {
      title: "About",
      icon: (
        <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#/about",
    },
    {
      title: "X",
      icon: (
        <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://x.com/shreyaschalla1",
      target: "_blank",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://github.com/shreyas-challa",
      target: "_blank",
    },
    {
      title: "LinkedIn",
      icon: (
        <IconBrandLinkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://linkedin.com/in/shreyas-challa",
      target: "_blank",
    },
  ];

export const createLink = {
  title: "Create",
  icon: (
    <IconPencil className="h-full w-full text-neutral-500 dark:text-neutral-300" />
  ),
  href: "#/create",
};
