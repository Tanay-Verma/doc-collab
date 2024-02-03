import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppState } from "../providers/state-provider";
import { File, Folder, Workspace } from "../supabase/supabase.types";

const useSupabaseRealtime = () => {
  const supabase = createClientComponentClient();
  const { dispatch, state, workspaceId: selectedWorkspace } = useAppState();
  const router = useRouter();

  useEffect(() => {
    const channelWorkspaces = supabase
      .channel("db-changes-workspace")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspaces" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 RECEIVED REAL TIME EVENT WORKSPACE INSERT");
            const { id: workspaceId } = payload.new;
            if (
              !state.workspaces.find(
                (workspace) => workspace.id === workspaceId
              )
            ) {
              const newWorkspace: Workspace = {
                id: payload.new.id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
                logo: payload.new.logo,
                workspaceOwner: payload.new.workspace_owner,
              };
              dispatch({
                type: "ADD_WORKSPACE",
                payload: { ...newWorkspace, folders: [] },
              });
            }
          } else if (payload.eventType === "DELETE") {
            console.log("🟢 RECEIVED REAL TIME EVENT WORKSPACE DELETE");
            let workspaceId = "";
            const workspaceExists = state.workspaces.some((workspace) => {
              if (workspace.id === payload.old.id) {
                workspaceId = workspace.id;
                return true;
              }
            });
            if (workspaceExists && workspaceId) {
              router.replace(`/dashboard/${workspaceId}`);
              dispatch({
                type: "DELETE_WORKSPACE",
                payload: payload.old.id,
              });
            }
          } else if (payload.eventType === "UPDATE") {
            console.log("🟢 RECEIVED REAL TIME EVENT WORKSPACE UPDATE");
            const { id: workspaceId } = payload.new;
            state.workspaces.some((workspace) => {
              if (workspace.id === payload.new.id) {
                dispatch({
                  type: "UPDATE_WORKSPACE",
                  payload: {
                    workspaceId,
                    workspace: {
                      title: payload.new.title,
                      logo: payload.new.logo,
                      iconId: payload.new.icon_id,
                      bannerUrl: payload.new.banner_url,
                    },
                  },
                });
                return true;
              }
            });
          }
        }
      )
      .subscribe();
    return () => {
      console.log("🔴 STOP REAL TIME EVENT WORKSPACE");
      channelWorkspaces.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace]);

  useEffect(() => {
    const channelFolders = supabase
      .channel("db-changes-folders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 RECEIVED REAL TIME EVENT FOLDER INSERT");
            const { id: folderId, workspace_id: workspaceId } = payload.new;
            if (
              !state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((folder) => folder.id === folderId)
            ) {
              const newFolder: Folder = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FOLDER",
                payload: { folder: { ...newFolder, files: [] }, workspaceId },
              });
            }
          } else if (payload.eventType === "DELETE") {
            console.log("🟢 RECEIVED REAL TIME EVENT FOLDER DELETE");
            let workspaceId = "";
            const folderExists = state.workspaces.some((workspace) =>
              workspace.folders.some((folder) => {
                if (folder.id === payload.old.id) {
                  workspaceId = workspace.id;
                  return true;
                }
              })
            );
            if (folderExists && workspaceId) {
              router.replace(`/dashboard/${workspaceId}`);
              dispatch({
                type: "DELETE_FOLDER",
                payload: { folderId: payload.old.id, workspaceId },
              });
            }
          } else if (payload.eventType === "UPDATE") {
            console.log("🟢 RECEIVED REAL TIME EVENT FOLDER UPDATE");
            const { id: folderId, workspace_id: workspaceId } = payload.new;
            state.workspaces.some((workspace) =>
              workspace.folders.some((folder) => {
                if (folder.id === payload.new.id) {
                  dispatch({
                    type: "UPDATE_FOLDER",
                    payload: {
                      workspaceId,
                      folderId,
                      folder: {
                        title: payload.new.title,
                        iconId: payload.new.icon_id,
                        inTrash: payload.new.in_trash,
                        bannerUrl: payload.new.banner_url
                      },
                    },
                  });
                  return true;
                }
              })
            );
          }
        }
      )
      .subscribe();
    return () => {
      console.log("🔴 STOP REAL TIME EVENT FOLDER");
      channelFolders.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace]);

  useEffect(() => {
    const channelFiles = supabase
      .channel("db-changes-files")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 RECEIVED REAL TIME EVENT FILE INSERT");
            const {
              folder_id: folderId,
              workspace_id: workspaceId,
              id: fileId,
            } = payload.new;
            if (
              !state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((folder) => folder.id === folderId)
                ?.files.find((file) => file.id === fileId)
            ) {
              const newFolder: File = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                folderId: payload.new.folder_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FILE",
                payload: { file: newFolder, folderId, workspaceId },
              });
            }
          } else if (payload.eventType === "DELETE") {
            console.log("🟢 RECEIVED REAL TIME EVENT FILE DELETE");
            let workspaceId = "";
            let folderId = "";
            const fileExists = state.workspaces.some((workspace) =>
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.old.id) {
                    workspaceId = workspace.id;
                    folderId = folder.id;
                    return true;
                  }
                })
              )
            );
            if (fileExists && workspaceId && folderId) {
              router.replace(`/dashboard/${workspaceId}`);
              dispatch({
                type: "DELETE_FILE",
                payload: { fileId: payload.old.id, folderId, workspaceId },
              });
            }
          } else if (payload.eventType === "UPDATE") {
            console.log("🟢 RECEIVED REAL TIME EVENT FILE UPDATE");
            const { folder_id: folderId, workspace_id: workspaceId } =
              payload.new;
            state.workspaces.some((workspace) =>
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.new.id) {
                    dispatch({
                      type: "UPDATE_FILE",
                      payload: {
                        workspaceId,
                        folderId,
                        fileId: payload.new.id,
                        file: {
                          title: payload.new.title,
                          iconId: payload.new.icon_id,
                          inTrash: payload.new.in_trash,
                          bannerUrl: payload.new.banner_url,
                        },
                      },
                    });
                    return true;
                  }
                })
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      console.log("🔴 STOP REAL TIME EVENT FILE");
      channelFiles.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace]);
  return null;
};

export default useSupabaseRealtime;
