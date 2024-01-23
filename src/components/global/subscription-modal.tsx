"use client";
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
import { Price, ProductWithPrice } from "@/src/lib/supabase/supabase.types";
import { formatPrice, postData } from "@/src/lib/utils";
import { useToast } from "../ui/use-toast";
import { getStripe } from "@/src/lib/stripe/stripeClient";

interface SubscriptionModalProps {
  products: ProductWithPrice[];
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ products }) => {
  const { open, setOpen } = useSubscriptionModal();
  const { subscription } = useSupabaseUser();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSupabaseUser();
  const { toast } = useToast();

  const onClickContinue = async (price: Price) => {
    try {
      setIsLoading(true);
      if (!user) {
        toast({ title: "You must be logged in" });
        setIsLoading(false);
        return;
      }
      if (subscription) {
        toast({ title: "Already on a paid plan" });
        setIsLoading(false);
        return;
      }
      const { sessionId } = await postData({
        url: "/api/create-checkout-session",
        data: { price },
      });
      console.log("Getting Checkout for stripe");
      const stripe = await getStripe();
      stripe?.redirectToCheckout({sessionId});
    } catch (error) {
      toast({title:"Oppse! Somethiong went wrong.", variant:'destructive'})
    } finally {
      setIsLoading(false);
    }
  };
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
          {products.length
            ? products.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center"
                >
                  {product.prices?.map((price) => (
                    <React.Fragment key={price.id}>
                      <b className="text-3xl text-foreground">
                        {formatPrice(price)} / <small>{price.interval}</small>
                      </b>
                      <Button
                        onClick={() => onClickContinue(price)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader /> : "Upgrade ✨"}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>
              ))
            : "No Products Available"}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;
