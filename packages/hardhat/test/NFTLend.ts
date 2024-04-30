import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTLend } from "../typechain-types";
import { SampleNFT } from "../typechain-types";

describe("NFTLend", function () {
  // We define a fixture to reuse the same setup in every test.

  let nftLend: NFTLend;
  let sampleNft: SampleNFT;
  before(async () => {
    const [nftOwner] = await ethers.getSigners();
    const nftLendFactory = await ethers.getContractFactory("NFTLend");
    nftLend = (await nftLendFactory.deploy()) as NFTLend;
    await nftLend.waitForDeployment();
    const sampleNftFactory = await ethers.getContractFactory("SampleNFT");
    sampleNft = (await sampleNftFactory.deploy()) as SampleNFT;
    await sampleNft.waitForDeployment();
    sampleNft.connect(nftOwner).mint();
    sampleNft.connect(nftOwner).mint();
    sampleNft.connect(nftOwner).mint();
    const nftLendAddress = nftLend.target;
    sampleNft.connect(nftOwner).setApprovalForAll(nftLendAddress, true);
  });

  describe("Deployment", function () {
    it("Should have no listings on deploy", async function () {
      expect(await nftLend.getAllListings()).to.be.an("array").that.is.empty;
    });
  });

  describe("Listing", function () {
    it("Should allow to create a listing", async function () {
      const [nftOwner] = await ethers.getSigners();
      const sampleNftAddress = sampleNft.target;
      await nftLend.connect(nftOwner).createListing(sampleNftAddress, 1, 10, 1, 100);
      const [id, nftDepositor, nftCollection, nftId, lender, amount, fees, duration, status, startTime] =
        await nftLend.listings(0);
      expect(id).to.equal(0);
      expect(nftDepositor).to.equal(nftOwner.address);
      expect(nftCollection).to.equal(sampleNft.target);
      expect(nftId).to.equal(1);
      expect(lender).to.equal(ethers.ZeroAddress);
      expect(amount).to.equal(100n);
      expect(fees).to.equal(10n);
      expect(duration).to.equal(60n);
      expect(status).to.equal(0n);
      expect(startTime).to.equal(0n);
      const tokenOwner = await sampleNft.ownerOf(1);
      expect(tokenOwner).to.equal(nftLend.target);
    });
  });

  describe("Lending", function () {
    it("Should not allow to lend for a listing for lesser value", async function () {
      const [, lender] = await ethers.getSigners();
      await expect(nftLend.connect(lender).lend(0, { value: 90 })).to.be.revertedWith(
        "Amount must be equal to requested amount",
      );
    });
    it("Should allow to lend for a listing", async function () {
      const [, lender] = await ethers.getSigners();
      await nftLend.connect(lender).lend(0, { value: 100 });
      const [, , , nftId, _lender, , , , ,] = await nftLend.listings(0);
      expect(nftId).to.equal(1);
      expect(_lender).to.equal(lender.address);
    });
    it("Should not allow to lend for a listing that is already lent", async function () {
      const [, lender] = await ethers.getSigners();
      await expect(nftLend.connect(lender).lend(0, { value: 100 })).to.be.revertedWith(
        "Listing must be in the Listed state",
      );
    });
  });

  describe("Repayment", function () {
    it("Should allow to repay a listing", async function () {
      const [nftOwner, lender] = await ethers.getSigners();
      await nftLend.connect(nftOwner).repay(0, { value: 110 });
      const [, , , nftId, _lender, , , , status] = await nftLend.listings(0);
      expect(nftId).to.equal(1);
      expect(_lender).to.equal(lender.address);
      expect(status).to.equal(2);
      const tokenOwner = await sampleNft.ownerOf(1);
      expect(tokenOwner).to.equal(nftOwner.address);
    });
    it("Should not allow to repay a listing that is already repaid", async function () {
      const [, lender] = await ethers.getSigners();
      await expect(nftLend.connect(lender).repay(0, { value: 110 })).to.be.revertedWith(
        "Listing must be in the DealMade state",
      );
    });
  });
});
