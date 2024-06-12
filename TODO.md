#### Known Bugs:

- [ ] Write actions not working related to [this](https://tevm.sh/learn/actions/#wallet-actions), but is there a way we could pass current connected account ?
- [ ] The wallet is not able to connect tevm chain(once fixed burner-wallet will also hopefully work)
- [ ] `next build` fails.

#### Improvements:

- [ ] We need to do compile + deploy 2 times to make it work, since in first `/debug` is not fetched
- [ ] Allow configuring of different complier versions
- [ ] Update logic for worker, compilation to be more robust like contract name etc
