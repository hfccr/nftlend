//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTLend {
	address owner;
	enum Duration {
		Small,
		Medium,
		Large
	}
	enum Status {
		Listed,
		DealMade,
		Repaid,
		ListingCancelled,
		DealLiquidated
	}

	struct Listing {
		uint256 id;
		address nftDepositor;
		address nftCollection;
		uint256 nftId;
		address lender;
		uint256 amount;
		uint256 fees;
		uint256 duration;
		Status status;
		uint256 startTime;
		uint256 listingTime;
	}

	mapping(address => mapping(uint256 => bool)) public tokenListed;

	mapping(address => Listing[]) public userListings;

	Listing[] public listings;
	mapping(Duration => uint256) public durationToTime;

	constructor() {
		owner = msg.sender;
		durationToTime[Duration.Small] = 0 minutes;
		durationToTime[Duration.Medium] = 1 minutes;
		durationToTime[Duration.Large] = 1 hours;
	}

	function createListing(
		address _nftCollection,
		uint256 _nftId,
		uint256 _fees,
		Duration duration,
		uint256 _amount
	) public {
		// Prerequisite: Approve contract for transfer
		require(!tokenListed[_nftCollection][_nftId], "Token already listed");
		// Require current owner to be msg sender
		require(
			IERC721(_nftCollection).ownerOf(_nftId) == msg.sender,
			"Only the owner can list the token"
		);
		IERC721(_nftCollection).transferFrom(msg.sender, address(this), _nftId);
		listings.push(
			Listing({
				id: listings.length,
				nftDepositor: msg.sender,
				nftCollection: _nftCollection,
				nftId: _nftId,
				lender: address(0),
				fees: _fees,
				status: Status.Listed,
				duration: durationToTime[duration],
				amount: _amount,
				startTime: 0,
				listingTime: block.timestamp
			})
		);
		tokenListed[_nftCollection][_nftId] = true;
		userListings[msg.sender].push(listings[listings.length - 1]);
	}

	function cancelListing(uint256 _index) public {
		Listing storage listing = listings[_index];
		require(
			listing.nftDepositor == msg.sender,
			"Only the depositor can cancel the listing"
		);
		require(
			listing.status == Status.Listed,
			"Listing must be in the Listed state"
		);
		listing.status = Status.ListingCancelled;
		IERC721(listing.nftCollection).transferFrom(
			address(this),
			msg.sender,
			listing.nftId
		);
	}

	function lend(uint256 _index) public payable {
		Listing storage listing = listings[_index];
		require(
			listing.status == Status.Listed,
			"Listing must be in the Listed state"
		);
		require(
			msg.value == listing.amount,
			"Amount must be equal to requested amount"
		);
		listing.lender = msg.sender;
		listing.status = Status.DealMade;
		listing.startTime = block.timestamp;
	}

	function repay(uint256 _index) public payable {
		Listing storage listing = listings[_index];
		require(
			msg.value >= listing.amount + listing.fees,
			"Amount must be equal to requested amount plus fees"
		);
		require(
			listing.status == Status.DealMade,
			"Listing must be in the DealMade state"
		);
		require(
			msg.sender == listing.nftDepositor,
			"Only the nft depositor can repay the loan"
		);
		require(
			block.timestamp <= listing.startTime + listing.duration,
			"Loan duration over"
		);
		listing.status = Status.Repaid;
		// Transfer money to lender
		payable(listing.lender).transfer(listing.amount + listing.fees);
		IERC721(listing.nftCollection).transferFrom(
			address(this),
			msg.sender,
			listing.nftId
		);
	}

	function siezeNft(uint256 _index) public {
		Listing storage listing = listings[_index];
		require(
			listing.status == Status.DealMade,
			"Listing must be in the DealMade state"
		);
		// Check if current timestamp is greater than the start timestamp + duration
		require(
			block.timestamp >= listing.startTime + listing.duration,
			"Loan duration not over"
		);

		listing.status = Status.DealLiquidated;
		IERC721(listing.nftCollection).transferFrom(
			address(this),
			listing.lender,
			listing.nftId
		);
	}

	function getBlockTimestamp() public view returns (uint256) {
		return block.timestamp;
	}

	function getLoanEndTime(uint256 _index) public view returns (uint256) {
		Listing storage listing = listings[_index];
		return listing.startTime + listing.duration;
	}

	function getAllListings() public view returns (Listing[] memory) {
		return listings;
	}

	function getListingsForUser(
		address _user
	) public view returns (Listing[] memory) {
		return userListings[_user];
	}

	function getOwner() public view returns (address) {
		return owner;
	}

	function getPendingDuration(uint256 _index) public view returns (uint256) {
		Listing storage listing = listings[_index];
		return listing.startTime + listing.duration - block.timestamp;
	}
}
