// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 < 0.9.0;

import "./LandToken.sol";

contract LandTokenHelper is LandToken {

    function createLandTokenMetadata(uint256 lat1, uint256 long1, uint256 lat2, uint256 long2, uint256 lat3, uint256 long3) internal pure returns (string memory) {
        string memory json = string(abi.encodePacked(
            '{"lat1": ', Strings.toString(lat1),
            ', "long1": ', Strings.toString(long1),
            ', "lat2": ', Strings.toString(lat2),
            ', "long2": ', Strings.toString(long2),
            ', "lat3": ', Strings.toString(lat3),
            ', "long3": ', Strings.toString(long3),
            '}'
        ));
        
        return json;
    }

    function generateURLPath(string memory json) internal pure returns (string memory) {
        string memory baseURI = "https://example.com/land-tokens/";
        string memory fileName = string(abi.encodePacked(sha256(bytes(json)), ".json"));
        string memory path = string(abi.encodePacked(baseURI, fileName));
        
        return path;
    }
}