"use client"
import { useSubscriptionModal } from "@/src/lib/providers/subscription-modal-provider";
import { useSupabaseUser } from "@/src/lib/providers/supabase-user-provider";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import Loader from "./Loader";

const SubscriptionModal = () => {
  const { open, setOpen } = useSubscriptionModal();
  const { subscription } = useSupabaseUser();
  const [isLoading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {subscription?.status === "active" ? (
        <DialogContent>Already on a paid plan!</DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            To access Pro features you need to have a paid plan.
          </DialogDescription>
          {/* <div className="flex justify-between items-center">
            <React.Fragment>
              <b className="text-3xl text-foreground">
                {formatPrice()} / <small>month</small>
              </b>
              <Button disabled={isLoading}>{isLoading? <Loader/>: "Upgrade ✨"}</Button>
            </React.Fragment>
          </div> */}
          No Products Available
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;
