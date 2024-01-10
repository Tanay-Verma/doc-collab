"use client";
import { useAppState } from "@/src/lib/providers/state-provider";
import {
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/src/lib/supabase/queries";
import { UploadBannerFormSchema } from "@/src/lib/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import Loader from "../global/Loader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface BannerUploadFormProps {
  dirType: "workspace" | "file" | "folder";
  id: string;
}

const BannerUploadForm: React.FC<BannerUploadFormProps> = ({ dirType, id }) => {
  const supabase = createClientComponentClient();
  const { workspaceId, folderId, dispatch } = useAppState();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting: isUploading, errors },
  } = useForm<z.infer<typeof UploadBannerFormSchema>>({
    mode: "onChange",
    defaultValues: { banner: "" },
  });

  const onSubmitHandler: SubmitHandler<
    z.infer<typeof UploadBannerFormSchema>
  > = async (values) => {
    const file = values.banner?.[0];
    if (!file || !id) return;
    try {
      let filePath = null;

      const uploadBanner = async () => {
        const { data, error } = await supabase.storage
          .from("file-banners")
          .upload(`banner-${v4()}`, file, { cacheControl: "5", upsert: true });

        if (error) throw new Error(`File Upload Error: ${error}`);
        filePath = data.path;
      };

      const deleteBanner = async (bannerUrl: string) => {
        const { data, error } = await supabase.storage
          .from("file-banners")
          .remove([bannerUrl]);
        if (error) throw new Error(`File Delete Error: ${error}`);
        console.log("File Delete Data:",data)
      };
      if (dirType === "file") {
        const { data, error } = await getFileDetails(id);
        if (error) throw new Error(`File Details Error: ${error}`);
        const bannerUrl = data[0].bannerUrl;
        if (!bannerUrl) {
          await uploadBanner();
        } else {
          await deleteBanner(bannerUrl);
          await uploadBanner();
        }
        if (!workspaceId || !folderId) return;
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { bannerUrl: filePath },
            fileId: id,
            folderId,
            workspaceId,
          },
        });
        await updateFile({ bannerUrl: filePath }, id);
      } else if (dirType === "folder") {
        const { data, error } = await getFolderDetails(id);
        if (error) throw new Error(`Folder Details Error: ${error}`);
        const bannerUrl = data[0].bannerUrl;
        if (!bannerUrl) {
          await uploadBanner();
        } else {
          await deleteBanner(bannerUrl);
          await uploadBanner();
        }
        if (!workspaceId) return;
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folderId: id,
            folder: { bannerUrl: filePath },
            workspaceId,
          },
        });
        await updateFolder({ bannerUrl: filePath }, id);
      } else if (dirType === "workspace") {
        const { data, error } = await getWorkspaceDetails(id);
        if (error) throw new Error(`Workspace Details Error: ${error}`);
        const bannerUrl = data[0].bannerUrl;
        if (!bannerUrl) {
          await uploadBanner();
        } else {
          await deleteBanner(bannerUrl);
          await uploadBanner();
        }
        if (!workspaceId) return;
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspace: { bannerUrl: filePath },
            workspaceId,
          },
        });
        await updateWorkspace({ bannerUrl: filePath }, id);
      }
    } catch (error) {
      console.log("Error in uploading:", error);
    }
  };

  
  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex flex-col gap-2"
    >
      <Label className="text-sm text-muted-foreground" htmlFor="bannerImage">
        Banner Image
      </Label>
      <Input
        id="bannerImage"
        type="file"
        accept="image/*"
        disabled={isUploading}
        {...register("banner", { required: "Banner Image is required" })}
      />
      <small className="text-red-600">
        {errors.banner?.message?.toString()}
      </small>
      <Button disabled={isUploading} type="submit">
        {!isUploading ? "Upload Banner" : <Loader />}
      </Button>
    </form>
  );
};

export default BannerUploadForm;
