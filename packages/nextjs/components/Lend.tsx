"use client";

import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface StatusMap {
  [key: string]: any;
}

const listingStatusMap: StatusMap = {
  "0": "Listed",
  "1": "Deal Made",
  "2": "Repaid",
  "3": "Cancelled",
  "4": "Siezed",
};

export default function Lend() {
  const { address } = useAccount();
  const { writeContractAsync: writeSampleNftAsync } = useScaffoldWriteContract("SampleNFT");
  const { writeContractAsync: writeNftLendAsync } = useScaffoldWriteContract("NFTLend");
  const { isSuccess: nftFetchSuccess, data: sampleNfts } = useScaffoldReadContract({
    contractName: "SampleNFT",
    functionName: "getAllTokensOwnedByAddress",
    args: [address],
  });
  const { isSuccess: listingFetchSuccess, data: listings } = useScaffoldReadContract({
    contractName: "NFTLend",
    functionName: "getAllListings",
  });
  let numberOfNftsOwned;
  if (nftFetchSuccess) {
    numberOfNftsOwned = sampleNfts?.length;
  }
  let lendingDealsMade = 0;
  let totalLent = 0n;
  if (listingFetchSuccess) {
    listings?.forEach(listing => {
      if (listing.lender === address) {
        lendingDealsMade++;
        totalLent += listing.amount;
      }
    });
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

  const onLend = async (tokenId: bigint, value: bigint) => {
    try {
      await writeNftLendAsync({
        functionName: "lend",
        args: [tokenId],
        value: value,
      });
    } catch (e) {
      console.log("Error in lending");
    }
  };

  const onSieze = async (listingId: bigint) => {
    try {
      await writeNftLendAsync({
        functionName: "siezeNft",
        args: [listingId],
      });
    } catch (e) {
      console.log("Error in lending");
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
          <div className="stat-title">NFTs Owned</div>
          <div className="stat-value">{numberOfNftsOwned?.toString()}</div>
          <div className="stat-actions">
            <button className="btn btn-sm btn-sm" onClick={onMint}>
              Mint
            </button>
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Deals Made</div>
          <div className="stat-value">{lendingDealsMade}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Lent</div>
          <div className="stat-value">{formatEther(totalLent)} ETH</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>NFT ID</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Interest</th>
              <th>Lend</th>
              <th>Sieze</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(listings) &&
              listings.map(listing => {
                return (
                  <tr key={listing.nftId.toString()}>
                    <td>{listing.nftId.toString()}</td>
                    <td>{listingStatusMap[listing.status.toString()]}</td>
                    <td>{formatEther(listing.amount.toString()) + " ETH"}</td>
                    <td>{formatEther(listing.fees.toString()) + " ETH"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-sm"
                        disabled={listing.status.toString() !== "0"}
                        onClick={() => {
                          onLend(listing.id, listing.amount);
                        }}
                      >
                        {listing.lender === address ? "Lended" : "Lend"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-sm"
                        disabled={listing.status.toString() !== "1" || listing.lender !== address}
                        onClick={() => {
                          onSieze(listing.id);
                        }}
                      >
                        Sieze
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}
