import Header from "@/src/components/landing-page/header";
import React from "react";

const HomePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main>
      <Header/>
      {children}
    </main>
  );
};

export default HomePageLayout;
