// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 < 0.9.0;

import "./node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";        
import "@openzeppelin/contracts/drafts/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract LandToken is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721Full("LandToken", "LAND") public {
    }

    // Things we need

    // Mint function
    // - Called by the backend once it has created the token uri json
    // - Mints the token and assigns it to the user


    string json = createLandTokenMetadata(lat1, long1, lat2, long2, lat3, long3);
    string path = generateURLPath(json);
    uint256 tokenId = LandToken.mint(recipient, path);

}