// Sources flattened with hardhat v2.19.4 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/introspection/IERC165.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/token/ERC721/IERC721.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC721/IERC721.sol)

pragma solidity ^0.8.0;

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface IERC721 is IERC165 {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the caller.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}


// File contracts/NFTLend.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;
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