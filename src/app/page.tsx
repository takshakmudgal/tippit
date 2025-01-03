import React, { FC } from "react";
import { Progress } from "@/components/Progress";

const Home: FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <Progress />
    </div>
  );
};

export default Home;
