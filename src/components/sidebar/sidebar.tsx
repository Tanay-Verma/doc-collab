import {
  getCollaboratingWorkspaces,
  getFolders,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getUserSubscriptionStatus,
} from "@/src/lib/supabase/queries";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import NativeNavigation from "./native-navigation";
import PlanUsage from "./plan-usage";
import WorkspaceDropdown from "./workspace-dropdown";
import UserCard from "./user-card";

interface SidebarProps {
  params: { workspaceId: string };
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = async ({ params, className }) => {
  const supabase = createServerComponentClient({ cookies });

  // user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // subscription status
  const { data: subscriptionData, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);
  // folders
  const { data: workspaceFolderData, error: foldersError } = await getFolders(
    params.workspaceId
  );
  // errors
  if (subscriptionError || foldersError) redirect("/dashboard");

  const [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces] =
    await Promise.all([
      getPrivateWorkspaces(user.id),
      getCollaboratingWorkspaces(user.id),
      getSharedWorkspaces(user.id),
    ]);
  // get all the different workspaces: Private | Collaborating | Shared
  return (
    <aside
      className={twMerge(
        "hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between",
        className
      )}
    >
      <div>
        <WorkspaceDropdown
          defaultValue={[
            ...privateWorkspaces,
            ...collaboratingWorkspaces,
            ...sharedWorkspaces,
          ].find((workspace) => workspace.id === params.workspaceId)}
          privateWorkspaces={privateWorkspaces}
          sharedWorkspaces={sharedWorkspaces}
          collaboratingWorkspaces={collaboratingWorkspaces}
        />
        <PlanUsage foldersLength={workspaceFolderData?.length || 0} subscription={subscriptionData}/>
        <NativeNavigation myWorkspaceId={params.workspaceId}/>
        <ScrollArea
          className="overflow-auto relative h-[450px]"
        >
          <div className="pointer-events-none 
          w-full 
          absolute 
          bottom-0 
          h-20 
          bg-gradient-to-t 
          from-background 
          to-transparent 
          z-40"/>
          <FoldersDropdownList workspaceFolders = {workspaceFolderData || []} workspaceId={params.workspaceId}/>
        </ScrollArea>
      </div>
      <UserCard subscription={subscriptionData} />
    </aside>
  );
};

export default Sidebar;
