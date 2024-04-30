// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SampleNFT is ERC721 {
	using Counters for Counters.Counter;
	Counters.Counter private _tokenIds;

	constructor() ERC721("SampleNFT", "SNFT") {}

	function minted() external view returns (uint256) {
		return _tokenIds.current();
	}

	function mint() external {
		_tokenIds.increment();
		uint256 newTokenId = _tokenIds.current();
		_mint(msg.sender, newTokenId);
	}

	function getAllTokensOwnedByAddress(address _owner) external view returns (uint256[] memory) {
		uint256 tokenCount = balanceOf(_owner);
		uint256[] memory tokenIds = new uint256[](tokenCount);
		uint256 tokensFound = 0;
		for (uint256 i = 1; i <= _tokenIds.current(); i++) {
			if (_owner == ownerOf(i)) {
				tokenIds[tokensFound] = i;
				tokensFound++;
			}
		}
		return tokenIds;
	}
}
