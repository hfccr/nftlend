"use client";

import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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

export default function Borrow() {
  const { address } = useAccount();
  const { writeContractAsync: writeSampleNftAsync } = useScaffoldWriteContract("SampleNFT");
  const { writeContractAsync: writeNftLendAsync } = useScaffoldWriteContract("NFTLend");
  const { data: sampleNftDeployedContractData } = useDeployedContractInfo("SampleNFT");
  const { data: nftLendDeployedContractData } = useDeployedContractInfo("NFTLend");
  const { isSuccess: nftFetchSuccess, data: sampleNfts } = useScaffoldReadContract({
    contractName: "SampleNFT",
    functionName: "getAllTokensOwnedByAddress",
    args: [address],
  });
  const { data: approved } = useScaffoldReadContract({
    contractName: "SampleNFT",
    functionName: "isApprovedForAll",
    args: [address, nftLendDeployedContractData?.address],
  });
  const { isSuccess: listingFetchSuccess, data: allListings } = useScaffoldReadContract({
    contractName: "NFTLend",
    functionName: "getAllListings",
  });
  let numberOfNftsOwned;
  if (nftFetchSuccess) {
    numberOfNftsOwned = sampleNfts?.length;
  }
  let nftsStaked = 0;
  let totalBorrowed = 0n;
  console.log("all listings are");
  console.log(allListings);
  const listings = Array.isArray(allListings) ? allListings.filter(listing => listing.nftDepositor === address) : [];
  console.log("Listings are", listings);
  interface TokenIdToListing {
    [key: string]: any;
  }
  const nfts = sampleNfts ? sampleNfts?.map(nft => nft) : [];
  const listingByTokenId: TokenIdToListing = {};
  if (listingFetchSuccess) {
    nftsStaked = listings ? listings?.length : 0;
    listings?.forEach(listing => {
      const id = listing.nftId.toString();
      totalBorrowed += listing.amount;
      if (listing.nftCollection === sampleNftDeployedContractData?.address) {
        if (nfts.indexOf(listing.nftId) < 0) {
          nfts.push(listing.nftId);
        }
        listingByTokenId[id] = listing;
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

  const onApprove = async () => {
    try {
      await writeSampleNftAsync({
        functionName: "setApprovalForAll",
        args: [nftLendDeployedContractData?.address, true],
      });
    } catch (e) {
      console.log("Error in approving");
    }
  };

  const onStake = async (tokenId: bigint) => {
    try {
      await writeNftLendAsync({
        functionName: "createListing",
        args: [sampleNftDeployedContractData?.address, tokenId, parseEther("0.5"), 0, parseEther("1")],
      });
    } catch (e) {
      console.log("Error in approving");
    }
  };

  const onRepay = async (tokenId: bigint, amount: bigint, fees: bigint) => {
    try {
      await writeNftLendAsync({
        functionName: "repay",
        args: [tokenId],
        value: amount + fees,
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
          <div className="stat-title">NFTs Staked</div>
          <div className="stat-value">{nftsStaked}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Borrowed</div>
          <div className="stat-value">{formatEther(totalBorrowed)} ETH</div>
        </div>
      </div>
      {!approved && (
        <div className="alert alert-warning">
          Please approve the contract to interact with it
          <button className="btn btn-secondary btn-sm" onClick={onApprove}>
            Approve
          </button>
        </div>
      )}
      {approved && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>NFT ID</th>
                <th>Status</th>
                <th>Borrowed</th>
                <th>Stake</th>
                <th>Repay</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(nfts) &&
                nfts.map(nft => {
                  const listing = listingByTokenId[nft.toString()];
                  console.log("ListingsByTokenId", listingByTokenId);
                  return (
                    <tr key={nft.toString()}>
                      <td>{nft.toString()}</td>
                      <td>{listing ? listingStatusMap[listing.status.toString()] : "Not Staked"}</td>
                      <td>
                        {listing
                          ? (listing.status === 0 ? "Waiting For " : "") + formatEther(listing?.amount) + "ETH"
                          : ""}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-sm"
                          disabled={listing !== undefined}
                          onClick={() => {
                            onStake(nft);
                          }}
                        >
                          Stake
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-sm"
                          disabled={!listing || listing.status.toString() !== "1"}
                          onClick={() => {
                            onRepay(listing.id, listing.amount, listing.fees);
                          }}
                        >
                          Repay
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
