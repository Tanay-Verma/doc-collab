"use client";
import { useAppState } from "@/src/lib/providers/state-provider";
import {
  deleteFile,
  deleteFolder,
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
  restoreFolder,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/src/lib/supabase/queries";
import { File, Folder, Workspace } from "@/src/lib/supabase/supabase.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "quill/dist/quill.snow.css";
import React, { useCallback, useMemo, useState } from "react";
import BannerUpload from "../banner-upload/banner-upload";
import EmojiPicker from "../global/emoji-picker";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { XCircleIcon } from "lucide-react";
interface QuillEditorProps {
  dirDetails: File | Folder | Workspace;
  fileId: string;
  dirType: "workspace" | "folder" | "file";
}

var TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

const QuillEditor: React.FC<QuillEditorProps> = ({
  dirDetails,
  dirType,
  fileId,
}) => {
  const supabase = createClientComponentClient();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const [quill, setQuill] = useState<any>(null);
  const pathName = usePathname();
  const [collaborators, setCollaborators] = useState<
    {
      id: string;
      email: string;
      avatarUrl: string;
    }[]
  >();
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const details = useMemo(() => {
    let selectedDir;
    if (dirType === "file") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === folderId)
        ?.files.find((file) => file.id === fileId);
    }
    if (dirType === "folder") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileId);
    }
    if (dirType === "workspace") {
      selectedDir = state.workspaces.find(
        (workspace) => workspace.id === fileId
      );
    }

    if (selectedDir) return selectedDir;

    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as Workspace | Folder | File;
  }, [state, workspaceId, folderId]);

  const breadCrumbs = useMemo(() => {
    if (!pathName || !state.workspaces || !workspaceId) return;
    const segements = pathName
      .split("/")
      .filter((val) => val !== "dashboard" && val);
    const workspaceDetails = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    const workspaceBreadCrumb = workspaceDetails
      ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
      : "";
    if (segements.length === 1) {
      return workspaceBreadCrumb;
    }

    const folderSegment = segements[1];
    const folderDetails = workspaceDetails?.folders.find(
      (folder) => folder.id === folderSegment
    );
    const folderBreadCrumb = folderDetails
      ? `/ ${folderDetails.iconId} ${folderDetails.title}`
      : "";
    if (segements.length === 2) {
      return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
    }

    const fileSegment = segements[2];
    const fileDetails = folderDetails?.files.find(
      (file) => file.id === fileSegment
    );
    const fileBreadCrumb = fileDetails
      ? `/ ${fileDetails.iconId} ${fileDetails.title}`
      : "";
    return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
  }, [state, pathName, workspaceId]);

  const wrapperRef = useCallback(async (wrapper: any) => {
    if (typeof window !== "undefined") {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      const Quill = (await import("quill")).default;
      // WIP Cursors
      const q = new Quill(editor, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          // WIP Cursors
        },
      });
      setQuill(q);
    }
  }, []);

  const restoreFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { inTrash: "" }, fileId, folderId, workspaceId },
      });
      await updateFile({ inTrash: "" }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "RESTORE_FOLDER",
        payload: { folderId: fileId, workspaceId },
      });
      await restoreFolder(fileId);
    }
  };

  const deleteFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "DELETE_FILE",
        payload: { fileId, folderId, workspaceId },
      });
      await deleteFile(fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "DELETE_FOLDER",
        payload: { folderId: fileId, workspaceId },
      });
      await deleteFolder(fileId);
    }
  };

  const iconOnChange = async (icon: string) => {
    if (!fileId) return;
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { iconId: icon }, workspaceId: fileId },
      });
      await updateWorkspace({ iconId: icon }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: { folder: { iconId: icon }, workspaceId, folderId: fileId },
      });
      await updateFolder({ iconId: icon }, fileId);
    }
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { iconId: icon }, folderId, workspaceId, fileId },
      });
      await updateFile({ iconId: icon }, fileId);
    }
  };

  const deleteBanner = async () => {
    const removeBanner = async (bannerUrl: string) => {
      const { data, error } = await supabase.storage
        .from("file-banners")
        .remove([bannerUrl]);
      if (error) throw new Error(`File Delete Error: ${error}`);
      console.log("File Delete Data:", data);
    };
    if (!fileId) return;
    setDeletingBanner(true);
    if (dirType === "file") {
      const { data, error } = await getFileDetails(fileId);
      if (error) throw new Error(`File Details Error: ${error}`);
      const bannerUrl = data[0].bannerUrl;
      if (!bannerUrl) return;
      await removeBanner(bannerUrl);
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { bannerUrl: "" }, fileId, folderId, workspaceId },
      });
      await updateFile({ bannerUrl: "" }, fileId);
    }
    if (dirType === "folder") {
      const { data, error } = await getFolderDetails(fileId);
      if (error) throw new Error(`Folder Details Error: ${error}`);
      const bannerUrl = data[0].bannerUrl;
      if (!bannerUrl) return;
      await removeBanner(bannerUrl);
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: { folder: { bannerUrl: "" }, folderId: fileId, workspaceId },
      });
      await updateFolder({ bannerUrl: "" }, fileId);
    }
    if (dirType === "workspace") {
      const { data, error } = await getWorkspaceDetails(fileId);
      if (error) throw new Error(`Workspace Details Error: ${error}`);
      const bannerUrl = data[0].bannerUrl;
      if (!bannerUrl) return;
      await removeBanner(bannerUrl);
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { bannerUrl: "" }, workspaceId: fileId },
      });
      await updateWorkspace({ bannerUrl: "" }, fileId);
    }
    setDeletingBanner(false);
  };
  return (
    <>
      <div className="relative">
        {details.inTrash && (
          <article
            className="py-2 
                        z-40 
                        bg-[#EB5757] 
                        flex  
                        md:flex-row 
                        flex-col 
                        justify-center 
                        items-center 
                        gap-4 
                        flex-wrap"
          >
            <div
              className="flex 
            flex-col 
            md:flex-row 
            gap-2 
            justify-center 
            items-center"
            >
              <span className="text-white">
                This {dirType} is in the trash.
              </span>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent 
                border-white 
                text-white 
                hover:bg-white 
                hover:text-[#EB5757]"
                onClick={restoreFileHandler}
              >
                Restore
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]
                "
                onClick={deleteFileHandler}
              >
                Delete
              </Button>
            </div>
            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
        <div
          className="flex 
        flex-col-reverse 
        sm:flex-row 
        sm:justify-between 
        sm:items-center 
        sm:p-2 
        p-8"
        >
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10">
              {collaborators?.map((collaborator) => (
                <TooltipProvider key={collaborator.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="-ml-3
                    bg-background
                    border-2
                    flex
                    items-center
                    justify-center
                    border-white
                    h-8
                    w-8
                    rounded-full"
                      >
                        <AvatarImage
                          className="rounded-full"
                          src={collaborator.avatarUrl}
                        />
                        <AvatarFallback className="cursor-default">
                          {collaborator.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{collaborator.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant="secondary"
                className="bg-orange-600 top-4 text-white right-4 z-50"
              >
                Saving...
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-600 top-4 text-white right-4 z-50"
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
      {details.bannerUrl && (
        <div className="relative w-full h-[200px] ">
          <Image
            src={
              supabase.storage
                .from("file-banners")
                .getPublicUrl(details.bannerUrl).data.publicUrl
            }
            fill
            className="w-full md:h-40 h-20 object-cover"
            alt="Banner Image"
          />
        </div>
      )}

      <div
        className="flex 
      justify-center 
      items-center 
      flex-col 
      mt-2 
      relative"
      >
        <div
          className="w-full 
        self-center 
        max-w-[800px] 
        flex 
        flex-col 
        px-7 
        lg:my-8"
        >
          <div className="text-[80px]">
            <EmojiPicker getValue={iconOnChange}>
              <div
                className="w-[100px]
              cursor-pointer
              transition-colors
              h-[100px]
              flex
              items-center
              justify-center
              hover:bg-muted-foreground
              rounded-xl"
              >
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
          <div className="flex">
            <BannerUpload
              id={fileId}
              dirType={dirType}
              className="mt-2
            text-sm
            text-muted-foreground
            p-2
            hover:text-card-foreground
            transition-all
            rounded-md"
            >
              {details.bannerUrl ? "Update Banner" : "Add Banner"}
            </BannerUpload>
            {details.bannerUrl && (
              <Button
                disabled={deletingBanner}
                onClick={deleteBanner}
                variant="ghost"
                className="gap-2
                hover:bg-background
                flex
                items-center
                justify-center
                mt-2
                text-sm
                text-muted-foreground
                w-36
                p-2
                rounded-sm"
              >
                <XCircleIcon size={16} />
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
            )}
          </div>
          <span className="text-muted-foreground text-3xl font-bold h-9">
            {details.title}
          </span>
          <span className="text-muted-foreground text-sm">
            {dirType.toUpperCase()}
          </span>
        </div>
        <div id="container" className="max-[800px]" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
