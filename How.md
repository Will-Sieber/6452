# The flow:
## Creation of a token
1. User logs onto frontend, submits appropriate documents proving ownership of the land
2. Backend creates JSON file (the URI) providing a bounding box of the land
3. Backend calls the mint function of the smart contract, passing the URI and the user's address
4. Smart contract mints the token, and it is given to the user

### Result:
The user has been given a token, which stores a bounding box of the area that they own.

## Splitting a token
1. User logs onto frontend, selects the land plot they wish to split, and draws(?) the new area they want to split off from this main block.
2. Frontend calls the backend, passing the new bounding box of the old token, and the bounding box that will be used for the new token
3. a. Backend modifies the JSON URI for the original token, removing the new area
3. b. Backend creates a new JSON URI for the new token, containing the new area
4. Backend calls the mint function of the smart contract, passing the URI of the new token and the user's address
5. The smart contract mints a new token, and this is given to the user.

### Result:
The original token has had its area reduced, with that area now being in the new token, which has been minted and given to the user.

## Merging tokens
1. The user logs onto the frontend, selects a land plot, and an additional plot that is adjacent to it.
2. The frontend calls the backend, passing the bounding boxes of the two tokens.
3. The backend modifies the bounding box of the first token, extending it to include the bounding box of the second token. 
This is updated in the JSON URI.
4. The backend calls the burn function of the smart contract, passing the URI of the second token, and the user's address.
5. The smart contract burns the second token.

### Result:
The original token has had its area increased, with that new area being that of the second token. The second token has been destroyed.

## Transfer of tokens
This is a standard ERC721 transfer, and hopefully doesn't need anything specifically written to support it.