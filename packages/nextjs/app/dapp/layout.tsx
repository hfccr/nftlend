"use client";

import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

const DappLayout = ({ children }: { children: React.ReactNode }) => {
  const { chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const writeDisabled = !chain || chain?.id !== targetNetwork.id;
  return (
    <>
      {writeDisabled && (
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <div>
                <div role="alert" className="alert">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-info shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Connect Wallet To Continue</span>
                  <div>
                    <RainbowKitCustomConnectButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!writeDisabled && children}
    </>
  );
};

export default DappLayout;
