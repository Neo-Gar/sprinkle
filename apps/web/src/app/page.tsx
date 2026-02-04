"use client";

import dynamic from "next/dynamic";

const DAppKitClientProvider = dynamic(
  () =>
    import("@/context/DAppKitClientProvider").then(
      (mod) => mod.DAppKitClientProvider,
    ),
  { ssr: false },
);
const ConnectButton = dynamic(
  () =>
    import("@/context/DAppKitClientProvider").then((mod) => mod.ConnectButton),
  { ssr: false, loading: () => <button disabled>Loading...</button> },
);

export default function Home() {
  return (
    <DAppKitClientProvider>
      <div>Hello sprinkle!</div>
      <ConnectButton />
    </DAppKitClientProvider>
  );
}
