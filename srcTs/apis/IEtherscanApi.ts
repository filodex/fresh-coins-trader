interface options {
    address: string
    contractAddress: string
}

export interface returnValueOfGetWalletTokenBalanceForSingleAddressByContractAddress {
    tokenBalance: { a: string }
}

export interface returnValueOfGetWalletEtherBalanceForSingleAddress {
    etherBalance: number
    weiBalance: string
}

export interface returnGetListOfTokenTransfers {
    listOfTokenTransfers: {
        blockNumber: string
        timeStamp: string
        hash: string
        nonce: string
        blockHash: string
        from: string
        contractAddress: string
        to: string
        value: string
        tokenName: string
        tokenSymbol: string
        tokenDecimal: string
        transactionIndex: string
        gas: string
        gasPrice: string
        gasUsed: string
        cumulativeGasUsed: string
        input: string
        confirmations: string
    }[]
}

export interface IEtrescanApi {}
