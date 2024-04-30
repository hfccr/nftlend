"use client";

import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function Borrow() {
  const { address } = useAccount();
  const { writeContractAsync: writeSampleNftAsync } = useScaffoldWriteContract("SampleNFT");
  const { data: numberOfNftsOwned } = useScaffoldReadContract({
    contractName: "SampleNFT",
    functionName: "balanceOf",
    args: [address],
  });
  const { isSuccess: listingFetchSuccess, data: listings } = useScaffoldReadContract({
    contractName: "NFTLend",
    functionName: "getListingsForUser",
    args: [address],
  });
  let nftsStaked = 0;
  let totalBorrowed = 0n;
  if (listingFetchSuccess) {
    nftsStaked = listings ? listings?.length : 0;
    listings?.forEach(listing => (totalBorrowed += listing.amount));
  }
  const onMint = async () => {
    try {
      await writeSampleNftAsync({
        functionName: "mint",
      });
    } catch (e) {
      console.log("Error in minting");
    }
  };
  return (
    <>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">NFTs</div>
          <div className="stat-value">{numberOfNftsOwned?.toString()}</div>
          <div className="stat-actions">
            <button className="btn btn-sm btn-sm" onClick={onMint}>
              Mint
            </button>
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">NFTs Staked</div>
          <div className="stat-value">{nftsStaked}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Borrowed</div>
          <div className="stat-value">{formatEther(totalBorrowed)} ETH</div>
        </div>
      </div>
      <>Show minted NFTs</>
      <>Show listed NFTs</>
    </>
  );
}
