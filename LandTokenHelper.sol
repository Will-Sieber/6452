// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 < 0.9.0;

import "./LandToken.sol";

contract LandTokenHelper {
    LandToken public LandTokenInstance;

    constructor(address landTokenAddress) {
        LandTokenInstance = LandToken(landTokenAddress);
    }

    function findSmallest(uint256[] memory numbers) public pure returns (uint256) {
        require(numbers.length > 0, "Array must not be empty");

        uint256 smallest = numbers[0];
        for (uint256 i = 1; i < numbers.length; i++) {
            if (numbers[i] < smallest) {
                smallest = numbers[i];
            }
        }

        return smallest;
    }
    
    function mergeTokens(uint256[] calldata tokenIds) public returns (bool) {
        // Get the ERC721 contract instance using the IERC721 interface

        // Check we have permission to modify all of the tokens we've been given
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (LandTokenInstance.getApproved(tokenIds[i]) != address(this)) {
                return false;
            }
        }
        // We have permission to modify all these tokens.
        // Let's get the one with the lowest token ID and then we can burn the others
        uint256 smallestTokenId = findSmallest(tokenIds);
        for (uint256 i=0; i < tokenIds.length; i++) {
            if (tokenIds[i] != smallestTokenId) {
                // Burn the token
                LandTokenInstance.burn(tokenIds[i]);
            }
        }

        return true;
    }

}